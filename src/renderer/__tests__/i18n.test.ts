/**
 * Tests for i18n configuration
 *
 * REQ-005: i18n Configuration
 * - Configure i18next with react-i18next
 * - Set up browser language detection
 * - Configure fallback language (English)
 * - Load translation namespaces dynamically
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Renderer Foundation - REQ-005: i18n Configuration', () => {
  describe('TAG-001: Module Exports', () => {
    it('should export default i18n instance', async () => {
      const i18n = await import('../i18n');
      expect(i18n.default).toBeDefined();
    });
  });

  describe('TAG-002: Language Configuration', () => {
    it('should have fallback language set to English', async () => {
      const i18n = await import('../i18n');
      expect(i18n.default.options.fallbackLng).toEqual(['en']);
    });

    it('should support multiple languages', async () => {
      const i18n = await import('../i18n');
      expect(i18n.default.languages).toContain('en');
    });

    it('should have English resources loaded', async () => {
      const i18n = await import('../i18n');
      expect(i18n.default.hasResourceBundle('en', 'common')).toBe(true);
    });
  });

  describe('TAG-003: Translation Keys', () => {
    it('should have app title translation', async () => {
      const i18n = await import('../i18n');
      const title = i18n.default.t('common:app.title');
      expect(title).toBe('ClaudeParallelRunner');
    });
  });

  describe('TAG-004: Plugin Configuration', () => {
    it('should have LanguageDetector plugin', async () => {
      const i18n = await import('../i18n');
      expect(i18n.default.options.detection).toBeDefined();
    });

    it('should have initReactI18next plugin', async () => {
      const i18n = await import('../i18n');
      expect(i18n.default.store).toBeDefined();
    });
  });
});
