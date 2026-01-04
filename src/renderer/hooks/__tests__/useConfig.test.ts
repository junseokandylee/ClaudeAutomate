/**
 * useConfig Hook Tests
 *
 * TDD RED Phase: Failing tests for useConfig hook functionality
 * Testing: typed config access, config updates, loading and error states
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useConfig } from '../useConfig';
import { configStore } from '@/renderer/stores/configStore';

// Mock ElectronAPI
const mockGetConfig = vi.fn();
const mockSetConfig = vi.fn();

Object.defineProperty(window, 'electronAPI', {
  value: {
    getConfig: mockGetConfig,
    setConfig: mockSetConfig,
  },
  writable: true,
});

describe('useConfig Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset config store
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

  describe('Config Access', () => {
    it('should provide current config', () => {
      const { result } = renderHook(() => useConfig());

      expect(result.current.config).toBeDefined();
      expect(result.current.config.locale).toBe('en');
      expect(result.current.config.maxParallelSessions).toBe(10);
    });

    it('should provide individual config values', () => {
      const { result } = renderHook(() => useConfig());

      expect(result.current.config.claudePath).toBe('');
      expect(result.current.config.projectRoot).toBe('');
      expect(result.current.config.locale).toBe('en');
      expect(result.current.config.maxParallelSessions).toBe(10);
      expect(result.current.config.autoCleanup).toBe(true);
    });

    it('should update when config changes', async () => {
      const { result } = renderHook(() => useConfig());

      mockSetConfig.mockResolvedValue(undefined);

      await act(async () => {
        await result.current.updateConfig('locale', 'ko');
      });

      expect(result.current.config.locale).toBe('ko');
    });
  });

  describe('Config Updates', () => {
    it('should provide updateConfig function', () => {
      const { result } = renderHook(() => useConfig());

      expect(typeof result.current.updateConfig).toBe('function');
    });

    it('should update config value via updateConfig', async () => {
      const { result } = renderHook(() => useConfig());

      mockSetConfig.mockResolvedValue(undefined);

      await act(async () => {
        await result.current.updateConfig('maxParallelSessions', 5);
      });

      expect(result.current.config.maxParallelSessions).toBe(5);
      expect(mockSetConfig).toHaveBeenCalledWith('maxParallelSessions', 5);
    });

    it('should handle update errors', async () => {
      const { result } = renderHook(() => useConfig());

      const error = new Error('Update failed');
      mockSetConfig.mockRejectedValue(error);

      await act(async () => {
        await result.current.updateConfig('locale', 'ko');
      });

      // Config should not change on error
      expect(result.current.config.locale).toBe('en');
    });
  });

  describe('Loading State', () => {
    it('should provide loading state', () => {
      const { result } = renderHook(() => useConfig());

      expect(result.current.isLoading).toBe(false);
    });

    it('should be true during config loading', async () => {
      mockGetConfig.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve('value'), 100)));

      const { result } = renderHook(() => useConfig());

      act(() => {
        result.current.loadConfig();
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should be false after loading completes', async () => {
      mockGetConfig.mockResolvedValue('/usr/local/bin/claude');

      const { result } = renderHook(() => useConfig());

      await act(async () => {
        await result.current.loadConfig();
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Error State', () => {
    it('should provide error state', () => {
      const { result } = renderHook(() => useConfig());

      expect(result.current.error).toBe(null);
    });

    it('should have error message when loading fails', async () => {
      const error = new Error('Failed to load');
      mockGetConfig.mockRejectedValue(error);

      const { result } = renderHook(() => useConfig());

      await act(async () => {
        await result.current.loadConfig();
      });

      expect(result.current.error).toBe('Failed to load');
    });

    it('should have error message when update fails', async () => {
      const error = new Error('Failed to save');
      mockSetConfig.mockRejectedValue(error);

      const { result } = renderHook(() => useConfig());

      await act(async () => {
        await result.current.updateConfig('locale', 'ko');
      });

      expect(result.current.error).toBe('Failed to save');
    });

    it('should clear error on successful operation', async () => {
      // Set error first
      const error = new Error('Previous error');
      mockGetConfig.mockRejectedValue(error);

      const { result } = renderHook(() => useConfig());

      await act(async () => {
        await result.current.loadConfig();
      });

      expect(result.current.error).toBe('Previous error');

      // Clear error with successful operation
      mockGetConfig.mockResolvedValue('/usr/local/bin/claude');

      await act(async () => {
        await result.current.loadConfig();
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('Load Config Function', () => {
    it('should provide loadConfig function', () => {
      const { result } = renderHook(() => useConfig());

      expect(typeof result.current.loadConfig).toBe('function');
    });

    it('should load config from Main process', async () => {
      const mockConfig = {
        claudePath: '/usr/bin/claude',
        projectRoot: '/project',
        maxParallelSessions: 7,
        locale: 'ja' as const,
        autoCleanup: false,
      };

      mockGetConfig.mockImplementation((key: string) => mockConfig[key as keyof typeof mockConfig]);

      const { result } = renderHook(() => useConfig());

      await act(async () => {
        await result.current.loadConfig();
      });

      expect(result.current.config).toEqual(mockConfig);
    });
  });

  describe('Type Safety', () => {
    it('should provide typed config access', () => {
      const { result } = renderHook(() => useConfig());

      // These should compile without type errors
      const locale: string = result.current.config.locale;
      const sessions: number = result.current.config.maxParallelSessions;
      const autoCleanup: boolean = result.current.config.autoCleanup;

      expect(locale).toBeDefined();
      expect(sessions).toBeDefined();
      expect(autoCleanup).toBeDefined();
    });

    it('should enforce types on updateConfig', async () => {
      const { result } = renderHook(() => useConfig());

      mockSetConfig.mockResolvedValue(undefined);

      // These should work with correct types
      await act(async () => {
        await result.current.updateConfig('locale', 'ko');
        await result.current.updateConfig('maxParallelSessions', 5);
        await result.current.updateConfig('autoCleanup', false);
      });

      expect(result.current.config.locale).toBe('ko');
      expect(result.current.config.maxParallelSessions).toBe(5);
      expect(result.current.config.autoCleanup).toBe(false);
    });
  });

  describe('Reactivity', () => {
    it('should trigger re-render when config changes', async () => {
      let renderCount = 0;
      const { result, rerender } = renderHook(() => {
        renderCount++;
        return useConfig();
      });

      const initialRenderCount = renderCount;

      mockSetConfig.mockResolvedValue(undefined);

      await act(async () => {
        await result.current.updateConfig('locale', 'ja');
      });

      // Should have re-rendered
      expect(renderCount).toBeGreaterThan(initialRenderCount);
    });

    it('should trigger re-render when loading state changes', async () => {
      const { result } = renderHook(() => useConfig());

      let isLoading = result.current.isLoading;
      expect(isLoading).toBe(false);

      mockGetConfig.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve('value'), 10)));

      act(() => {
        result.current.loadConfig();
      });

      isLoading = result.current.isLoading;
      expect(isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Integration with Config Store', () => {
    it('should sync with config store state', () => {
      const { result } = renderHook(() => useConfig());

      // Modify store directly
      act(() => {
        configStore.setState({
          config: {
            ...configStore.getState().config,
            locale: 'zh',
          },
        });
      });

      expect(result.current.config.locale).toBe('zh');
    });

    it('should persist changes to config store', async () => {
      const { result } = renderHook(() => useConfig());

      mockSetConfig.mockResolvedValue(undefined);

      await act(async () => {
        await result.current.updateConfig('autoCleanup', false);
      });

      // Check that store was updated
      expect(configStore.getState().config.autoCleanup).toBe(false);
    });
  });
});
