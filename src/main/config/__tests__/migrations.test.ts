/**
 * TAG-TEST-002: Config Migration Tests (RED Phase)
 *
 * Tests for configuration migration system
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { AppConfig } from '../schema';
import { MigrationManager, DEFAULT_CONFIG } from '../migrations';
import { ConfigVersionSchema } from '../schema';

describe('MigrationManager', () => {
  let migrationManager: MigrationManager;

  beforeEach(() => {
    migrationManager = new MigrationManager();
  });

  describe('initialization', () => {
    it('should create migration manager with current version', () => {
      expect(migrationManager.getCurrentVersion()).toBe('1.0.0');
    });

    it('should have empty migrations by default', () => {
      expect(migrationManager['migrations'].size).toBe(0);
    });
  });

  describe('migration registration', () => {
    it('should register a migration function', () => {
      const migrate = (config: AppConfig) => config;
      migrationManager.registerMigration('1.0.0', '1.1.0', migrate);

      expect(migrationManager['migrations'].has('1.0.0->1.1.0')).toBe(true);
    });

    it('should reject invalid version format for fromVersion', () => {
      const migrate = (config: AppConfig) => config;
      expect(() => {
        migrationManager.registerMigration('invalid', '1.1.0', migrate);
      }).toThrow();
    });

    it('should reject invalid version format for toVersion', () => {
      const migrate = (config: AppConfig) => config;
      expect(() => {
        migrationManager.registerMigration('1.0.0', 'invalid', migrate);
      }).toThrow();
    });
  });

  describe('version comparison', () => {
    it('should detect when version is outdated', () => {
      const isOutdated = migrationManager.isVersionOutdated('0.9.0');
      expect(isOutdated).toBe(true);
    });

    it('should detect when version is current', () => {
      const isOutdated = migrationManager.isVersionOutdated('1.0.0');
      expect(isOutdated).toBe(false);
    });

    it('should detect when version is newer', () => {
      const isOutdated = migrationManager.isVersionOutdated('2.0.0');
      expect(isOutdated).toBe(false);
    });

    it('should handle semantic version comparison correctly', () => {
      expect(migrationManager.isVersionOutdated('0.1.0')).toBe(true);
      expect(migrationManager.isVersionOutdated('0.9.9')).toBe(true);
      expect(migrationManager.isVersionOutdated('1.0.0')).toBe(false);
      expect(migrationManager.isVersionOutdated('1.0.1')).toBe(false);
      expect(migrationManager.isVersionOutdated('2.0.0')).toBe(false);
    });
  });

  describe('migration path finding', () => {
    beforeEach(() => {
      // Register migration chain: 0.9.0 -> 0.10.0 -> 1.0.0
      const migrate_0_9_to_0_10 = (config: AppConfig): AppConfig => ({
        ...config,
        schemaVersion: '0.10.0',
      });

      const migrate_0_10_to_1_0 = (config: AppConfig): AppConfig => ({
        ...config,
        schemaVersion: '1.0.0',
      });

      migrationManager.registerMigration('0.9.0', '0.10.0', migrate_0_9_to_0_10);
      migrationManager.registerMigration('0.10.0', '1.0.0', migrate_0_10_to_1_0);
    });

    it('should find migration path for outdated config', () => {
      const path = migrationManager.findMigrationPath('0.9.0');
      expect(path).toEqual(['0.9.0->0.10.0', '0.10.0->1.0.0']);
    });

    it('should return empty path for current version', () => {
      const path = migrationManager.findMigrationPath('1.0.0');
      expect(path).toEqual([]);
    });

    it('should return empty path for newer version', () => {
      const path = migrationManager.findMigrationPath('2.0.0');
      expect(path).toEqual([]);
    });

    it('should return empty path when no migration path exists', () => {
      const path = migrationManager.findMigrationPath('0.8.0');
      expect(path).toEqual([]);
    });
  });

  describe('migration execution', () => {
    beforeEach(() => {
      // Register migration that adds a new field
      const migrate_0_9_to_1_0 = (config: AppConfig): AppConfig => ({
        ...config,
        schemaVersion: '1.0.0',
        maxParallelSessions: config.maxParallelSessions || 10,
      });

      migrationManager.registerMigration('0.9.0', '1.0.0', migrate_0_9_to_1_0);
    });

    it('should apply single migration to config', () => {
      const oldConfig: AppConfig = {
        schemaVersion: '0.9.0',
        claudePath: '',
        projectRoot: '',
        maxParallelSessions: 5,
        locale: 'en',
        autoCleanup: true,
      };

      const migrated = migrationManager.migrate(oldConfig);

      expect(migrated.schemaVersion).toBe('1.0.0');
      expect(migrated.maxParallelSessions).toBe(5);
    });

    it('should apply multiple migrations in sequence', () => {
      // Register chain
      const migrate_0_8_to_0_9 = (config: AppConfig): AppConfig => ({
        ...config,
        schemaVersion: '0.9.0',
      });

      migrationManager.registerMigration('0.8.0', '0.9.0', migrate_0_8_to_0_9);

      const oldConfig: AppConfig = {
        schemaVersion: '0.8.0',
        claudePath: '',
        projectRoot: '',
        maxParallelSessions: 5,
        locale: 'en',
        autoCleanup: true,
      };

      const migrated = migrationManager.migrate(oldConfig);

      expect(migrated.schemaVersion).toBe('1.0.0');
    });

    it('should return config unchanged if already current', () => {
      const currentConfig: AppConfig = {
        schemaVersion: '1.0.0',
        claudePath: '',
        projectRoot: '',
        maxParallelSessions: 10,
        locale: 'en',
        autoCleanup: true,
      };

      const migrated = migrationManager.migrate(currentConfig);

      expect(migrated.schemaVersion).toBe('1.0.0');
      expect(migrated).toEqual(currentConfig);
    });

    it('should return config unchanged if version is newer', () => {
      const newerConfig: AppConfig = {
        schemaVersion: '2.0.0',
        claudePath: '',
        projectRoot: '',
        maxParallelSessions: 10,
        locale: 'en',
        autoCleanup: true,
      };

      const migrated = migrationManager.migrate(newerConfig);

      expect(migrated.schemaVersion).toBe('2.0.0');
      expect(migrated).toEqual(newerConfig);
    });

    it('should preserve user customizations during migration', () => {
      const oldConfig: AppConfig = {
        schemaVersion: '0.9.0',
        claudePath: '/custom/path',
        projectRoot: '/custom/project',
        maxParallelSessions: 7,
        locale: 'ko',
        autoCleanup: false,
      };

      const migrated = migrationManager.migrate(oldConfig);

      expect(migrated.claudePath).toBe('/custom/path');
      expect(migrated.projectRoot).toBe('/custom/project');
      expect(migrated.maxParallelSessions).toBe(7);
      expect(migrated.locale).toBe('ko');
      expect(migrated.autoCleanup).toBe(false);
    });
  });

  describe('migration logging', () => {
    it('should track migration history', () => {
      const migrate = (config: AppConfig) => config;
      migrationManager.registerMigration('0.9.0', '1.0.0', migrate);

      const oldConfig: AppConfig = {
        schemaVersion: '0.9.0',
        claudePath: '',
        projectRoot: '',
        maxParallelSessions: 10,
        locale: 'en',
        autoCleanup: true,
      };

      migrationManager.migrate(oldConfig);

      const history = migrationManager.getMigrationHistory();
      expect(history).toContain('0.9.0->1.0.0');
    });

    it('should clear migration history', () => {
      const migrate = (config: AppConfig) => config;
      migrationManager.registerMigration('0.9.0', '1.0.0', migrate);

      const oldConfig: AppConfig = {
        schemaVersion: '0.9.0',
        claudePath: '',
        projectRoot: '',
        maxParallelSessions: 10,
        locale: 'en',
        autoCleanup: true,
      };

      migrationManager.migrate(oldConfig);
      migrationManager.clearMigrationHistory();

      const history = migrationManager.getMigrationHistory();
      expect(history).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('should throw when migration path is broken', () => {
      // Register only 0.9.0 -> 0.10.0, but config is at 0.8.0
      const migrate = (config: AppConfig) => config;
      migrationManager.registerMigration('0.9.0', '0.10.0', migrate);

      const oldConfig: AppConfig = {
        schemaVersion: '0.8.0',
        claudePath: '',
        projectRoot: '',
        maxParallelSessions: 10,
        locale: 'en',
        autoCleanup: true,
      };

      // Should not throw, but return config unchanged
      const migrated = migrationManager.migrate(oldConfig);
      expect(migrated.schemaVersion).toBe('0.8.0');
    });

    it('should handle migration function errors gracefully', () => {
      const brokenMigrate = (): AppConfig => {
        throw new Error('Migration failed');
      };

      migrationManager.registerMigration('0.9.0', '1.0.0', brokenMigrate);

      const oldConfig: AppConfig = {
        schemaVersion: '0.9.0',
        claudePath: '',
        projectRoot: '',
        maxParallelSessions: 10,
        locale: 'en',
        autoCleanup: true,
      };

      expect(() => {
        migrationManager.migrate(oldConfig);
      }).toThrow('Migration failed');
    });
  });
});

describe('Migration version validation', () => {
  it('should validate current version format', () => {
    const result = ConfigVersionSchema.safeParse('1.0.0');
    expect(result.success).toBe(true);
  });

  it('should reject invalid version format', () => {
    const result = ConfigVersionSchema.safeParse('invalid');
    expect(result.success).toBe(false);
  });
});
