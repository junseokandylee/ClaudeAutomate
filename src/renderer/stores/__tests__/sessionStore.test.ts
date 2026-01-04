/**
 * SessionStore Tests - REQ-004
 *
 * TAG-TEST-004: SessionStore TDD Tests
 *
 * Test Coverage:
 * - Store active sessions array
 * - Store execution plan
 * - Actions: startExecution, stopExecution, updateSession
 * - Sync with Main process via IPC
 * - Session state persistence
 * - Progress tracking
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sessionStore } from '../sessionStore';
import type { SessionInfo, ExecutionPlan } from '@/shared/types';

// Mock ElectronAPI
const mockSessions: Map<string, SessionInfo> = new Map();
const mockExecutionPlans: Map<string, ExecutionPlan> = new Map();

const mockElectronAPI = {
  // Session management
  startExecution: vi.fn(),
  stopExecution: vi.fn(),
  stopSession: vi.fn(),
  retrySession: vi.fn(),

  // Event listeners
  onSessionStarted: vi.fn(() => vi.fn()),
  onSessionOutput: vi.fn(() => vi.fn()),
  onSessionCompleted: vi.fn(() => vi.fn()),
  onSessionFailed: vi.fn(() => vi.fn()),
  onProgressUpdate: vi.fn(() => vi.fn()),
  onExecutionStarted: vi.fn(() => vi.fn()),
  onExecutionCompleted: vi.fn(() => vi.fn()),
  onExecutionStopped: vi.fn(() => vi.fn()),
};

// Setup global window.electronAPI
Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true,
});

describe('SessionStore', () => {
  beforeEach(() => {
    // Clear store state
    sessionStore.setState({
      sessions: [],
      executionPlan: null,
      isExecuting: false,
      progress: {
        total: 0,
        completed: 0,
        failed: 0,
        running: 0,
        percentage: 0,
      },
    });

    // Clear mocks
    vi.clearAllMocks();
    mockSessions.clear();
    mockExecutionPlans.clear();
  });

  afterEach(() => {
    // Cleanup store
    sessionStore.setState({
      sessions: [],
      executionPlan: null,
      isExecuting: false,
    });
  });

  describe('initial state', () => {
    it('should initialize with empty sessions array', () => {
      const state = sessionStore.getState();
      expect(state.sessions).toEqual([]);
    });

    it('should initialize with null execution plan', () => {
      const state = sessionStore.getState();
      expect(state.executionPlan).toBeNull();
    });

    it('should initialize with not executing state', () => {
      const state = sessionStore.getState();
      expect(state.isExecuting).toBe(false);
    });

    it('should initialize with zero progress', () => {
      const state = sessionStore.getState();
      expect(state.progress).toEqual({
        total: 0,
        completed: 0,
        failed: 0,
        running: 0,
        percentage: 0,
      });
    });
  });

  describe('startExecution', () => {
    const mockPlan: ExecutionPlan = {
      waves: [
        {
          waveNumber: 1,
          specs: [
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
          ],
        },
      ],
      totalSpecs: 2,
      estimatedParallelism: 2,
    };

    it('should set execution plan', async () => {
      mockElectronAPI.startExecution.mockResolvedValue(undefined);
      const { startExecution } = sessionStore.getState();

      await startExecution(mockPlan);

      const state = sessionStore.getState();
      expect(state.executionPlan).toEqual(mockPlan);
    });

    it('should set isExecuting to true', async () => {
      mockElectronAPI.startExecution.mockResolvedValue(undefined);
      const { startExecution } = sessionStore.getState();

      await startExecution(mockPlan);

      const state = sessionStore.getState();
      expect(state.isExecuting).toBe(true);
    });

    it('should initialize progress with total SPECs', async () => {
      mockElectronAPI.startExecution.mockResolvedValue(undefined);
      const { startExecution } = sessionStore.getState();

      await startExecution(mockPlan);

      const state = sessionStore.getState();
      expect(state.progress.total).toBe(2);
      expect(state.progress.completed).toBe(0);
      expect(state.progress.failed).toBe(0);
    });

    it('should call Main process startExecution', async () => {
      mockElectronAPI.startExecution.mockResolvedValue(undefined);

      const { startExecution } = sessionStore.getState();

      await startExecution(mockPlan);

      expect(mockElectronAPI.startExecution).toHaveBeenCalledWith(mockPlan);
    });

    it('should not start if already executing', async () => {
      mockElectronAPI.startExecution.mockResolvedValue(undefined);
      const { startExecution } = sessionStore.getState();

      // Start first execution
      await startExecution(mockPlan);

      // Try to start second execution
      await expect(startExecution(mockPlan)).rejects.toThrow();
    });

    it('should handle startExecution errors', async () => {
      mockElectronAPI.startExecution.mockRejectedValue(new Error('Start failed'));

      const { startExecution } = sessionStore.getState();

      await expect(startExecution(mockPlan)).rejects.toThrow('Start failed');

      // State should be reverted
      const state = sessionStore.getState();
      expect(state.executionPlan).toBeNull();
      expect(state.isExecuting).toBe(false);
    });
  });

  describe('stopExecution', () => {
    it('should set isExecuting to false', async () => {
      mockElectronAPI.startExecution.mockResolvedValue(undefined);
      mockElectronAPI.stopExecution.mockResolvedValue(undefined);

      const { startExecution, stopExecution } = sessionStore.getState();

      await startExecution({
        waves: [],
        totalSpecs: 0,
        estimatedParallelism: 0,
      });

      await stopExecution();

      const state = sessionStore.getState();
      expect(state.isExecuting).toBe(false);
    });

    it('should call Main process stopExecution', async () => {
      mockElectronAPI.stopExecution.mockResolvedValue(undefined);

      const { stopExecution } = sessionStore.getState();

      await stopExecution();

      expect(mockElectronAPI.stopExecution).toHaveBeenCalled();
    });

    it('should handle stopExecution errors gracefully', async () => {
      mockElectronAPI.stopExecution.mockRejectedValue(new Error('Stop failed'));

      const { stopExecution } = sessionStore.getState();

      // Should not throw
      await expect(stopExecution()).resolves.not.toThrow();
    });
  });

  describe('addSession', () => {
    const mockSession: SessionInfo = {
      id: 'session-001',
      specId: 'SPEC-001',
      status: 'idle',
      worktreePath: '/worktrees/SPEC-001',
      startedAt: new Date().toISOString(),
      output: '',
      error: null,
    };

    it('should add session to sessions array', () => {
      const { addSession } = sessionStore.getState();

      addSession(mockSession);

      const state = sessionStore.getState();
      expect(state.sessions).toHaveLength(1);
      expect(state.sessions[0]).toEqual(mockSession);
    });

    it('should add multiple sessions', () => {
      const { addSession } = sessionStore.getState();

      addSession(mockSession);
      addSession({
        ...mockSession,
        id: 'session-002',
        specId: 'SPEC-002',
      });

      const state = sessionStore.getState();
      expect(state.sessions).toHaveLength(2);
    });

    it('should not duplicate sessions with same ID', () => {
      const { addSession } = sessionStore.getState();

      addSession(mockSession);
      addSession(mockSession); // Same ID

      const state = sessionStore.getState();
      expect(state.sessions).toHaveLength(1);
    });
  });

  describe('updateSession', () => {
    const mockSession: SessionInfo = {
      id: 'session-001',
      specId: 'SPEC-001',
      status: 'idle',
      worktreePath: '/worktrees/SPEC-001',
      startedAt: new Date().toISOString(),
      output: '',
      error: null,
    };

    it('should update existing session', () => {
      const { addSession, updateSession } = sessionStore.getState();

      addSession(mockSession);

      updateSession({
        ...mockSession,
        status: 'running',
        output: 'Starting...',
      });

      const state = sessionStore.getState();
      const session = state.sessions[0];

      expect(session?.status).toBe('running');
      expect(session?.output).toBe('Starting...');
    });

    it('should add session if not exists', () => {
      const { updateSession } = sessionStore.getState();

      updateSession(mockSession);

      const state = sessionStore.getState();
      expect(state.sessions).toHaveLength(1);
      expect(state.sessions[0]).toEqual(mockSession);
    });

    it('should update progress when session completes', () => {
      const { addSession, updateSession } = sessionStore.getState();
      sessionStore.setState({
        progress: { total: 2, completed: 0, failed: 0, running: 0, percentage: 0 },
      });

      addSession(mockSession);
      updateSession({
        ...mockSession,
        status: 'completed',
        completedAt: new Date().toISOString(),
      });

      const state = sessionStore.getState();
      expect(state.progress.completed).toBe(1);
      expect(state.progress.percentage).toBe(50);
    });

    it('should update progress when session fails', () => {
      const { addSession, updateSession } = sessionStore.getState();
      sessionStore.setState({
        progress: { total: 2, completed: 0, failed: 0, running: 0, percentage: 0 },
      });

      addSession(mockSession);
      updateSession({
        ...mockSession,
        status: 'failed',
        error: 'Test error',
        completedAt: new Date().toISOString(),
      });

      const state = sessionStore.getState();
      expect(state.progress.failed).toBe(1);
      expect(state.progress.percentage).toBe(50);
    });
  });

  describe('removeSession', () => {
    const mockSession: SessionInfo = {
      id: 'session-001',
      specId: 'SPEC-001',
      status: 'completed',
      worktreePath: '/worktrees/SPEC-001',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      output: '',
      error: null,
    };

    it('should remove session from array', () => {
      const { addSession, removeSession } = sessionStore.getState();

      addSession(mockSession);
      expect(sessionStore.getState().sessions).toHaveLength(1);

      removeSession('session-001');

      const state = sessionStore.getState();
      expect(state.sessions).toHaveLength(0);
    });

    it('should handle non-existent session gracefully', () => {
      const { removeSession } = sessionStore.getState();

      // Should not throw
      expect(() => removeSession('non-existent')).not.toThrow();
    });
  });

  describe('clearSessions', () => {
    it('should clear all sessions', () => {
      const { addSession, clearSessions } = sessionStore.getState();

      addSession({
        id: 'session-001',
        specId: 'SPEC-001',
        status: 'completed',
        worktreePath: '/worktrees/SPEC-001',
        startedAt: new Date().toISOString(),
        output: '',
        error: null,
      });

      addSession({
        id: 'session-002',
        specId: 'SPEC-002',
        status: 'completed',
        worktreePath: '/worktrees/SPEC-002',
        startedAt: new Date().toISOString(),
        output: '',
        error: null,
      });

      expect(sessionStore.getState().sessions).toHaveLength(2);

      clearSessions();

      const state = sessionStore.getState();
      expect(state.sessions).toHaveLength(0);
    });

    it('should reset progress', () => {
      const { clearSessions } = sessionStore.getState();

      sessionStore.setState({
        progress: { total: 5, completed: 3, failed: 1, running: 1, percentage: 80 },
      });

      clearSessions();

      const state = sessionStore.getState();
      expect(state.progress).toEqual({
        total: 0,
        completed: 0,
        failed: 0,
        running: 0,
        percentage: 0,
      });
    });
  });

  describe('getSessionById', () => {
    const mockSession: SessionInfo = {
      id: 'session-001',
      specId: 'SPEC-001',
      status: 'running',
      worktreePath: '/worktrees/SPEC-001',
      startedAt: new Date().toISOString(),
      output: '',
      error: null,
    };

    it('should return session by ID', () => {
      const { addSession, getSessionById } = sessionStore.getState();

      addSession(mockSession);

      const session = getSessionById('session-001');

      expect(session).toEqual(mockSession);
    });

    it('should return undefined for non-existent session', () => {
      const { getSessionById } = sessionStore.getState();

      const session = getSessionById('non-existent');

      expect(session).toBeUndefined();
    });
  });

  describe('getSessionsByStatus', () => {
    beforeEach(() => {
      const { addSession } = sessionStore.getState();

      addSession({
        id: 'session-001',
        specId: 'SPEC-001',
        status: 'running',
        worktreePath: '/worktrees/SPEC-001',
        startedAt: new Date().toISOString(),
        output: '',
        error: null,
      });

      addSession({
        id: 'session-002',
        specId: 'SPEC-002',
        status: 'completed',
        worktreePath: '/worktrees/SPEC-002',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        output: '',
        error: null,
      });

      addSession({
        id: 'session-003',
        specId: 'SPEC-003',
        status: 'running',
        worktreePath: '/worktrees/SPEC-003',
        startedAt: new Date().toISOString(),
        output: '',
        error: null,
      });
    });

    it('should return sessions with specified status', () => {
      const { getSessionsByStatus } = sessionStore.getState();

      const runningSessions = getSessionsByStatus('running');

      expect(runningSessions).toHaveLength(2);
      expect(runningSessions.every((s) => s.status === 'running')).toBe(true);
    });

    it('should return empty array if no sessions match', () => {
      const { getSessionsByStatus } = sessionStore.getState();

      const failedSessions = getSessionsByStatus('failed');

      expect(failedSessions).toHaveLength(0);
    });
  });

  describe('error handling', () => {
    it('should handle IPC errors gracefully', async () => {
      mockElectronAPI.startExecution.mockRejectedValue(new Error('IPC error'));

      const { startExecution } = sessionStore.getState();

      await expect(
        startExecution({
          waves: [],
          totalSpecs: 0,
          estimatedParallelism: 0,
        })
      ).rejects.toThrow('IPC error');
    });

    it('should maintain state on IPC errors', async () => {
      mockElectronAPI.startExecution.mockRejectedValue(new Error('IPC error'));

      const { startExecution } = sessionStore.getState();
      const initialState = sessionStore.getState();

      try {
        await startExecution({
          waves: [],
          totalSpecs: 0,
          estimatedParallelism: 0,
        });
      } catch (error) {
        // Expected to throw
      }

      // State should not have changed significantly
      const finalState = sessionStore.getState();
      expect(finalState.executionPlan).toEqual(initialState.executionPlan);
    });
  });
});
