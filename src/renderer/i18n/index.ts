/**
 * i18n Configuration
 *
 * REQ-005: i18n Configuration
 * - Configure i18next with react-i18next
 * - Set up browser language detection
 * - Configure fallback language (English)
 * - Load translation namespaces dynamically
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import all translation files
import koCommon from './locales/ko/common.json';
import koStartup from './locales/ko/startup.json';
import koMain from './locales/ko/main.json';
import koSettings from './locales/ko/settings.json';
import koDialogs from './locales/ko/dialogs.json';
import koErrors from './locales/ko/errors.json';

import enCommon from './locales/en/common.json';
import enStartup from './locales/en/startup.json';
import enMain from './locales/en/main.json';
import enSettings from './locales/en/settings.json';
import enDialogs from './locales/en/dialogs.json';
import enErrors from './locales/en/errors.json';

import jaCommon from './locales/ja/common.json';
import jaStartup from './locales/ja/startup.json';
import jaMain from './locales/ja/main.json';
import jaSettings from './locales/ja/settings.json';
import jaDialogs from './locales/ja/dialogs.json';
import jaErrors from './locales/ja/errors.json';

import zhCommon from './locales/zh/common.json';
import zhStartup from './locales/zh/startup.json';
import zhMain from './locales/zh/main.json';
import zhSettings from './locales/zh/settings.json';
import zhDialogs from './locales/zh/dialogs.json';
import zhErrors from './locales/zh/errors.json';

/**
 * Initialize i18n configuration
 *
 * Sets up i18next with all required plugins and configuration.
 */
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    lng: 'en',
    fallbackLng: 'en',
    debug: false,

    ns: ['common', 'startup', 'main', 'settings', 'dialogs', 'errors'],
    defaultNS: 'common',

    interpolation: {
      escapeValue: false,
    },

    detection: {
      order: ['navigator', 'htmlTag'],
      caches: [],
    },

    resources: {
      ko: {
        common: koCommon,
        startup: koStartup,
        main: koMain,
        settings: koSettings,
        dialogs: koDialogs,
        errors: koErrors,
      },
      en: {
        common: enCommon,
        startup: enStartup,
        main: enMain,
        settings: enSettings,
        dialogs: enDialogs,
        errors: enErrors,
      },
      ja: {
        common: jaCommon,
        startup: jaStartup,
        main: jaMain,
        settings: jaSettings,
        dialogs: jaDialogs,
        errors: jaErrors,
      },
      zh: {
        common: zhCommon,
        startup: zhStartup,
        main: zhMain,
        settings: zhSettings,
        dialogs: zhDialogs,
        errors: zhErrors,
      },
    },
  });

export default i18n;
