/**
 * useI18n Hook
 *
 * REQ-007: useI18n Hook
 * TAG-DESIGN-007: useI18n Hook Design
 * TAG-FUNC-007: useI18n Hook Implementation
 *
 * Custom React hook for internationalization.
 * Wraps react-i18next useTranslation hook with locale switching functionality.
 *
 * Features:
 * - Wrap react-i18next useTranslation hook
 * - Provide locale switching function
 * - Return current locale
 * - Trigger re-render on language change
 * - Update config store when locale changes
 */

import { useTranslation } from 'react-i18next';
import { useConfigStore } from '@/renderer/stores/configStore';
import type { SupportedLocale } from '@/shared/types';
import { i18n } from 'react-i18next';

/**
 * useI18n Hook Return Type
 */
export interface UseI18nReturn {
  /** Translation function */
  t: (key: string) => string;
  /** Current locale */
  locale: SupportedLocale;
  /** Change locale function */
  changeLocale: (locale: SupportedLocale) => Promise<void>;
}

/**
 * useI18n Hook
 *
 * Provides internationalization with locale switching and config store sync.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { t, locale, changeLocale } = useI18n();
 *
 *   return (
 *     <div>
 *       <p>{t('common.save')}</p>
 *       <button onClick={() => changeLocale('ko')}>
 *         Switch to Korean
 *       </button>
 *       <p>Current: {locale}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export const useI18n = (): UseI18nReturn => {
  const { t } = useTranslation();
  const locale = useConfigStore((state) => state.config.locale);
  const updateConfig = useConfigStore((state) => state.updateConfig);

  /**
   * Change application locale
   *
   * Updates i18next instance and persists to config store.
   *
   * @param newLocale - New locale to switch to
   */
  const changeLocale = async (newLocale: SupportedLocale): Promise<void> => {
    // Update i18next instance
    await i18n.changeLanguage(newLocale);

    // Persist to config store
    await updateConfig('locale', newLocale);
  };

  return {
    t,
    locale,
    changeLocale,
  };
};
