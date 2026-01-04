/**
 * TAG-TEST-001: Config Schema Tests (RED Phase)
 *
 * Tests for Zod configuration schema validation
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { AppConfigSchema, ConfigVersionSchema } from '../schema';

describe('ConfigVersionSchema', () => {
  describe('valid version formats', () => {
    it('should accept valid semantic version', () => {
      const result = ConfigVersionSchema.safeParse('1.0.0');
      expect(result.success).toBe(true);
    });

    it('should accept version with prerelease', () => {
      const result = ConfigVersionSchema.safeParse('1.0.0-beta.1');
      expect(result.success).toBe(true);
    });

    it('should accept version with build metadata', () => {
      const result = ConfigVersionSchema.safeParse('1.0.0+build.1');
      expect(result.success).toBe(true);
    });
  });

  describe('invalid version formats', () => {
    it('should reject non-string input', () => {
      const result = ConfigVersionSchema.safeParse(1);
      expect(result.success).toBe(false);
    });

    it('should reject empty string', () => {
      const result = ConfigVersionSchema.safeParse('');
      expect(result.success).toBe(false);
    });

    it('should reject malformed version', () => {
      const result = ConfigVersionSchema.safeParse('invalid');
      expect(result.success).toBe(false);
    });
  });
});

describe('AppConfigSchema', () => {
  describe('valid configurations', () => {
    it('should accept all valid default values', () => {
      const config = {
        schemaVersion: '1.0.0',
        claudePath: '',
        projectRoot: '',
        maxParallelSessions: 10,
        locale: 'en',
        autoCleanup: true,
      };

      const result = AppConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should accept valid custom values', () => {
      const config = {
        schemaVersion: '1.0.0',
        claudePath: '/usr/local/bin/claude',
        projectRoot: '/home/user/project',
        maxParallelSessions: 5,
        locale: 'ko',
        autoCleanup: false,
      };

      const result = AppConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should accept all supported locales', () => {
      const locales = ['ko', 'en', 'ja', 'zh'] as const;

      locales.forEach((locale) => {
        const config = {
          schemaVersion: '1.0.0',
          claudePath: '',
          projectRoot: '',
          maxParallelSessions: 10,
          locale,
          autoCleanup: true,
        };

        const result = AppConfigSchema.safeParse(config);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('schemaVersion validation', () => {
    it('should require schemaVersion field', () => {
      const config = {
        claudePath: '',
        projectRoot: '',
        maxParallelSessions: 10,
        locale: 'en',
        autoCleanup: true,
      };

      const result = AppConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it('should reject invalid schemaVersion', () => {
      const config = {
        schemaVersion: 'invalid',
        claudePath: '',
        projectRoot: '',
        maxParallelSessions: 10,
        locale: 'en',
        autoCleanup: true,
      };

      const result = AppConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });
  });

  describe('maxParallelSessions validation', () => {
    it('should reject maxParallelSessions less than 1', () => {
      const config = {
        schemaVersion: '1.0.0',
        claudePath: '',
        projectRoot: '',
        maxParallelSessions: 0,
        locale: 'en',
        autoCleanup: true,
      };

      const result = AppConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it('should reject maxParallelSessions greater than 10', () => {
      const config = {
        schemaVersion: '1.0.0',
        claudePath: '',
        projectRoot: '',
        maxParallelSessions: 11,
        locale: 'en',
        autoCleanup: true,
      };

      const result = AppConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it('should accept boundary values (1 and 10)', () => {
      const config1 = {
        schemaVersion: '1.0.0',
        claudePath: '',
        projectRoot: '',
        maxParallelSessions: 1,
        locale: 'en',
        autoCleanup: true,
      };

      const config10 = {
        schemaVersion: '1.0.0',
        claudePath: '',
        projectRoot: '',
        maxParallelSessions: 10,
        locale: 'en',
        autoCleanup: true,
      };

      expect(AppConfigSchema.safeParse(config1).success).toBe(true);
      expect(AppConfigSchema.safeParse(config10).success).toBe(true);
    });
  });

  describe('locale validation', () => {
    it('should reject invalid locale', () => {
      const config = {
        schemaVersion: '1.0.0',
        claudePath: '',
        projectRoot: '',
        maxParallelSessions: 10,
        locale: 'fr',
        autoCleanup: true,
      };

      const result = AppConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it('should reject non-string locale', () => {
      const config = {
        schemaVersion: '1.0.0',
        claudePath: '',
        projectRoot: '',
        maxParallelSessions: 10,
        locale: 123,
        autoCleanup: true,
      };

      const result = AppConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });
  });

  describe('path fields validation', () => {
    it('should accept empty strings for paths', () => {
      const config = {
        schemaVersion: '1.0.0',
        claudePath: '',
        projectRoot: '',
        maxParallelSessions: 10,
        locale: 'en',
        autoCleanup: true,
      };

      const result = AppConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should accept non-empty strings for paths', () => {
      const config = {
        schemaVersion: '1.0.0',
        claudePath: '/usr/local/bin/claude',
        projectRoot: '/home/user/project',
        maxParallelSessions: 10,
        locale: 'en',
        autoCleanup: true,
      };

      const result = AppConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should reject non-string paths', () => {
      const config = {
        schemaVersion: '1.0.0',
        claudePath: 123,
        projectRoot: '/home/user/project',
        maxParallelSessions: 10,
        locale: 'en',
        autoCleanup: true,
      };

      const result = AppConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });
  });

  describe('boolean fields validation', () => {
    it('should accept boolean autoCleanup', () => {
      const configTrue = {
        schemaVersion: '1.0.0',
        claudePath: '',
        projectRoot: '',
        maxParallelSessions: 10,
        locale: 'en',
        autoCleanup: true,
      };

      const configFalse = {
        schemaVersion: '1.0.0',
        claudePath: '',
        projectRoot: '',
        maxParallelSessions: 10,
        locale: 'en',
        autoCleanup: false,
      };

      expect(AppConfigSchema.safeParse(configTrue).success).toBe(true);
      expect(AppConfigSchema.safeParse(configFalse).success).toBe(true);
    });

    it('should reject non-boolean autoCleanup', () => {
      const config = {
        schemaVersion: '1.0.0',
        claudePath: '',
        projectRoot: '',
        maxParallelSessions: 10,
        locale: 'en',
        autoCleanup: 'true',
      };

      const result = AppConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });
  });

  describe('additional fields', () => {
    it('should reject unknown fields', () => {
      const config = {
        schemaVersion: '1.0.0',
        claudePath: '',
        projectRoot: '',
        maxParallelSessions: 10,
        locale: 'en',
        autoCleanup: true,
        unknownField: 'should not be allowed',
      };

      const result = AppConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });
  });
});

describe('Schema defaults', () => {
  it('should provide default values when using partial data', () => {
    const partialConfig = {
      schemaVersion: '1.0.0',
    };

    // Note: This test will verify that the schema can generate defaults
    // Implementation will be tested in GREEN phase
    const result = AppConfigSchema.safeParse(partialConfig);
    // This should fail because all fields are required
    // We'll implement default handling in the config service
    expect(result.success).toBe(false);
  });
});
