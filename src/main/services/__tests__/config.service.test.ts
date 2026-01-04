/**
 * TAG-TEST-003: Enhanced Config Service Tests (RED Phase)
 *
 * Tests for enhanced configuration service with:
 * - Zod validation
 * - Migration support
 * - Environment variable overrides
 * - Backup functionality
 * - Import/export
 * - Live reload notifications
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ConfigService } from '../config.service';
import type { AppConfig } from '@main/config/schema';
import { AppConfigSchema, DEFAULT_CONFIG } from '@main/config/schema';
import { app } from 'electron';
import fs from 'fs/promises';
import path from 'path';

// Mock electron-store
vi.mock('electron-store', () => ({
  default: vi.fn().mockImplementation(() => ({
    get: vi.fn(),
    set: vi.fn(),
    has: vi.fn(),
    delete: vi.fn(),
    clear: vi.fn(),
    onDidChange: vi.fn(),
    store: {},
  })),
}));

// Mock electron app
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn((name: string) => {
      if (name === 'userData') return '/mock/userdata';
      return '/mock/path';
    }),
  },
}));

// Mock fs
vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  copyFile: vi.fn(),
  mkdir: vi.fn(),
  access: vi.fn(),
  unlink: vi.fn(),
}));

describe('Enhanced ConfigService', () => {
  let configService: ConfigService;

  beforeEach(() => {
    configService = new ConfigService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization with validation', () => {
    it('should validate config on initialization', () => {
      // Service should initialize with valid defaults
      const config = configService.getAll();
      const result = AppConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should apply migrations on initialization', () => {
      // Test migration application during init
      const oldConfig: AppConfig = {
        schemaVersion: '0.9.0',
        claudePath: '',
        projectRoot: '',
        maxParallelSessions: 5,
        locale: 'en',
        autoCleanup: true,
      };

      // Mock store to return old config
      const store = configService.getStore();
      store.store = oldConfig;

      // Re-initialize to trigger migration
      const newService = new ConfigService();
      const config = newService.getAll();

      // Should migrate to current version
      expect(config.schemaVersion).toBe(DEFAULT_CONFIG.schemaVersion);
    });

    it('should reject invalid config on initialization', () => {
      // This test verifies that invalid configs are handled
      // The service should use defaults if validation fails
      const invalidConfig = {
        schemaVersion: 'invalid',
        maxParallelSessions: 99, // Invalid
        locale: 'fr', // Invalid
      };

      // Mock store to return invalid config
      const store = configService.getStore();
      store.store = invalidConfig;

      // Service should handle gracefully
      const newService = new ConfigService();
      const config = newService.getAll();

      // Should have valid config
      const result = AppConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });
  });

  describe('Zod validation on set operations', () => {
    it('should validate using Zod schema on set', () => {
      expect(() => {
        configService.set('maxParallelSessions', 11); // Invalid (> 10)
      }).toThrow();
    });

    it('should validate locale enum on set', () => {
      expect(() => {
        configService.set('locale', 'fr' as any); // Invalid locale
      }).toThrow();
    });

    it('should validate type on set', () => {
      expect(() => {
        configService.set('maxParallelSessions', '10' as any); // Wrong type
      }).toThrow();
    });

    it('should accept valid values on set', () => {
      expect(() => {
        configService.set('maxParallelSessions', 5);
        configService.set('locale', 'ko');
        configService.set('autoCleanup', false);
      }).not.toThrow();
    });
  });

  describe('environment variable overrides', () => {
    let originalEnv: NodeJS.ProcessEnv;

    beforeEach(() => {
      originalEnv = process.env;
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should override maxParallelSessions from env', () => {
      process.env.CPR_MAX_SESSIONS = '8';

      const service = new ConfigService();
      const value = service.get('maxParallelSessions');

      expect(value).toBe(8);
    });

    it('should override locale from env', () => {
      process.env.CPR_LOCALE = 'ko';

      const service = new ConfigService();
      const value = service.get('locale');

      expect(value).toBe('ko');
    });

    it('should override claudePath from env', () => {
      process.env.CPR_CLAUDE_PATH = '/custom/path';

      const service = new ConfigService();
      const value = service.get('claudePath');

      expect(value).toBe('/custom/path');
    });

    it('should prioritize env over stored config', () => {
      process.env.CPR_MAX_SESSIONS = '7';

      const service = new ConfigService();
      service.set('maxParallelSessions', 5);

      // Env should take priority
      const value = service.get('maxParallelSessions');
      expect(value).toBe(7);
    });

    it('should use default when env is not set', () => {
      delete process.env.CPR_MAX_SESSIONS;

      const service = new ConfigService();
      const value = service.get('maxParallelSessions');

      expect(value).toBe(DEFAULT_CONFIG.maxParallelSessions);
    });

    it('should reject invalid env values', () => {
      process.env.CPR_MAX_SESSIONS = 'invalid';

      const service = new ConfigService();
      const value = service.get('maxParallelSessions');

      // Should fall back to default
      expect(value).toBe(DEFAULT_CONFIG.maxParallelSessions);
    });
  });

  describe('backup functionality', () => {
    it('should create backup before changes', async () => {
      const backupSpy = vi.spyOn(configService as any, 'createBackup');

      await configService.set('maxParallelSessions', 5);

      expect(backupSpy).toHaveBeenCalled();
    });

    it('should store backup with timestamp', async () => {
      const writeFileMock = vi.mocked(fs.writeFile);
      writeFileMock.mockResolvedValue(undefined);

      await (configService as any).createBackup();

      expect(writeFileMock).toHaveBeenCalled();
      const backupPath = writeFileMock.mock.calls[0][0];
      expect(backupPath).toContain('config-backup-');
      expect(backupPath).toContain('.json');
    });

    it('should limit backup count', async () => {
      // Create multiple backups
      for (let i = 0; i < 15; i++) {
        await (configService as any).createBackup();
      }

      // Should only keep max 10 backups
      const unlinkMock = vi.mocked(fs.unlink);
      expect(unlinkMock).toHaveBeenCalled();
    });
  });

  describe('import functionality', () => {
    it('should import valid config from JSON', async () => {
      const validConfig: AppConfig = {
        schemaVersion: '1.0.0',
        claudePath: '/imported/path',
        projectRoot: '/imported/project',
        maxParallelSessions: 7,
        locale: 'ko',
        autoCleanup: false,
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(validConfig));

      await configService.importConfig('/path/to/config.json');

      expect(configService.get('claudePath')).toBe('/imported/path');
      expect(configService.get('maxParallelSessions')).toBe(7);
    });

    it('should create backup before import', async () => {
      const backupSpy = vi.spyOn(configService as any, 'createBackup');
      const validConfig = { ...DEFAULT_CONFIG };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(validConfig));

      await configService.importConfig('/path/to/config.json');

      expect(backupSpy).toHaveBeenCalled();
    });

    it('should reject invalid config on import', async () => {
      const invalidConfig = {
        schemaVersion: 'invalid',
        maxParallelSessions: 99,
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(invalidConfig));

      await expect(
        configService.importConfig('/path/to/config.json')
      ).rejects.toThrow();
    });

    it('should merge with existing config', async () => {
      const partialConfig = {
        schemaVersion: '1.0.0',
        maxParallelSessions: 8,
        locale: 'ja',
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(partialConfig));

      await configService.importConfig('/path/to/config.json', true);

      expect(configService.get('maxParallelSessions')).toBe(8);
      expect(configService.get('locale')).toBe('ja');
    });
  });

  describe('export functionality', () => {
    it('should export config to JSON file', async () => {
      const writeFileMock = vi.mocked(fs.writeFile);
      writeFileMock.mockResolvedValue(undefined);

      await configService.exportConfig('/path/to/export.json');

      expect(writeFileMock).toHaveBeenCalledWith(
        '/path/to/export.json',
        expect.stringContaining('"schemaVersion"')
      );
    });

    it('should export all config values', async () => {
      const writeFileMock = vi.mocked(fs.writeFile);
      writeFileMock.mockResolvedValue(undefined);

      await configService.exportConfig('/path/to/export.json');

      const exportedData = JSON.parse(writeFileMock.mock.calls[0][1] as string);

      expect(exportedData).toHaveProperty('schemaVersion');
      expect(exportedData).toHaveProperty('claudePath');
      expect(exportedData).toHaveProperty('projectRoot');
      expect(exportedData).toHaveProperty('maxParallelSessions');
      expect(exportedData).toHaveProperty('locale');
      expect(exportedData).toHaveProperty('autoCleanup');
    });

    it('should validate config before export', async () => {
      const writeFileMock = vi.mocked(fs.writeFile);
      writeFileMock.mockResolvedValue(undefined);

      await configService.exportConfig('/path/to/export.json');

      const exportedData = JSON.parse(writeFileMock.mock.calls[0][1] as string);
      const result = AppConfigSchema.safeParse(exportedData);

      expect(result.success).toBe(true);
    });
  });

  describe('live reload notifications', () => {
    it('should emit event on config change', () => {
      const callback = vi.fn();
      configService.onDidChange('maxParallelSessions', callback);

      configService.set('maxParallelSessions', 7);

      expect(callback).toHaveBeenCalledWith(7, 10);
    });

    it('should notify all subscribers on change', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      configService.onDidChange('locale', callback1);
      configService.onDidChange('locale', callback2);

      configService.set('locale', 'ko');

      expect(callback1).toHaveBeenCalledWith('ko', 'en');
      expect(callback2).toHaveBeenCalledWith('ko', 'en');
    });

    it('should allow unsubscribing from changes', () => {
      const callback = vi.fn();
      const unwatch = configService.onDidChange('autoCleanup', callback);

      unwatch();
      configService.set('autoCleanup', false);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle file read errors gracefully', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('File not found'));

      await expect(
        configService.importConfig('/nonexistent/file.json')
      ).rejects.toThrow();
    });

    it('should handle invalid JSON gracefully', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('invalid json{');

      await expect(
        configService.importConfig('/path/to/config.json')
      ).rejects.toThrow();
    });

    it('should handle write errors during export', async () => {
      vi.mocked(fs.writeFile).mockRejectedValue(new Error('Permission denied'));

      await expect(
        configService.exportConfig('/readonly/path.json')
      ).rejects.toThrow();
    });
  });

  describe('integration scenarios', () => {
    it('should handle full workflow: import -> validate -> backup -> apply', async () => {
      const validConfig: AppConfig = {
        schemaVersion: '1.0.0',
        claudePath: '/test/path',
        projectRoot: '/test/root',
        maxParallelSessions: 6,
        locale: 'ja',
        autoCleanup: false,
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(validConfig));
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      await configService.importConfig('/path/to/config.json');

      expect(configService.get('claudePath')).toBe('/test/path');
      expect(configService.get('maxParallelSessions')).toBe(6);
    });

    it('should apply env overrides over imported config', async () => {
      process.env.CPR_MAX_SESSIONS = '9';

      const validConfig = { ...DEFAULT_CONFIG, maxParallelSessions: 5 };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(validConfig));

      const service = new ConfigService();
      await service.importConfig('/path/to/config.json');

      expect(service.get('maxParallelSessions')).toBe(9); // Env wins
    });
  });
});
