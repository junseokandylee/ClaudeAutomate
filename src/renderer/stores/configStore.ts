/**
 * Config Store
 *
 * REQ-004: Config Store
 * TAG-DESIGN-004: Config Store Design
 * TAG-FUNC-004: Config Store Implementation
 *
 * Zustand store for application configuration management.
 * Synchronizes with Main process config service via IPC.
 *
 * Features:
 * - Store application configuration (locale, maxParallelSessions, worktreeRoot)
 * - Sync with Main process config service via IPC
 * - Provide reactive config values
 * - Handle config loading on startup
 * - Persist config changes via IPC
 */

import { create } from 'zustand';
import type { AppConfig, SupportedLocale } from '@/shared/types';

// ElectronAPI is available via window.electronAPI (from preload script)
declare global {
  interface Window {
    electronAPI: {
      getConfig: (key: string) => Promise<any>;
      setConfig: (key: string, value: any) => Promise<void>;
      onConfigChange: (callback: (event: any, data: any) => void) => () => void;
    };
  }
}

/**
 * Config Store State
 */
interface ConfigState {
  /** Current application configuration */
  config: AppConfig;
  /** Loading state */
  isLoading: boolean;
  /** Error message */
  error: string | null;
}

/**
 * Config Store Actions
 */
interface ConfigActions {
  /** Load configuration from Main process */
  loadConfig: () => Promise<void>;
  /** Update configuration value */
  updateConfig: <K extends keyof AppConfig>(key: K, value: AppConfig[K]) => Promise<void>;
  /** Clear error message */
  clearError: () => void;
}

/**
 * Default configuration values
 */
const defaultConfig: AppConfig = {
  claudePath: '',
  projectRoot: '',
  maxParallelSessions: 10,
  locale: 'en',
  autoCleanup: true,
};

/**
 * Config Store
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const config = useConfigStore(state => state.config);
 *   const updateConfig = useConfigStore(state => state.updateConfig);
 *
 *   return (
 *     <button onClick={() => updateConfig('locale', 'ko')}>
 *       {config.locale}
 *     </button>
 *   );
 * }
 * ```
 */
export const configStore = create<ConfigState & ConfigActions>((set, get) => ({
  // Initial state
  config: defaultConfig,
  isLoading: false,
  error: null,

  /**
   * Load configuration from Main process
   */
  loadConfig: async () => {
    set({ isLoading: true, error: null });

    try {
      // Load all config keys
      const [claudePath, projectRoot, maxParallelSessions, locale, autoCleanup] =
        await Promise.all([
          window.electronAPI.getConfig('claudePath'),
          window.electronAPI.getConfig('projectRoot'),
          window.electronAPI.getConfig('maxParallelSessions'),
          window.electronAPI.getConfig('locale'),
          window.electronAPI.getConfig('autoCleanup'),
        ]);

      set({
        config: {
          claudePath: claudePath ?? defaultConfig.claudePath,
          projectRoot: projectRoot ?? defaultConfig.projectRoot,
          maxParallelSessions: maxParallelSessions ?? defaultConfig.maxParallelSessions,
          locale: locale ?? defaultConfig.locale,
          autoCleanup: autoCleanup ?? defaultConfig.autoCleanup,
        },
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load config';
      set({
        isLoading: false,
        error: errorMessage,
      });
    }
  },

  /**
   * Update configuration value
   */
  updateConfig: async <K extends keyof AppConfig>(key: K, value: AppConfig[K]) => {
    const previousConfig = get().config;

    // Optimistic update
    set({
      config: {
        ...get().config,
        [key]: value,
      },
      error: null,
    });

    try {
      await window.electronAPI.setConfig(key, value);
    } catch (error) {
      // Revert on error
      const errorMessage = error instanceof Error ? error.message : 'Failed to save config';
      set({
        config: previousConfig,
        error: errorMessage,
      });
    }
  },

  /**
   * Clear error message
   */
  clearError: () => {
    set({ error: null });
  },
}));

/**
 * Hook to access config store
 *
 * @example
 * ```tsx
 * const config = useConfigStore();
 * const locale = useConfigStore(state => state.config.locale);
 * ```
 */
export const useConfigStore = configStore;
