/**
 * Session Store
 *
 * REQ-004: Session Store
 * TAG-DESIGN-004: Session Store Design
 * TAG-FUNC-004: Session Store Implementation
 *
 * Zustand store for session management and execution tracking.
 * Synchronizes with Main process session manager via IPC.
 *
 * Features:
 * - Store active sessions array
 * - Store execution plan
 * - Actions: startExecution, stopExecution, updateSession
 * - Sync with Main process via IPC
 * - Progress tracking
 */

import { create } from 'zustand';
import type { SessionInfo, ExecutionPlan, SessionStatus } from '@/shared/types';

// ElectronAPI is available via window.electronAPI (from preload script)
declare global {
  interface Window {
    electronAPI: {
      startExecution: (plan: ExecutionPlan) => Promise<void>;
      stopExecution: () => Promise<void>;
      stopSession: (sessionId: string) => Promise<void>;
      retrySession: (sessionId: string) => Promise<void>;
      onSessionStarted: (callback: (event: any, data: SessionInfo) => void) => () => void;
      onSessionOutput: (callback: (event: any, data: { sessionId: string; output: string }) => void) => () => void;
      onSessionCompleted: (callback: (event: any, data: SessionInfo) => void) => () => void;
      onSessionFailed: (callback: (event: any, data: SessionInfo & { error: string }) => void) => () => void;
      onProgressUpdate: (callback: (event: any, data: {
        total: number;
        completed: number;
        failed: number;
        running: number;
        percentage: number;
      }) => void) => () => void;
      onExecutionStarted: (callback: (event: any, data: ExecutionPlan) => void) => () => void;
      onExecutionCompleted: (callback: (event: any, data: {
        total: number;
        completed: number;
        failed: number;
      }) => void) => () => void;
      onExecutionStopped: (callback: (event: any, data: {
        completed: number;
        failed: number;
      }) => void) => () => void;
    };
  }
}

/**
 * Progress information
 */
export interface ProgressInfo {
  total: number;
  completed: number;
  failed: number;
  running: number;
  percentage: number;
}

/**
 * Session Store State
 */
interface SessionState {
  /** Active sessions */
  sessions: SessionInfo[];
  /** Current execution plan */
  executionPlan: ExecutionPlan | null;
  /** Execution state */
  isExecuting: boolean;
  /** Progress information */
  progress: ProgressInfo;
}

/**
 * Session Store Actions
 */
interface SessionActions {
  /** Start execution of plan */
  startExecution: (plan: ExecutionPlan) => Promise<void>;
  /** Stop all executions */
  stopExecution: () => Promise<void>;
  /** Add session to store */
  addSession: (session: SessionInfo) => void;
  /** Update session in store */
  updateSession: (session: SessionInfo) => void;
  /** Remove session from store */
  removeSession: (sessionId: string) => void;
  /** Clear all sessions */
  clearSessions: () => void;
  /** Get session by ID */
  getSessionById: (sessionId: string) => SessionInfo | undefined;
  /** Get sessions by status */
  getSessionsByStatus: (status: SessionStatus) => SessionInfo[];
  /** Update progress */
  updateProgress: (progress: ProgressInfo) => void;
}

/**
 * Default progress
 */
const defaultProgress: ProgressInfo = {
  total: 0,
  completed: 0,
  failed: 0,
  running: 0,
  percentage: 0,
};

/**
 * Session Store
 *
 * @example
 * ```tsx
 * function SessionPanel() {
 *   const sessions = useSessionStore(state => state.sessions);
 *   const startExecution = useSessionStore(state => state.startExecution);
 *
 *   return (
 *     <button onClick={() => startExecution(plan)}>
 *       Start Execution
 *     </button>
 *   );
 * }
 * ```
 */
