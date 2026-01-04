/**
 * TAG-FUNC-003: Enhanced Configuration Service
 *
 * Enhanced configuration service with:
 * - Zod schema validation
 * - Migration support
 * - Environment variable overrides
 * - Backup functionality
 * - Import/export capabilities
 * - Live reload notifications
 *
 * Technical Constraints:
 * - electron-store for persistence
 * - Zod for validation
 * - Schema versioning
 * - Priority: env > user > defaults
 */

import { app } from 'electron';
import Store from 'electron-store';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { AppConfig, ConfigVersion } from '../config/schema';
import {
  AppConfigSchema,
  DEFAULT_CONFIG,
  validateConfig,
  validatePartialConfig,
} from '../config/schema';
import { MigrationManager } from '../config/migrations';

/**
 * Environment variable mappings
 *
 * Maps environment variable names to config keys.
 */
const ENV_MAPPINGS: Record<string, keyof AppConfig> = {
  CPR_CLAUDE_PATH: 'claudePath',
  CPR_PROJECT_ROOT: 'projectRoot',
  CPR_MAX_SESSIONS: 'maxParallelSessions',
  CPR_LOCALE: 'locale',
  CPR_AUTO_CLEANUP: 'autoCleanup',
};

/**
 * Config Service Options
 */
export interface ConfigServiceOptions {
  name?: string;
  cwd?: string;
  enableBackups?: boolean;
  maxBackups?: number;
  enableEnvOverrides?: boolean;
}

/**
 * Enhanced Config Service
 *
 * Provides comprehensive configuration management with validation,
 * migrations, environment overrides, backup, and import/export.
 *
 * @example
 * ```typescript
 * const service = new ConfigService();
 * const value = service.get('maxParallelSessions');
 * service.set('locale', 'ko');
 * await service.exportConfig('/path/to/config.json');
 * ```
 */
export class ConfigService {
  private store: Store<AppConfig>;
  private migrationManager: MigrationManager;
  private options: Required<ConfigServiceOptions>;
  private envOverrides: Partial<AppConfig>;
  private changeListeners: Map<keyof AppConfig, Set<Function>>;

  /**
   * Create a new ConfigService instance
   */
  constructor(options: ConfigServiceOptions = {}) {
    this.options = {
      name: options.name || 'config',
      cwd: options.cwd || app.getPath('userData'),
      enableBackups: options.enableBackups ?? true,
      maxBackups: options.maxBackups ?? 10,
      enableEnvOverrides: options.enableEnvOverrides ?? true,
    };

    // Initialize migration manager
    this.migrationManager = new MigrationManager(DEFAULT_CONFIG.schemaVersion);

    // Initialize store
    const storeOptions: ElectronStore.Options<AppConfig> = {
      name: this.options.name,
      cwd: this.options.cwd,
      defaults: DEFAULT_CONFIG,
      migrations: {},
      clearInvalidConfig: false, // We handle validation ourselves
    };

    this.store = new Store<AppConfig>(storeOptions);

    // Initialize state
    this.changeListeners = new Map();
    this.envOverrides = {};

    // Load environment overrides if enabled
    if (this.options.enableEnvOverrides) {
      this.loadEnvironmentOverrides();
    }

    // Initialize and validate config
    this.initializeConfig();
  }

  /**
   * Initialize configuration with validation and migrations
   */
  private initializeConfig(): void {
    let config = this.store.store;

    // Validate current config
    const validationResult = validateConfig(config);

    if (!validationResult.success) {
      console.warn('Invalid configuration detected, applying defaults');
      this.store.clear();
      config = { ...DEFAULT_CONFIG };
      this.store.store = config;
    } else {
      config = validationResult.data;
    }

    // Apply migrations if needed
    if (this.migrationManager.isVersionOutdated(config.schemaVersion)) {
      console.log(`Migrating config from ${config.schemaVersion} to ${DEFAULT_CONFIG.schemaVersion}`);
      config = this.migrationManager.migrate(config);
      this.store.store = config;
    }
  }

  /**
   * Load environment variable overrides
   */
  private loadEnvironmentOverrides(): void {
    this.envOverrides = {};

    for (const [envVar, configKey] of Object.entries(ENV_MAPPINGS)) {
      const envValue = process.env[envVar];
      if (envValue !== undefined) {
        const parsed = this.parseEnvValue(envValue, configKey);
        if (parsed !== undefined) {
          (this.envOverrides[configKey] as AppConfig[typeof configKey]) = parsed;
        }
      }
    }
  }

  /**
   * Parse environment variable value
   */
  private parseEnvValue(value: string, key: keyof AppConfig): AppConfig[keyof AppConfig] | undefined {
    switch (key) {
      case 'maxParallelSessions':
        const num = parseInt(value, 10);
        return isNaN(num) ? undefined : (num as AppConfig[keyof AppConfig]);

      case 'autoCleanup':
        if (value.toLowerCase() === 'true') return true as AppConfig[keyof AppConfig];
        if (value.toLowerCase() === 'false') return false as AppConfig[keyof AppConfig];
        return undefined;

      case 'claudePath':
      case 'projectRoot':
      case 'locale':
        return value as AppConfig[keyof AppConfig];

      default:
        return undefined;
    }
  }

  /**
   * Get a configuration value
   *
   * Priority: env > user > defaults
   */
  get<T extends keyof AppConfig>(key: T): AppConfig[T] {
    // Check environment override first
    if (this.options.enableEnvOverrides && key in this.envOverrides) {
      return this.envOverrides[key] as AppConfig[T];
    }

    // Check stored value
    if (this.store.has(key)) {
      return this.store.get(key, DEFAULT_CONFIG[key]);
    }

    // Return default
    return DEFAULT_CONFIG[key];
  }

