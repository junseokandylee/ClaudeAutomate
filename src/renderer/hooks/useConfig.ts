/**
 * useConfig Hook
 *
 * REQ-006: useConfig Hook
 * TAG-DESIGN-006: useConfig Hook Design
 * TAG-FUNC-006: useConfig Hook Implementation
 *
 * Custom React hook for typed access to application configuration.
 * Wraps configStore with a convenient React hook interface.
 *
 * Features:
 * - Provide typed access to config values from configStore
 * - Update config via IPC (handleConfigSet)
 * - Handle loading and error states
 * - Subscribe to config changes
 */

import { useConfigStore } from '@/renderer/stores/configStore';
import type { AppConfig } from '@/shared/types';

/**
 * useConfig Hook Return Type
 */
export interface UseConfigReturn {
  /** Current configuration */
  config: AppConfig;
  /** Loading state */
  isLoading: boolean;
  /** Error message */
  error: string | null;
  /** Update configuration value */
  updateConfig: <K extends keyof AppConfig>(key: K, value: AppConfig[K]) => Promise<void>;
  /** Load configuration from Main process */
  loadConfig: () => Promise<void>;
}

/**
 * useConfig Hook
 *
 * Provides typed access to application configuration with loading and error states.
 *
 * @example
 * ```tsx
 * function Settings() {
 *   const { config, updateConfig, isLoading } = useConfig();
 *
 *   if (isLoading) return <div>Loading...</div>;
 *
 *   return (
 *     <div>
 *       <p>Language: {config.locale}</p>
 *       <button onClick={() => updateConfig('locale', 'ko')}>
 *         Switch to Korean
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export const useConfig = (): UseConfigReturn => {
  const config = useConfigStore((state) => state.config);
  const isLoading = useConfigStore((state) => state.isLoading);
  const error = useConfigStore((state) => state.error);
  const updateConfig = useConfigStore((state) => state.updateConfig);
  const loadConfig = useConfigStore((state) => state.loadConfig);

  return {
    config,
    isLoading,
    error,
    updateConfig,
    loadConfig,
  };
};
