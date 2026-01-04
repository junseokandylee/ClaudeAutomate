/**
 * ConfigStore Tests
 *
 * TDD RED Phase: Failing tests for ConfigStore functionality
 * Testing: config storage, IPC sync, reactive values, loading on startup, persistence
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { configStore, useConfigStore } from '../configStore';

// Mock ElectronAPI from window
const mockGetConfig = vi.fn();
const mockSetConfig = vi.fn();
const mockOnConfigChange = vi.fn();

Object.defineProperty(window, 'electronAPI', {
  value: {
    getConfig: mockGetConfig,
    setConfig: mockSetConfig,
    onConfigChange: mockOnConfigChange,
  },
  writable: true,
});

describe('ConfigStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state before each test
    configStore.setState({
      config: {
        claudePath: '',
        projectRoot: '',
        maxParallelSessions: 10,
        locale: 'en',
        autoCleanup: true,
      },
      isLoading: false,
      error: null,
    });
  });

  describe('Initial State', () => {
    it('should have initial state', () => {
      const state = configStore.getState();

      expect(state.config).toBeDefined();
      expect(state.config.locale).toBe('en');
      expect(state.config.maxParallelSessions).toBe(10);
      expect(state.config.autoCleanup).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);
    });

    it('should provide default config values', () => {
      const { config } = configStore.getState();

      expect(config.claudePath).toBe('');
      expect(config.projectRoot).toBe('');
      expect(config.maxParallelSessions).toBe(10);
      expect(config.locale).toBe('en');
      expect(config.autoCleanup).toBe(true);
    });
  });

  describe('Loading Configuration', () => {
    it('should load config from Main process via IPC', async () => {
      const mockConfig = {
        claudePath: '/usr/local/bin/claude',
        projectRoot: '/home/user/project',
        maxParallelSessions: 5,
        locale: 'ko' as const,
        autoCleanup: false,
      };

      mockGetConfig.mockImplementation((key: string) => mockConfig[key as keyof typeof mockConfig]);

      await act(async () => {
        await configStore.getState().loadConfig();
      });

      const state = configStore.getState();
      expect(state.config).toEqual(mockConfig);
      expect(mockGetConfig).toHaveBeenCalledWith('claudePath');
      expect(mockGetConfig).toHaveBeenCalledWith('projectRoot');
      expect(mockGetConfig).toHaveBeenCalledWith('maxParallelSessions');
      expect(mockGetConfig).toHaveBeenCalledWith('locale');
      expect(mockGetConfig).toHaveBeenCalledWith('autoCleanup');
    });

    it('should set isLoading to true during loading', async () => {
      mockGetConfig.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve('value'), 100)));

      const loadPromise = act(async () => {
        await configStore.getState().loadConfig();
      });

      // Check loading state during the operation
      expect(configStore.getState().isLoading).toBe(true);

      await loadPromise;
    });

    it('should set isLoading to false after loading', async () => {
      mockGetConfig.mockResolvedValue('/usr/local/bin/claude');

      await act(async () => {
        await configStore.getState().loadConfig();
      });

      expect(configStore.getState().isLoading).toBe(false);
    });

    it('should handle loading errors', async () => {
      const error = new Error('Failed to load config');
      mockGetConfig.mockRejectedValue(error);

      await act(async () => {
        await configStore.getState().loadConfig();
      });

      const state = configStore.getState();
      expect(state.error).toBe(error.message);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('Updating Configuration', () => {
    it('should update single config value', async () => {
      mockSetConfig.mockResolvedValue(undefined);

      await act(async () => {
        await configStore.getState().updateConfig('locale', 'ko');
      });

      const state = configStore.getState();
      expect(state.config.locale).toBe('ko');
      expect(mockSetConfig).toHaveBeenCalledWith('locale', 'ko');
    });

    it('should update multiple config values', async () => {
      mockSetConfig.mockResolvedValue(undefined);

      await act(async () => {
        await configStore.getState().updateConfig('maxParallelSessions', 7);
      });

      await act(async () => {
        await configStore.getState().updateConfig('locale', 'ja');
      });

      const state = configStore.getState();
      expect(state.config.maxParallelSessions).toBe(7);
      expect(state.config.locale).toBe('ja');
    });

    it('should sync updates to Main process via IPC', async () => {
      mockSetConfig.mockResolvedValue(undefined);

      await act(async () => {
        await configStore.getState().updateConfig('projectRoot', '/new/path');
      });

      expect(mockSetConfig).toHaveBeenCalledWith('projectRoot', '/new/path');
    });

    it('should handle update errors', async () => {
      const error = new Error('Failed to save config');
      mockSetConfig.mockRejectedValue(error);

      await act(async () => {
        await configStore.getState().updateConfig('locale', 'ko');
      });

      const state = configStore.getState();
      expect(state.error).toBe(error.message);
    });
  });

  describe('Reactive Values', () => {
    it('should trigger re-render when config changes', async () => {
      const { result } = renderHook(() => useConfigStore());

      mockSetConfig.mockResolvedValue(undefined);

      await act(async () => {
        await configStore.getState().updateConfig('locale', 'ko');
      });

      expect(result.current.config.locale).toBe('ko');
    });

    it('should provide current config value via selector', () => {
      const { result } = renderHook(() => useConfigStore(state => state.config.locale));

      expect(result.current).toBe('en');
    });

    it('should update selector value when config changes', async () => {
      const { result } = renderHook(() => useConfigStore(state => state.config.maxParallelSessions));

      mockSetConfig.mockResolvedValue(undefined);

      await act(async () => {
        await configStore.getState().updateConfig('maxParallelSessions', 8);
      });

      expect(result.current).toBe(8);
    });
  });

  describe('Error Handling', () => {
    it('should clear error on successful operation', async () => {
      // Set an initial error
      configStore.setState({ error: 'Previous error' });

      mockGetConfig.mockResolvedValue('/usr/local/bin/claude');

      await act(async () => {
        await configStore.getState().loadConfig();
      });

      expect(configStore.getState().error).toBe(null);
    });

    it('should preserve config on IPC error', async () => {
      const originalConfig = configStore.getState().config;

      mockSetConfig.mockRejectedValue(new Error('IPC error'));

      await act(async () => {
        await configStore.getState().updateConfig('locale', 'ko');
      });

      // Config should not change on error
      expect(configStore.getState().config).toEqual(originalConfig);
    });
  });

  describe('Type Safety', () => {
    it('should enforce SupportedLocale type', async () => {
      mockSetConfig.mockResolvedValue(undefined);

      await act(async () => {
        await configStore.getState().updateConfig('locale', 'ja');
      });

      expect(configStore.getState().config.locale).toBe('ja');
    });

    it('should enforce number type for maxParallelSessions', async () => {
      mockSetConfig.mockResolvedValue(undefined);

      await act(async () => {
        await configStore.getState().updateConfig('maxParallelSessions', 5);
      });

      expect(typeof configStore.getState().config.maxParallelSessions).toBe('number');
    });

    it('should enforce boolean type for autoCleanup', async () => {
      mockSetConfig.mockResolvedValue(undefined);

      await act(async () => {
        await configStore.getState().updateConfig('autoCleanup', false);
      });

      expect(typeof configStore.getState().config.autoCleanup).toBe('boolean');
    });
  });

  describe('Persistence', () => {
    it('should persist config changes to Main process', async () => {
      mockSetConfig.mockResolvedValue(undefined);

      await act(async () => {
        await configStore.getState().updateConfig('autoCleanup', false);
      });

      expect(mockSetConfig).toHaveBeenCalledWith('autoCleanup', false);
    });

    it('should load persisted config on startup', async () => {
      const persistedConfig = {
        claudePath: '/usr/bin/claude',
        projectRoot: '/persisted/path',
        maxParallelSessions: 3,
        locale: 'zh' as const,
        autoCleanup: false,
      };

      mockGetConfig.mockImplementation((key: string) => persistedConfig[key as keyof typeof persistedConfig]);

      await act(async () => {
        await configStore.getState().loadConfig();
      });

      expect(configStore.getState().config).toEqual(persistedConfig);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty config from IPC', async () => {
      mockGetConfig.mockResolvedValue(undefined);

      await act(async () => {
        await configStore.getState().loadConfig();
      });

      // Should use defaults when empty config returned
      const state = configStore.getState();
      expect(state.config.locale).toBe('en');
      expect(state.config.maxParallelSessions).toBe(10);
    });

    it('should handle partial config from IPC', async () => {
      mockGetConfig.mockImplementation((key: string) => {
        const partialConfig: Record<string, any> = {
          locale: 'ja',
          maxParallelSessions: 7,
        };
        return partialConfig[key];
      });

      await act(async () => {
        await configStore.getState().loadConfig();
      });

      const state = configStore.getState();
      expect(state.config.locale).toBe('ja');
      expect(state.config.maxParallelSessions).toBe(7);
      // Other fields should have defaults
      expect(state.config.claudePath).toBe('');
    });
  });
});
