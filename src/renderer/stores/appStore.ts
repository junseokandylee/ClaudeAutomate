/**
 * App Store
 *
 * REQ-005: App Store
 * TAG-DESIGN-005: App Store Design
 * TAG-FUNC-005: App Store Implementation
 *
 * Zustand store for application-wide state management.
 * Manages view state, bootstrap status, and UI dialogs.
 *
 * Features:
 * - Track bootstrap completion status
 * - Manage current view state (startup | main)
 * - Store UI state (dialogs open, etc.)
 * - Provide app-wide actions (setView, setBootstrapComplete)
 */

import { create } from 'zustand';

/**
 * View states for the application
 */
export type AppView = 'startup' | 'main';

/**
 * Dialog types in the application
 */
export type DialogType = 'settings' | 'confirm' | 'error';

/**
 * Error state structure
 */
export interface ErrorState {
  title: string;
  message: string;
  details?: string;
  onRetry?: () => void;
}

/**
 * Dialog states
 */
interface DialogStates {
  settings: boolean;
  confirm: boolean;
  error: boolean;
}

/**
 * App Store State
 */
interface AppState {
  /** Current active view */
  currentView: AppView;
  /** Bootstrap completion status */
  isBootstrapComplete: boolean;
  /** Dialog open states */
  dialogs: DialogStates;
  /** Current error state (if any) */
  errorState: ErrorState | null;
}

/**
 * App Store Actions
 */
interface AppActions {
  /** Set the current view */
  setCurrentView: (view: AppView) => void;
  /** Mark bootstrap as complete */
  setBootstrapComplete: (complete: boolean) => void;
  /** Open a specific dialog */
  openDialog: (dialogType: DialogType) => void;
  /** Close a specific dialog */
  closeDialog: (dialogType: DialogType) => void;
  /** Set error state */
  setErrorState: (error: ErrorState | null) => void;
  /** Clear error state */
  clearErrorState: () => void;
  /** Reset store to initial state */
  reset: () => void;
}

/**
 * Initial state
 */
const initialState: AppState = {
  currentView: 'startup',
  isBootstrapComplete: false,
  dialogs: {
    settings: false,
    confirm: false,
    error: false,
  },
  errorState: null,
};

/**
 * App Store
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const currentView = useAppStore(state => state.currentView);
 *   const setCurrentView = useAppStore(state => state.setCurrentView);
 *   const openDialog = useAppStore(state => state.openDialog);
 *
 *   return (
 *     <button onClick={() => openDialog('settings')}>
 *       Open Settings
 *     </button>
 *   );
 * }
 * ```
 */
export const appStore = create<AppState & AppActions>((set) => ({
  // Initial state
  ...initialState,

  /**
   * Set the current view
   */
  setCurrentView: (view: AppView) => {
    set({ currentView: view });
  },

  /**
   * Mark bootstrap as complete
   * Automatically switches to main view when bootstrap completes
   */
  setBootstrapComplete: (complete: boolean) => {
    set((state) => ({
      isBootstrapComplete: complete,
      // Auto-switch to main view when bootstrap completes
      currentView: complete ? 'main' : state.currentView,
    }));
  },

  /**
   * Open a specific dialog
   */
  openDialog: (dialogType: DialogType) => {
    set((state) => ({
      dialogs: {
        ...state.dialogs,
        [dialogType]: true,
      },
    }));
  },

  /**
   * Close a specific dialog
   */
  closeDialog: (dialogType: DialogType) => {
    set((state) => ({
      dialogs: {
        ...state.dialogs,
        [dialogType]: false,
      },
    }));
  },

  /**
   * Set error state
   * Automatically opens error dialog
   */
  setErrorState: (error: ErrorState | null) => {
    set({
      errorState: error,
      dialogs: {
        settings: false,
        confirm: false,
        error: error !== null,
      },
    });
  },

  /**
   * Clear error state
   * Closes error dialog
   */
  clearErrorState: () => {
    set((state) => ({
      errorState: null,
      dialogs: {
        ...state.dialogs,
        error: false,
      },
    }));
  },

  /**
   * Reset store to initial state
   */
  reset: () => {
    set(initialState);
  },
}));

/**
 * Hook to access app store
 *
 * @example
 * ```tsx
 * const appState = useAppStore();
 * const currentView = useAppStore(state => state.currentView);
 * ```
 */
export const useAppStore = appStore;
