/**
 * useI18n Hook Tests
 *
 * TDD RED Phase: Failing tests for useI18n hook functionality
 * Testing: i18n wrapping, locale switching, re-render triggers, config store sync
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useI18n } from '../useI18n';
import { configStore } from '@/renderer/stores/configStore';
import { i18n } from 'react-i18next';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: vi.fn(),
      language: 'en',
    },
  }),
  i18n: {
    changeLanguage: vi.fn(),
  },
}));

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

describe('useI18n Hook', () => {
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

  describe('Translation Function', () => {
    it('should provide t function', () => {
      const { result } = renderHook(() => useI18n());

      expect(typeof result.current.t).toBe('function');
    });

    it('should translate keys', () => {
      const { result } = renderHook(() => useI18n());

      const translation = result.current.t('common.save');

      expect(translation).toBe('common.save');
    });
  });

  describe('Locale Access', () => {
    it('should provide current locale', () => {
      const { result } = renderHook(() => useI18n());

      expect(result.current.locale).toBe('en');
    });

    it('should update when locale changes', async () => {
      const { result } = renderHook(() => useI18n());

      mockSetConfig.mockResolvedValue(undefined);

      await act(async () => {
        await result.current.changeLocale('ko');
      });

      expect(result.current.locale).toBe('ko');
    });

    it('should reflect config store locale', async () => {
      // Change locale in config store directly
      act(() => {
        configStore.setState({
          config: {
            ...configStore.getState().config,
            locale: 'ja',
          },
        });
      });

      const { result } = renderHook(() => useI18n());

      expect(result.current.locale).toBe('ja');
    });
  });

  describe('Locale Switching', () => {
    it('should provide changeLocale function', () => {
      const { result } = renderHook(() => useI18n());

      expect(typeof result.current.changeLocale).toBe('function');
    });

    it('should change locale successfully', async () => {
      const { result } = renderHook(() => useI18n());

      mockSetConfig.mockResolvedValue(undefined);

      await act(async () => {
        await result.current.changeLocale('ko');
      });

      expect(result.current.locale).toBe('ko');
    });

    it('should update i18next when locale changes', async () => {
      const { result } = renderHook(() => useI18n());

      mockSetConfig.mockResolvedValue(undefined);

      await act(async () => {
        await result.current.changeLocale('ja');
      });

      // i18n.changeLanguage should be called
      expect(i18n.changeLanguage).toHaveBeenCalledWith('ja');
    });

    it('should update config store when locale changes', async () => {
      const { result } = renderHook(() => useI18n());

      mockSetConfig.mockResolvedValue(undefined);

      await act(async () => {
        await result.current.changeLocale('zh');
      });

      expect(mockSetConfig).toHaveBeenCalledWith('locale', 'zh');
      expect(configStore.getState().config.locale).toBe('zh');
    });

    it('should handle supported locales', async () => {
      const { result } = renderHook(() => useI18n());

      mockSetConfig.mockResolvedValue(undefined);

      const locales: Array<'en' | 'ko' | 'ja' | 'zh'> = ['en', 'ko', 'ja', 'zh'];

      for (const locale of locales) {
        await act(async () => {
          await result.current.changeLocale(locale);
        });

        expect(result.current.locale).toBe(locale);
      }
    });
  });

  describe('Re-render Triggers', () => {
    it('should trigger re-render when locale changes', async () => {
      let renderCount = 0;
      const { result } = renderHook(() => {
        renderCount++;
        return useI18n();
      });

      const initialRenderCount = renderCount;

      mockSetConfig.mockResolvedValue(undefined);

      await act(async () => {
        await result.current.changeLocale('ko');
      });

      expect(renderCount).toBeGreaterThan(initialRenderCount);
    });

    it('should trigger re-render when config store locale changes', () => {
      let renderCount = 0;
      renderHook(() => {
        renderCount++;
        return useI18n();
      });

      const initialRenderCount = renderCount;

      act(() => {
        configStore.setState({
          config: {
            ...configStore.getState().config,
            locale: 'ja',
          },
        });
      });

      expect(renderCount).toBeGreaterThan(initialRenderCount);
    });
  });

  describe('Integration with Config Store', () => {
    it('should sync locale from config store', () => {
      act(() => {
        configStore.setState({
          config: {
            ...configStore.getState().config,
            locale: 'zh',
          },
        });
      });

      const { result } = renderHook(() => useI18n());

      expect(result.current.locale).toBe('zh');
    });

    it('should persist locale changes to config store', async () => {
      const { result } = renderHook(() => useI18n());

      mockSetConfig.mockResolvedValue(undefined);

      await act(async () => {
        await result.current.changeLocale('ko');
      });

      expect(configStore.getState().config.locale).toBe('ko');
    });
  });

  describe('Type Safety', () => {
    it('should provide typed locale value', () => {
      const { result } = renderHook(() => useI18n());

      // Locale should be typed as SupportedLocale
      const locale: 'en' | 'ko' | 'ja' | 'zh' = result.current.locale;

      expect(locale).toBeDefined();
    });

    it('should enforce supported locale types in changeLocale', async () => {
      const { result } = renderHook(() => useI18n());

      mockSetConfig.mockResolvedValue(undefined);

      // These should work with correct types
      await act(async () => {
        await result.current.changeLocale('en');
        await result.current.changeLocale('ko');
        await result.current.changeLocale('ja');
        await result.current.changeLocale('zh');
      });

      expect(result.current.locale).toBe('zh');
    });
  });

  describe('Error Handling', () => {
    it('should handle locale change errors gracefully', async () => {
      const { result } = renderHook(() => useI18n());

      const error = new Error('Failed to change locale');
      mockSetConfig.mockRejectedValue(error);

      await act(async () => {
        await result.current.changeLocale('ko');
      });

      // Locale should not change on error
      expect(result.current.locale).toBe('en');
    });
  });
});