export const sessionStore = create<SessionState & SessionActions>((set, get) => ({
  // Initial state
  sessions: [],
  executionPlan: null,
  isExecuting: false,
  progress: defaultProgress,

  /**
   * Start execution of plan
   */
  startExecution: async (plan: ExecutionPlan) => {
    const state = get();

    if (state.isExecuting) {
      throw new Error('Execution already in progress');
    }

    // Update state
    set({
      executionPlan: plan,
      isExecuting: true,
      progress: {
        total: plan.totalSpecs,
        completed: 0,
        failed: 0,
        running: 0,
        percentage: 0,
      },
    });

    try {
      // Call Main process
      await window.electronAPI.startExecution(plan);
    } catch (error) {
      // Revert state on error
      set({
        executionPlan: null,
        isExecuting: false,
        progress: defaultProgress,
      });
      throw error;
    }
  },

  /**
   * Stop all executions
   */
  stopExecution: async () => {
    try {
      await window.electronAPI.stopExecution();
    } catch (error) {
      // Log but don't throw - stop should be graceful
      console.error('Failed to stop execution:', error);
    }

    set({
      isExecuting: false,
    });
  },

  /**
   * Add session to store
   */
  addSession: (session: SessionInfo) => {
    const state = get();

    // Check if session already exists
    const exists = state.sessions.some((s) => s.id === session.id);

    if (!exists) {
      set({
        sessions: [...state.sessions, session],
      });
    }
  },

  /**
   * Update session in store
   */
  updateSession: (session: SessionInfo) => {
    const state = get();

    // Find existing session index
    const index = state.sessions.findIndex((s) => s.id === session.id);

    if (index >= 0) {
      // Update existing session
      const newSessions = [...state.sessions];
      newSessions[index] = session;

      set({
        sessions: newSessions,
      });

      // Update progress if session completed or failed
      if (session.status === 'completed' || session.status === 'failed') {
        const completedCount = newSessions.filter((s) => s.status === 'completed').length;
        const failedCount = newSessions.filter((s) => s.status === 'failed').length;
        const runningCount = newSessions.filter((s) => s.status === 'running').length;

        set({
          progress: {
            ...state.progress,
            completed: completedCount,
            failed: failedCount,
            running: runningCount,
            percentage: Math.floor(((completedCount + failedCount) / state.progress.total) * 100),
          },
        });
      }
    } else {
      // Add new session if not exists
      get().addSession(session);
    }
  },

  /**
   * Remove session from store
   */
  removeSession: (sessionId: string) => {
    const state = get();
    set({
      sessions: state.sessions.filter((s) => s.id !== sessionId),
    });
  },

  /**
   * Clear all sessions
   */
  clearSessions: () => {
    set({
      sessions: [],
      progress: defaultProgress,
    });
  },

  /**
   * Get session by ID
   */
  getSessionById: (sessionId: string) => {
    const state = get();
    return state.sessions.find((s) => s.id === sessionId);
  },

  /**
   * Get sessions by status
   */
  getSessionsByStatus: (status: SessionStatus) => {
    const state = get();
    return state.sessions.filter((s) => s.status === status);
  },

  /**
   * Update progress
   */
  updateProgress: (progress: ProgressInfo) => {
    set({
      progress,
    });
  },
}));

// Set up IPC event listeners
if (typeof window !== 'undefined' && window.electronAPI) {
  // Session started
  window.electronAPI.onSessionStarted((event, session) => {
    sessionStore.getState().addSession(session);
    sessionStore.getState().updateSession(session);
  });

  // Session output
  window.electronAPI.onSessionOutput((event, { sessionId, output }) => {
    const state = sessionStore.getState();
    const session = state.getSessionById(sessionId);

    if (session) {
      sessionStore.getState().updateSession({
        ...session,
        output: session.output + output,
      });
    }
  });

  // Session completed
  window.electronAPI.onSessionCompleted((event, session) => {
    sessionStore.getState().updateSession(session);
  });

  // Session failed
  window.electronAPI.onSessionFailed((event, session) => {
    sessionStore.getState().updateSession(session);
  });

  // Progress update
  window.electronAPI.onProgressUpdate((event, progress) => {
    sessionStore.getState().updateProgress(progress);
  });

  // Execution started
  window.electronAPI.onExecutionStarted((event, plan) => {
    sessionStore.setState({
      executionPlan: plan,
      isExecuting: true,
    });
  });

  // Execution completed
  window.electronAPI.onExecutionCompleted(() => {
    sessionStore.setState({
      isExecuting: false,
    });
  });

  // Execution stopped
  window.electronAPI.onExecutionStopped(() => {
    sessionStore.setState({
      isExecuting: false,
    });
  });
}

/**
 * Hook to access session store
 *
 * @example
 * ```tsx
 * const sessions = useSessionStore(state => state.sessions);
 * const startExecution = useSessionStore(state => state.startExecution);
 * ```
 */
export const useSessionStore = sessionStore;
