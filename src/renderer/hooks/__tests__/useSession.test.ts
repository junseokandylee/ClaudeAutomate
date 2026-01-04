/**
 * useSession Hook Tests - REQ-005
 *
 * TAG-TEST-005: useSession TDD Tests
 *
 * Test Coverage:
 * - Subscribe to session updates from sessionStore
 * - Provide session control methods (start, stop, retry)
 * - Handle cleanup on unmount
 * - Return sessions and execution status
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSession } from '../useSession';
import { sessionStore } from '@/renderer/stores/sessionStore';
import type { SessionInfo, ExecutionPlan } from '@/shared/types';

// Mock ElectronAPI
const mockElectronAPI = {
  startExecution: vi.fn(),
  stopExecution: vi.fn(),
  stopSession: vi.fn(),
  retrySession: vi.fn(),
};

Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true,
});

describe('useSession', () => {
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
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should return sessions from store', () => {
      const { result } = renderHook(() => useSession());

      expect(result.current.sessions).toEqual([]);
    });

    it('should return isExecuting from store', () => {
      const { result } = renderHook(() => useSession());

      expect(result.current.isExecuting).toBe(false);
    });

    it('should return executionPlan from store', () => {
      const { result } = renderHook(() => useSession());

      expect(result.current.executionPlan).toBeNull();
    });

    it('should return startExecution function', () => {
      const { result } = renderHook(() => useSession());

      expect(typeof result.current.startExecution).toBe('function');
    });

    it('should return stopExecution function', () => {
      const { result } = renderHook(() => useSession());

      expect(typeof result.current.stopExecution).toBe('function');
    });

    it('should return stopSession function', () => {
      const { result } = renderHook(() => useSession());

      expect(typeof result.current.stopSession).toBe('function');
    });

    it('should return retrySession function', () => {
      const { result } = renderHook(() => useSession());

      expect(typeof result.current.retrySession).toBe('function');
    });
  });

  describe('reactivity', () => {
    it('should update when sessions change in store', async () => {
      const { result } = renderHook(() => useSession());

      const mockSession: SessionInfo = {
        id: 'session-001',
        specId: 'SPEC-001',
        status: 'running',
        worktreePath: '/worktrees/SPEC-001',
        startedAt: new Date().toISOString(),
        output: '',
        error: null,
      };

      act(() => {
        sessionStore.getState().addSession(mockSession);
      });

      expect(result.current.sessions).toHaveLength(1);
      expect(result.current.sessions[0]).toEqual(mockSession);
    });

    it('should update when isExecuting changes in store', async () => {
      const { result } = renderHook(() => useSession());

      act(() => {
        sessionStore.setState({ isExecuting: true });
      });

      expect(result.current.isExecuting).toBe(true);
    });

    it('should update when executionPlan changes in store', async () => {
      const { result } = renderHook(() => useSession());

      const mockPlan: ExecutionPlan = {
        waves: [],
        totalSpecs: 0,
        estimatedParallelism: 0,
      };

      act(() => {
        sessionStore.setState({ executionPlan: mockPlan });
      });

      expect(result.current.executionPlan).toEqual(mockPlan);
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
          ],
        },
      ],
      totalSpecs: 1,
      estimatedParallelism: 1,
    };

    it('should call sessionStore startExecution', async () => {
      mockElectronAPI.startExecution.mockResolvedValue(undefined);

      const { result } = renderHook(() => useSession());

      await act(async () => {
        await result.current.startExecution(mockPlan);
      });

      const storeState = sessionStore.getState();
      expect(storeState.executionPlan).toEqual(mockPlan);
      expect(storeState.isExecuting).toBe(true);
    });

    it('should propagate errors from sessionStore', async () => {
      mockElectronAPI.startExecution.mockRejectedValue(new Error('Start failed'));

      const { result } = renderHook(() => useSession());

      await expect(
        act(async () => {
          await result.current.startExecution(mockPlan);
        })
      ).rejects.toThrow('Start failed');
    });
  });

  describe('stopExecution', () => {
    it('should call sessionStore stopExecution', async () => {
      mockElectronAPI.stopExecution.mockResolvedValue(undefined);

      const { result } = renderHook(() => useSession());

      // Start execution first
      sessionStore.setState({ isExecuting: true });

      await act(async () => {
        await result.current.stopExecution();
      });

      const storeState = sessionStore.getState();
      expect(storeState.isExecuting).toBe(false);
    });
  });

  describe('stopSession', () => {
    it('should call electronAPI stopSession', async () => {
      mockElectronAPI.stopSession.mockResolvedValue(undefined);

      const { result } = renderHook(() => useSession());

      await act(async () => {
        await result.current.stopSession('session-001');
      });

      expect(mockElectronAPI.stopSession).toHaveBeenCalledWith('session-001');
    });

    it('should remove session from store after stopping', async () => {
      mockElectronAPI.stopSession.mockResolvedValue(undefined);

      const mockSession: SessionInfo = {
        id: 'session-001',
        specId: 'SPEC-001',
        status: 'running',
        worktreePath: '/worktrees/SPEC-001',
        startedAt: new Date().toISOString(),
        output: '',
        error: null,
      };

      const { result } = renderHook(() => useSession());

      act(() => {
        sessionStore.getState().addSession(mockSession);
      });

      expect(result.current.sessions).toHaveLength(1);

      await act(async () => {
        await result.current.stopSession('session-001');
      });

      // Session should be removed
      expect(result.current.sessions).toHaveLength(0);
    });

    it('should handle errors gracefully', async () => {
      mockElectronAPI.stopSession.mockRejectedValue(new Error('Stop failed'));

      const { result } = renderHook(() => useSession());

      // Should not throw
      await expect(
        act(async () => {
          await result.current.stopSession('session-001');
        })
      ).resolves.not.toThrow();
    });
  });

  describe('retrySession', () => {
    it('should call electronAPI retrySession', async () => {
      mockElectronAPI.retrySession.mockResolvedValue(undefined);

      const { result } = renderHook(() => useSession());

      await act(async () => {
        await result.current.retrySession('session-001');
      });

      expect(mockElectronAPI.retrySession).toHaveBeenCalledWith('session-001');
    });

    it('should update session status to running', async () => {
      mockElectronAPI.retrySession.mockResolvedValue(undefined);

      const mockSession: SessionInfo = {
        id: 'session-001',
        specId: 'SPEC-001',
        status: 'failed',
        worktreePath: '/worktrees/SPEC-001',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        output: '',
        error: 'Test error',
      };

      const { result } = renderHook(() => useSession());

      act(() => {
        sessionStore.getState().addSession(mockSession);
      });

      await act(async () => {
        await result.current.retrySession('session-001');
      });

      // Session status should be updated
      const session = result.current.sessions.find((s) => s.id === 'session-001');
      expect(session?.status).toBe('running');
    });

    it('should propagate errors from retrySession', async () => {
      mockElectronAPI.retrySession.mockRejectedValue(new Error('Retry failed'));

      const { result } = renderHook(() => useSession());

      // Should throw error
      await expect(
        act(async () => {
          await result.current.retrySession('session-001');
        })
      ).rejects.toThrow('Retry failed');
    });
  });

  describe('cleanup', () => {
    it('should clean up subscriptions on unmount', () => {
      const { unmount } = renderHook(() => useSession());

      // Should not throw
      expect(() => unmount()).not.toThrow();
    });

    it('should not cause memory leaks', () => {
      const { unmount } = renderHook(() => useSession());

      // Add a session
      act(() => {
        sessionStore.getState().addSession({
          id: 'session-001',
          specId: 'SPEC-001',
          status: 'running',
          worktreePath: '/worktrees/SPEC-001',
          startedAt: new Date().toISOString(),
          output: '',
          error: null,
        });
      });

      // Unmount
      unmount();

      // Store should still work
      expect(sessionStore.getState().sessions).toHaveLength(1);
    });
  });

  describe('error handling', () => {
    it('should handle sessionStore errors gracefully', async () => {
      mockElectronAPI.startExecution.mockRejectedValue(new Error('Store error'));

      const { result } = renderHook(() => useSession());

      const mockPlan: ExecutionPlan = {
        waves: [],
        totalSpecs: 0,
        estimatedParallelism: 0,
      };

      await expect(
        act(async () => {
          await result.current.startExecution(mockPlan);
        })
      ).rejects.toThrow('Store error');
    });
  });
});
