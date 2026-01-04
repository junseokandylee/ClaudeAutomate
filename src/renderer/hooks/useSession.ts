/**
 * useSession Hook
 *
 * REQ-005: useSession Hook
 * TAG-DESIGN-005: useSession Hook Design
 * TAG-FUNC-005: useSession Implementation
 *
 * Custom React hook for session management.
 * Subscribes to sessionStore and provides control methods.
 *
 * Features:
 * - Subscribe to session updates from sessionStore
 * - Provide session control methods (start, stop, retry)
 * - Handle cleanup on unmount
 * - Return sessions and execution status
 */

import { useEffect, useCallback } from 'react';
import { useSessionStore } from '@/renderer/stores/sessionStore';
import type { ExecutionPlan } from '@/shared/types';

// ElectronAPI is available via window.electronAPI (from preload script)
declare global {
  interface Window {
    electronAPI: {
      stopSession: (sessionId: string) => Promise<void>;
      retrySession: (sessionId: string) => Promise<void>;
    };
  }
}

/**
 * useSession return value
 */
export interface UseSessionReturn {
  /** Active sessions */
  sessions: ReturnType<typeof useSessionStore>['sessions'];
  /** Execution state */
  isExecuting: ReturnType<typeof useSessionStore>['isExecuting'];
  /** Current execution plan */
  executionPlan: ReturnType<typeof useSessionStore>['executionPlan'];
  /** Start execution of plan */
  startExecution: (plan: ExecutionPlan) => Promise<void>;
  /** Stop all executions */
  stopExecution: () => Promise<void>;
  /** Stop a specific session */
  stopSession: (sessionId: string) => Promise<void>;
  /** Retry a failed session */
  retrySession: (sessionId: string) => Promise<void>;
}

/**
 * useSession Hook
 *
 * Subscribes to session updates and provides control methods.
 *
 * @example
 * ```tsx
 * function SessionPanel() {
 *   const { sessions, startExecution, stopSession } = useSession();
 *
 *   return (
 *     <div>
 *       {sessions.map(session => (
 *         <SessionCard
 *           key={session.id}
 *           session={session}
 *           onStop={() => stopSession(session.id)}
 *         />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useSession(): UseSessionReturn {
  // Subscribe to sessionStore
  const sessions = useSessionStore((state) => state.sessions);
  const isExecuting = useSessionStore((state) => state.isExecuting);
  const executionPlan = useSessionStore((state) => state.executionPlan);

  const startExecution = useSessionStore((state) => state.startExecution);
  const stopExecution = useSessionStore((state) => state.stopExecution);

  /**
   * Stop a specific session
   */
  const stopSession = useCallback(async (sessionId: string) => {
    try {
      await window.electronAPI.stopSession(sessionId);

      // Remove from store
      useSessionStore.getState().removeSession(sessionId);
    } catch (error) {
      console.error(`Failed to stop session ${sessionId}:`, error);
      // Still remove from store even if stop failed
      useSessionStore.getState().removeSession(sessionId);
    }
  }, []);

  /**
   * Retry a failed session
   */
  const retrySession = useCallback(async (sessionId: string) => {
    try {
      await window.electronAPI.retrySession(sessionId);

      // Update session status to running
      const session = useSessionStore.getState().getSessionById(sessionId);
      if (session) {
        useSessionStore.getState().updateSession({
          ...session,
          status: 'running',
          error: null,
        });
      }
    } catch (error) {
      console.error(`Failed to retry session ${sessionId}:`, error);
      throw error;
    }
  }, []);

  return {
    sessions,
    isExecuting,
    executionPlan,
    startExecution,
    stopExecution,
    stopSession,
    retrySession,
  };
}
