/**
 * useProgress Hook Tests - REQ-006
 *
 * TAG-TEST-006: useProgress TDD Tests
 *
 * Test Coverage:
 * - Calculate overall progress percentage
 * - Count completed/running/pending SPECs
 * - Estimate remaining time
 * - Subscribe to session store updates
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProgress } from '../useProgress';
import { sessionStore } from '@/renderer/stores/sessionStore';
import type { SessionInfo } from '@/shared/types';

describe('useProgress', () => {
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
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should return zero progress when no sessions', () => {
      const { result } = renderHook(() => useProgress());

      expect(result.current.percentage).toBe(0);
    });

    it('should return zero completed count', () => {
      const { result } = renderHook(() => useProgress());

      expect(result.current.completed).toBe(0);
    });

    it('should return zero running count', () => {
      const { result } = renderHook(() => useProgress());

      expect(result.current.running).toBe(0);
    });

    it('should return zero pending count', () => {
      const { result } = renderHook(() => useProgress());

      expect(result.current.pending).toBe(0);
    });

    it('should return zero failed count', () => {
      const { result } = renderHook(() => useProgress());

      expect(result.current.failed).toBe(0);
    });

    it('should return null for remaining time when no execution', () => {
      const { result } = renderHook(() => useProgress());

      expect(result.current.remainingTime).toBeNull();
    });
  });

  describe('progress calculation', () => {
    it('should calculate progress percentage correctly', () => {
      const { result } = renderHook(() => useProgress());

      act(() => {
        // Add sessions
        for (let i = 0; i < 5; i++) {
          sessionStore.getState().addSession({
            id: `session-${i}`,
            specId: `SPEC-${i}`,
            status: i < 2 ? 'completed' : 'running',
            worktreePath: `/worktrees/SPEC-${i}`,
            startedAt: new Date().toISOString(),
            output: '',
            error: null,
          });
        }

        // Set total to 10
        sessionStore.setState({
          progress: {
            total: 10,
            completed: 2,
            failed: 0,
            running: 3,
            percentage: 20,
          },
        });
      });

      // 2 completed out of 10 = 20%
      expect(result.current.percentage).toBe(20);
    });

    it('should count completed sessions', () => {
      const { result } = renderHook(() => useProgress());

      act(() => {
        // Add 3 completed sessions
        for (let i = 0; i < 3; i++) {
          sessionStore.getState().addSession({
            id: `session-${i}`,
            specId: `SPEC-${i}`,
            status: 'completed',
            worktreePath: `/worktrees/SPEC-${i}`,
            startedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            output: '',
            error: null,
          });
        }
      });

      expect(result.current.completed).toBe(3);
    });

    it('should count running sessions', () => {
      const { result } = renderHook(() => useProgress());

      act(() => {
        // Add 2 running sessions
        for (let i = 0; i < 2; i++) {
          sessionStore.getState().addSession({
            id: `session-${i}`,
            specId: `SPEC-${i}`,
            status: 'running',
            worktreePath: `/worktrees/SPEC-${i}`,
            startedAt: new Date().toISOString(),
            output: '',
            error: null,
          });
        }
      });

      expect(result.current.running).toBe(2);
    });

    it('should count idle sessions as pending', () => {
      const { result } = renderHook(() => useProgress());

      act(() => {
        // Add 4 idle sessions
        for (let i = 0; i < 4; i++) {
          sessionStore.getState().addSession({
            id: `session-${i}`,
            specId: `SPEC-${i}`,
            status: 'idle',
            worktreePath: `/worktrees/SPEC-${i}`,
            startedAt: new Date().toISOString(),
            output: '',
            error: null,
          });
        }
      });

      expect(result.current.pending).toBe(4);
    });

    it('should count failed sessions', () => {
      const { result } = renderHook(() => useProgress());

      act(() => {
        // Add 1 failed session
        sessionStore.getState().addSession({
          id: 'session-001',
          specId: 'SPEC-001',
          status: 'failed',
          worktreePath: '/worktrees/SPEC-001',
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          output: '',
          error: 'Test error',
        });
      });

      expect(result.current.failed).toBe(1);
    });
  });

  describe('reactivity', () => {
    it('should update when sessions change', () => {
      const { result } = renderHook(() => useProgress());

      expect(result.current.completed).toBe(0);

      act(() => {
        sessionStore.getState().addSession({
          id: 'session-001',
          specId: 'SPEC-001',
          status: 'completed',
          worktreePath: '/worktrees/SPEC-001',
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          output: '',
          error: null,
        });
      });

      expect(result.current.completed).toBe(1);
    });

    it('should update when session status changes', () => {
      const { result } = renderHook(() => useProgress());

      const session: SessionInfo = {
        id: 'session-001',
        specId: 'SPEC-001',
        status: 'running',
        worktreePath: '/worktrees/SPEC-001',
        startedAt: new Date().toISOString(),
        output: '',
        error: null,
      };

      act(() => {
        sessionStore.getState().addSession(session);
      });

      expect(result.current.running).toBe(1);
      expect(result.current.completed).toBe(0);

      act(() => {
        sessionStore.getState().updateSession({
          ...session,
          status: 'completed',
          completedAt: new Date().toISOString(),
        });
      });

      expect(result.current.running).toBe(0);
      expect(result.current.completed).toBe(1);
    });

    it('should update progress percentage dynamically', () => {
      const { result } = renderHook(() => useProgress());

      act(() => {
        sessionStore.setState({
          progress: {
            total: 10,
            completed: 5,
            failed: 0,
            running: 0,
            percentage: 50,
          },
        });
      });

      expect(result.current.percentage).toBe(50);

      act(() => {
        sessionStore.setState({
          progress: {
            total: 10,
            completed: 8,
            failed: 1,
            running: 1,
            percentage: 90,
          },
        });
      });

      expect(result.current.percentage).toBe(90);
    });
  });

  describe('remaining time estimation', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('should estimate remaining time based on progress', () => {
      const startTime = Date.now();

      const { result } = renderHook(() => useProgress());

      act(() => {
        // Add completed session with start time
        sessionStore.getState().addSession({
          id: 'session-001',
          specId: 'SPEC-001',
          status: 'completed',
          worktreePath: '/worktrees/SPEC-001',
          startedAt: new Date(startTime).toISOString(),
          completedAt: new Date(startTime + 10000).toISOString(), // 10 seconds
          output: '',
          error: null,
        });

        // Set progress: 1 completed out of 5 total
        sessionStore.setState({
          progress: {
            total: 5,
            completed: 1,
            failed: 0,
            running: 0,
            percentage: 20,
          },
        });
      });

      // Should estimate remaining time
      // 1 completed in 10s, 4 remaining = ~40s
      expect(result.current.remainingTime).toBeGreaterThan(0);
      expect(result.current.remainingTime).toBeLessThan(60); // Less than 60s
    });

    it('should return null when no sessions completed', () => {
      const { result } = renderHook(() => useProgress());

      act(() => {
        sessionStore.setState({
          progress: {
            total: 5,
            completed: 0,
            failed: 0,
            running: 1,
            percentage: 0,
          },
        });
      });

      expect(result.current.remainingTime).toBeNull();
    });

    it('should return 0 when all sessions completed', () => {
      const { result } = renderHook(() => useProgress());

      act(() => {
        // Add 5 completed sessions
        for (let i = 0; i < 5; i++) {
          sessionStore.getState().addSession({
            id: `session-${i}`,
            specId: `SPEC-${i}`,
            status: 'completed',
            worktreePath: `/worktrees/SPEC-${i}`,
            startedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            output: '',
            error: null,
          });
        }

        sessionStore.setState({
          progress: {
            total: 5,
            completed: 5,
            failed: 0,
            running: 0,
            percentage: 100,
          },
        });
      });

      expect(result.current.remainingTime).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle zero total SPECs', () => {
      const { result } = renderHook(() => useProgress());

      act(() => {
        sessionStore.setState({
          progress: {
            total: 0,
            completed: 0,
            failed: 0,
            running: 0,
            percentage: 0,
          },
        });
      });

      expect(result.current.percentage).toBe(0);
      expect(result.current.remainingTime).toBeNull();
    });

    it('should handle cancelled sessions', () => {
      const { result } = renderHook(() => useProgress());

      act(() => {
        sessionStore.getState().addSession({
          id: 'session-001',
          specId: 'SPEC-001',
          status: 'cancelled',
          worktreePath: '/worktrees/SPEC-001',
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          output: '',
          error: null,
        });
      });

      // Cancelled sessions should not count as completed
      expect(result.current.completed).toBe(0);
    });

    it('should handle mixed session statuses', () => {
      const { result } = renderHook(() => useProgress());

      act(() => {
        // Add mixed sessions
        sessionStore.getState().addSession({
          id: 'session-001',
          specId: 'SPEC-001',
          status: 'completed',
          worktreePath: '/worktrees/SPEC-001',
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          output: '',
          error: null,
        });

        sessionStore.getState().addSession({
          id: 'session-002',
          specId: 'SPEC-002',
          status: 'running',
          worktreePath: '/worktrees/SPEC-002',
          startedAt: new Date().toISOString(),
          output: '',
          error: null,
        });

        sessionStore.getState().addSession({
          id: 'session-003',
          specId: 'SPEC-003',
          status: 'failed',
          worktreePath: '/worktrees/SPEC-003',
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          output: '',
          error: 'Error',
        });

        sessionStore.getState().addSession({
          id: 'session-004',
          specId: 'SPEC-004',
          status: 'idle',
          worktreePath: '/worktrees/SPEC-004',
          startedAt: new Date().toISOString(),
          output: '',
          error: null,
        });
      });

      expect(result.current.completed).toBe(1);
      expect(result.current.running).toBe(1);
      expect(result.current.failed).toBe(1);
      expect(result.current.pending).toBe(1);
    });
  });
});