  /**
   * Set a configuration value
   */
  async set<T extends keyof AppConfig>(key: T, value: AppConfig[T]): Promise<void> {
    // Validate value
    const partialConfig = { [key]: value } as Partial<AppConfig>;
    const validation = validatePartialConfig(partialConfig);

    if (!validation.success) {
      throw new Error(`Invalid value for ${String(key)}: ${validation.error.message}`);
    }

    // Create backup if enabled
    if (this.options.enableBackups) {
      await this.createBackup();
    }

    // Get old value for notification
    const oldValue = this.get(key);

    // Set value (only if not overridden by env)
    if (!this.options.enableEnvOverrides || !(key in this.envOverrides)) {
      this.store.set(key, value);
    }

    // Notify listeners
    this.notifyChange(key, value, oldValue);
  }

  /**
   * Get all configuration values
   */
  getAll(): AppConfig {
    const stored = this.store.store;
    const overrides = this.envOverrides;

    return {
      ...stored,
      ...overrides,
    };
  }

  /**
   * Set multiple configuration values
   */
  async setMany(values: Partial<AppConfig>): Promise<void> {
    const validation = validatePartialConfig(values);

    if (!validation.success) {
      throw new Error(`Invalid values: ${validation.error.message}`);
    }

    // Create backup if enabled
    if (this.options.enableBackups) {
      await this.createBackup();
    }

    for (const [key, value] of Object.entries(values)) {
      await this.set(key as keyof AppConfig, value as AppConfig[keyof AppConfig]);
    }
  }

  /**
   * Create a backup of current configuration
   */
  async createBackup(): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilename = `config-backup-${timestamp}.json`;
    const backupPath = path.join(this.options.cwd, backupFilename);

    try {
      await fs.writeFile(backupPath, JSON.stringify(this.store.store, null, 2));
      await this.cleanupOldBackups();
    } catch (error) {
      console.error('Failed to create backup:', error);
    }
  }

  /**
   * Clean up old backups
   */
  private async cleanupOldBackups(): Promise<void> {
    try {
      const files = await fs.readdir(this.options.cwd);
      const backups = files
        .filter((f) => f.startsWith('config-backup-') && f.endsWith('.json'))
        .sort()
        .reverse();

      // Remove excess backups
      if (backups.length > this.options.maxBackups) {
        for (const oldBackup of backups.slice(this.options.maxBackups)) {
          const oldPath = path.join(this.options.cwd, oldBackup);
          await fs.unlink(oldPath).catch(() => {});
        }
      }
    } catch (error) {
      console.error('Failed to cleanup backups:', error);
    }
  }

  /**
   * Import configuration from JSON file
   */
  async importConfig(filePath: string, merge = false): Promise<void> {
    try {
      // Read file
      const content = await fs.readFile(filePath, 'utf-8');
      const imported = JSON.parse(content);

      // Validate imported config
      const validation = validateConfig(imported);

      if (!validation.success) {
        throw new Error(`Invalid configuration: ${validation.error.message}`);
      }

      // Create backup
      if (this.options.enableBackups) {
        await this.createBackup();
      }

      // Apply config
      if (merge) {
        await this.setMany(validation.data);
      } else {
        this.store.store = validation.data;
      }
    } catch (error) {
      throw new Error(`Import failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Export configuration to JSON file
   */
  async exportConfig(filePath: string): Promise<void> {
    try {
      const config = this.getAll();

      // Validate before export
      const validation = validateConfig(config);

      if (!validation.success) {
        throw new Error(`Invalid configuration: ${validation.error.message}`);
      }

      // Write to file
      await fs.writeFile(filePath, JSON.stringify(validation.data, null, 2));
    } catch (error) {
      throw new Error(`Export failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Watch for configuration changes
   */
  onDidChange<T extends keyof AppConfig>(
    key: T,
    callback: (newValue: AppConfig[T], oldValue: AppConfig[T]) => void
  ): () => void {
    if (!this.changeListeners.has(key)) {
      this.changeListeners.set(key, new Set());
    }

    this.changeListeners.get(key)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.changeListeners.get(key)?.delete(callback);
    };
  }

  /**
   * Notify listeners of configuration change
   */
  private notifyChange<T extends keyof AppConfig>(
    key: T,
    newValue: AppConfig[T],
    oldValue: AppConfig[T]
  ): void {
    const listeners = this.changeListeners.get(key);
    if (listeners) {
      for (const callback of listeners) {
        try {
          callback(newValue, oldValue);
        } catch (error) {
          console.error(`Error in config change listener for ${String(key)}:`, error);
        }
      }
    }
  }

  /**
   * Get the underlying electron-store instance
   */
  getStore(): Store<AppConfig> {
    return this.store;
  }

  /**
   * Reset a configuration key to default
   */
  reset<T extends keyof AppConfig>(key: T): void {
    this.store.set(key, DEFAULT_CONFIG[key]);
  }

  /**
   * Reset all configuration to defaults
   */
  resetAll(): void {
    this.store.clear();
    for (const [key, value] of Object.entries(DEFAULT_CONFIG)) {
      this.store.set(key as keyof AppConfig, value as AppConfig[keyof AppConfig]);
    }
  }

  /**
   * Delete a configuration key
   */
  delete<T extends keyof AppConfig>(key: T): void {
    this.store.delete(key);
  }

  /**
   * Check if a configuration key has been explicitly set
   */
  has<T extends keyof AppConfig>(key: T): boolean {
    return this.store.has(key);
  }
}
