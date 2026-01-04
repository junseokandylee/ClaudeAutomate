/**
 * SessionManager Service Tests - REQ-001
 *
 * TAG-TEST-002: SessionManager TDD Tests
 *
 * Test Coverage:
 * - Session orchestration
 * - Wave-by-wave execution
 * - Maximum parallel session limit enforcement
 * - Session status tracking
 * - Completion and failure handling
 * - IPC communication with renderer
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SessionManager } from '../session-manager.service';
import { ClaudeSession } from '../claude-session';
import { WorktreeManagerService } from '../worktree-manager.service';
import type { ExecutionPlan, Wave, SessionInfo, SpecInfo } from '@/shared/types';

// Mock ClaudeSession
vi.mock('../claude-session', () => ({
  ClaudeSession: vi.fn(),
}));

// Mock WorktreeManagerService
vi.mock('../worktree-manager.service', () => ({
  WorktreeManagerService: vi.fn().mockImplementation(() => ({
    createWorktree: vi.fn().mockResolvedValue('/worktrees/test-spec'),
    removeWorktree: vi.fn().mockResolvedValue(undefined),
    cleanupAll: vi.fn().mockResolvedValue(undefined),
  })),
}));

// Mock electron
vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
    on: vi.fn(),
  },
  BrowserWindow: {
    getAllWindows: vi.fn(() => []),
  },
}));

describe('SessionManager', () => {
  let sessionManager: SessionManager;
  const mockClaudePath = '/usr/local/bin/claude';
  const mockMaxParallel = 3;

  // Mock execution plan
  const mockSpecs: SpecInfo[] = [
    {
      id: 'SPEC-001',
      title: 'Test SPEC 1',
      filePath: '/specs/SPEC-001.md',
      status: 'pending',
      dependencies: [],
    },
    {
      id: 'SPEC-002',
      title: 'Test SPEC 2',
      filePath: '/specs/SPEC-002.md',
      status: 'pending',
      dependencies: [],
    },
    {
      id: 'SPEC-003',
      title: 'Test SPEC 3',
      filePath: '/specs/SPEC-003.md',
      status: 'pending',
      dependencies: ['SPEC-001'],
    },
  ];

  const mockPlan: ExecutionPlan = {
    waves: [
      {
        waveNumber: 1,
        specs: [mockSpecs[0], mockSpecs[1]], // SPEC-001, SPEC-002 can run in parallel
      },
      {
        waveNumber: 2,
        specs: [mockSpecs[2]], // SPEC-003 depends on SPEC-001
      },
    ],
    totalSpecs: 3,
    estimatedParallelism: 2,
  };

  // Mock sessions
  const mockSessions = new Map<string, any>();

  beforeEach(() => {
    vi.clearAllMocks();
    mockSessions.clear();

    // Mock ClaudeSession constructor
    vi.mocked(ClaudeSession).mockImplementation(
      (specId: string, worktreePath: string, claudePath: string) => {
        const mockSession = {
          id: `session-${specId}`,
          specId,
          worktreePath,
          status: 'idle',
          output: '',
          error: null,
          startedAt: null,
          completedAt: null,
          start: vi.fn().mockResolvedValue(undefined),
          stop: vi.fn(),
          send: vi.fn(),
          on: vi.fn(),
          waitForCompletion: vi.fn().mockResolvedValue(undefined),
          toSessionInfo: vi.fn().mockReturnValue({
            id: `session-${specId}`,
            specId,
            status: 'idle',
            worktreePath,
            startedAt: new Date().toISOString(),
            output: '',
            error: null,
          }),
          destroy: vi.fn(),
        };

        mockSessions.set(specId, mockSession);
        return mockSession as any;
      }
    );

    sessionManager = new SessionManager(mockClaudePath, mockMaxParallel);
  });

  afterEach(() => {
    sessionManager.destroy();
  });

  describe('constructor', () => {
    it('should create session manager with configuration', () => {
      expect(sessionManager).toBeDefined();
      expect(sessionManager['maxParallel']).toBe(mockMaxParallel);
      expect(sessionManager['claudePath']).toBe(mockClaudePath);
    });

    it('should initialize with no active sessions', () => {
      expect(sessionManager.getActiveSessions()).toHaveLength(0);
    });
  });

  describe('startExecution', () => {
    it('should execute plan wave by wave', async () => {
      const waveCompleteSpy = vi.fn();
      sessionManager.on('wave:complete', waveCompleteSpy);

      await sessionManager.startExecution(mockPlan);

      // Should complete all waves
      expect(waveCompleteSpy).toHaveBeenCalledTimes(2);
    });

    it('should respect maximum parallel session limit', async () => {
      const planWithManySpecs: ExecutionPlan = {
        waves: [
          {
            waveNumber: 1,
            specs: Array.from({ length: 5 }, (_, i) => ({
              id: `SPEC-${i}`,
              title: `SPEC ${i}`,
              filePath: `/specs/SPEC-${i}.md`,
              status: 'pending',
              dependencies: [],
            })),
          },
        ],
        totalSpecs: 5,
        estimatedParallelism: 3,
      };

      // Track concurrent sessions
      let maxConcurrent = 0;
      const trackingInterval = setInterval(() => {
        const concurrent = sessionManager.getActiveSessions().length;
        if (concurrent > maxConcurrent) {
          maxConcurrent = concurrent;
        }
      }, 10);

      await sessionManager.startExecution(planWithManySpecs);

      clearInterval(trackingInterval);

      // Should not exceed max parallel limit
      expect(maxConcurrent).toBeLessThanOrEqual(mockMaxParallel);
    });

    it('should create sessions for each SPEC', async () => {
      await sessionManager.startExecution(mockPlan);

      // Should have created 3 sessions
      expect(ClaudeSession).toHaveBeenCalledTimes(3);
    });

    it('should wait for wave completion before starting next', async () => {
      const waveStartSpy = vi.fn();
      const waveCompleteSpy = vi.fn();

      sessionManager.on('wave:start', waveStartSpy);
      sessionManager.on('wave:complete', waveCompleteSpy);

      await sessionManager.startExecution(mockPlan);

      // Wave 1 should start and complete before wave 2
      expect(waveStartSpy).toHaveBeenCalledTimes(2);
      expect(waveCompleteSpy).toHaveBeenCalledTimes(2);

      // Verify order
      const calls = waveStartSpy.mock.calls.map((call) => call[0].waveNumber);
      expect(calls).toEqual([1, 2]);
    });

    it('should handle partial wave failures gracefully', async () => {
      // Make SPEC-002 fail
      const spec2Session = mockSessions.get('SPEC-002');
      spec2Session.waitForCompletion.mockRejectedValue(new Error('Session failed'));

      // Should not throw, should complete with failures
      await expect(sessionManager.startExecution(mockPlan)).resolves.not.toThrow();

      // Should have 2 completed, 1 failed
      const sessions = sessionManager.getActiveSessions();
      const failed = sessions.filter((s) => s.status === 'failed');
      expect(failed.length).toBeGreaterThan(0);
    });

    it('should emit events on execution start and complete', async () => {
      const startSpy = vi.fn();
      const completeSpy = vi.fn();

      sessionManager.on('execution:start', startSpy);
      sessionManager.on('execution:complete', completeSpy);

      await sessionManager.startExecution(mockPlan);

      expect(startSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('stopExecution', () => {
    it('should stop all running sessions', async () => {
      await sessionManager.startExecution(mockPlan);

      await sessionManager.stopExecution();

      // All sessions should be stopped
      mockSessions.forEach((session) => {
        expect(session.stop).toHaveBeenCalled();
      });
    });

    it('should emit stopped event', async () => {
      const stoppedSpy = vi.fn();
      sessionManager.on('execution:stopped', stoppedSpy);

      await sessionManager.startExecution(mockPlan);
      await sessionManager.stopExecution();

      expect(stoppedSpy).toHaveBeenCalled();
    });

    it('should handle stop when no sessions running', async () => {
      await expect(sessionManager.stopExecution()).resolves.not.toThrow();
    });

    it('should prevent new sessions from starting', async () => {
      // Start execution
      const executionPromise = sessionManager.startExecution(mockPlan);

      // Immediately stop
      await sessionManager.stopExecution();

      // Wait for execution to complete (should be aborted)
      await executionPromise;

      // Should have fewer completed sessions than total
      const activeSessions = sessionManager.getActiveSessions();
      expect(activeSessions.length).toBeLessThan(mockPlan.totalSpecs);
    });
  });

  describe('getActiveSessions', () => {
    it('should return all active sessions', async () => {
      await sessionManager.startExecution(mockPlan);

      const sessions = sessionManager.getActiveSessions();

      expect(sessions).toHaveLength(3);
      sessions.forEach((session) => {
        expect(session).toHaveProperty('id');
        expect(session).toHaveProperty('specId');
        expect(session).toHaveProperty('status');
      });
    });

    it('should return empty array when no sessions', () => {
      const sessions = sessionManager.getActiveSessions();
      expect(sessions).toEqual([]);
    });

    it('should update session status in real-time', async () => {
      await sessionManager.startExecution(mockPlan);

      const sessions = sessionManager.getActiveSessions();
      const running = sessions.filter((s) => s.status === 'running' || s.status === 'completed');

      expect(running.length).toBeGreaterThan(0);
    });
  });

  describe('getSession', () => {
    it('should return session by ID', async () => {
      await sessionManager.startExecution(mockPlan);

      const sessions = sessionManager.getActiveSessions();
      const firstSession = sessions[0];

      const session = sessionManager.getSession(firstSession.id);

      expect(session).toBeDefined();
      expect(session?.id).toBe(firstSession.id);
    });

    it('should return undefined for non-existent session', () => {
      const session = sessionManager.getSession('non-existent');
      expect(session).toBeUndefined();
    });
  });

  describe('event emission', () => {
    it('should emit session:created when session is created', async () => {
      const createdSpy = vi.fn();
      sessionManager.on('session:created', createdSpy);

      await sessionManager.startExecution(mockPlan);

      expect(createdSpy).toHaveBeenCalledTimes(3);
    });

    it('should emit session:started when session starts', async () => {
      const startedSpy = vi.fn();
      sessionManager.on('session:started', startedSpy);

      await sessionManager.startExecution(mockPlan);

      expect(startedSpy).toHaveBeenCalledTimes(3);
    });

    it('should emit session:completed when session completes', async () => {
      const completedSpy = vi.fn();
      sessionManager.on('session:completed', completedSpy);

      await sessionManager.startExecution(mockPlan);

      expect(completedSpy).toHaveBeenCalled();
    });

    it('should emit session:failed when session fails', async () => {
      // Make a session fail
      const spec1Session = mockSessions.get('SPEC-001');
      spec1Session.status = 'failed';
      spec1Session.error = 'Test failure';
      spec1Session.waitForCompletion.mockRejectedValue(new Error('Test failure'));

      const failedSpy = vi.fn();
      sessionManager.on('session:failed', failedSpy);

      await sessionManager.startExecution(mockPlan);

      expect(failedSpy).toHaveBeenCalled();
    });

    it('should emit session:output when session produces output', async () => {
      const outputSpy = vi.fn();
      sessionManager.on('session:output', outputSpy);

      await sessionManager.startExecution(mockPlan);

      // Simulate output from a session
      const spec1Session = mockSessions.get('SPEC-001');
      const dataCallback = spec1Session.on.mock.calls.find((call) => call[0] === 'data');
      if (dataCallback) {
        dataCallback[1]('Test output');
      }

      expect(outputSpy).toHaveBeenCalled();
    });
  });

  describe('wave execution', () => {
    it('should execute waves in correct order', async () => {
      const waveOrder: number[] = [];

      sessionManager.on('wave:start', (wave) => {
        waveOrder.push(wave.waveNumber);
      });

      await sessionManager.startExecution(mockPlan);

      expect(waveOrder).toEqual([1, 2]);
    });

    it('should not start next wave until current completes', async () => {
      let wave1Complete = false;

      sessionManager.on('wave:complete', (wave) => {
        if (wave.waveNumber === 1) {
          wave1Complete = true;
        }
      });

      sessionManager.on('wave:start', (wave) => {
        if (wave.waveNumber === 2) {
          expect(wave1Complete).toBe(true);
        }
      });

      await sessionManager.startExecution(mockPlan);
    });

    it('should respect wave dependencies', async () => {
      // SPEC-003 depends on SPEC-001
      const spec1Session = mockSessions.get('SPEC-001');
      const spec3Session = mockSessions.get('SPEC-003');

      let spec1StartTime: number | null = null;
      let spec3StartTime: number | null = null;

      // Track start times
      spec1Session.start.mockImplementation(async () => {
        spec1StartTime = Date.now();
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      spec3Session.start.mockImplementation(async () => {
        spec3StartTime = Date.now();
      });

      await sessionManager.startExecution(mockPlan);

      // SPEC-003 should start after SPEC-001
      expect(spec3StartTime).toBeGreaterThanOrEqual(spec1StartTime! + 100);
    });
  });

  describe('memory management', () => {
    it('should clean up completed sessions', async () => {
      await sessionManager.startExecution(mockPlan);

      // Wait a bit for cleanup
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Check that destroy was called on completed sessions
      mockSessions.forEach((session) => {
        if (session.status === 'completed' || session.status === 'failed') {
          expect(session.destroy).toHaveBeenCalled();
        }
      });
    });
  });

  describe('error handling', () => {
    it('should handle session spawn failures', async () => {
      vi.mocked(ClaudeSession).mockImplementationOnce(() => {
        throw new Error('Spawn failed');
      });

      // Should not throw, should handle gracefully
      await expect(sessionManager.startExecution(mockPlan)).resolves.not.toThrow();
    });

    it('should handle worktree creation failures', async () => {
      // Mock a failure in worktree creation
      const planWithInvalidWorktree: ExecutionPlan = {
        waves: [
          {
            waveNumber: 1,
            specs: [
              {
                id: 'SPEC-INVALID',
                title: 'Invalid SPEC',
                filePath: '/invalid/path/SPEC.md',
                status: 'pending',
                dependencies: [],
              },
            ],
          },
        ],
        totalSpecs: 1,
        estimatedParallelism: 1,
      };

      await expect(
        sessionManager.startExecution(planWithInvalidWorktree)
      ).resolves.not.toThrow();
    });
  });

  describe('IPC communication', () => {
    it('should send session updates to renderer', async () => {
      const updateSpy = vi.fn();
      sessionManager.on('session:update', updateSpy);

      await sessionManager.startExecution(mockPlan);

      expect(updateSpy).toHaveBeenCalled();
    });

    it('should send progress updates to renderer', async () => {
      const progressSpy = vi.fn();
      sessionManager.on('progress:update', progressSpy);

      await sessionManager.startExecution(mockPlan);

      expect(progressSpy).toHaveBeenCalled();
    });
  });
});
