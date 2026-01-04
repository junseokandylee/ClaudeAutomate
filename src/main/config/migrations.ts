/**
 * TAG-FUNC-002: Configuration Migration System
 *
 * REQ-004: Configuration Migration
 * - Detect outdated config versions
 * - Apply migration transforms
 * - Preserve user customizations
 * - Log migration actions
 *
 * Technical Constraints:
 * - Schema versioning required
 * - Semantic version comparison
 * - Sequential migration application
 * - Migration history tracking
 */

import type { AppConfig } from './schema';
import { DEFAULT_CONFIG, ConfigVersionSchema } from './schema';

/**
 * Migration function type
 *
 * Transforms configuration from one version to another.
 * Should preserve user customizations while applying structural changes.
 *
 * @param config - Configuration to migrate
 * @returns Migrated configuration with updated schema version
 *
 * @example
 * ```typescript
 * const migrate: MigrationFunction = (config) => ({
 *   ...config,
 *   schemaVersion: '1.1.0',
 *   newField: DEFAULT_CONFIG.newField
 * });
 * ```
 */
export type MigrationFunction = (config: AppConfig) => AppConfig;

/**
 * Migration definition
 *
 * Represents a single migration step between two versions.
 *
 * @property fromVersion - Source version (must be valid semver)
 * @property toVersion - Target version (must be valid semver)
 * @property migrate - Function to transform config from fromVersion to toVersion
 *
 * @example
 * ```typescript
 * const migration: Migration = {
 *   fromVersion: '1.0.0',
 *   toVersion: '1.1.0',
 *   migrate: (config) => ({ ...config, schemaVersion: '1.1.0' })
 * };
 * ```
 */
export interface Migration {
  fromVersion: string;
  toVersion: string;
  migrate: MigrationFunction;
}

/**
 * Migration Manager
 *
 * Manages configuration schema migrations including:
 * - Migration registration and storage
 * - Version comparison and outdated detection
 * - Migration path discovery
 * - Sequential migration application
 * - Migration history tracking
 *
 * @example
 * ```typescript
 * const manager = new MigrationManager('1.0.0');
 *
 * // Register migration
 * manager.registerMigration('1.0.0', '1.1.0', (config) => ({
 *   ...config,
 *   schemaVersion: '1.1.0'
 * }));
 *
 * // Migrate config
 * const migrated = manager.migrate(oldConfig);
 * ```
 */
export class MigrationManager {
  private currentVersion: string;
  private migrations: Map<string, Migration>;
  private migrationHistory: string[];

  /**
   * Create a new MigrationManager
   *
   * @param currentVersion - Current schema version (default: '1.0.0')
   * @throws Error if currentVersion is invalid semver
   */
  constructor(currentVersion: string = '1.0.0') {
    // Validate current version format
    const result = ConfigVersionSchema.safeParse(currentVersion);
    if (!result.success) {
      throw new Error(`Invalid current version: ${currentVersion}`);
    }

    this.currentVersion = currentVersion;
    this.migrations = new Map();
    this.migrationHistory = [];
  }

  /**
   * Get the current schema version
   *
   * @returns Current version string
   */
  getCurrentVersion(): string {
    return this.currentVersion;
  }

  /**
   * Register a migration
   *
   * Registers a migration function for transforming configs between versions.
   *
   * @param fromVersion - Source version
   * @param toVersion - Target version
   * @param migrate - Migration function
   * @throws Error if versions are invalid semver
   *
   * @example
   * ```typescript
   * manager.registerMigration('1.0.0', '1.1.0', (config) => ({
   *   ...config,
   *   schemaVersion: '1.1.0',
   *   newField: DEFAULT_CONFIG.newField
   * }));
   * ```
   */
  registerMigration(
    fromVersion: string,
    toVersion: string,
    migrate: MigrationFunction
  ): void {
    // Validate version formats
    const fromResult = ConfigVersionSchema.safeParse(fromVersion);
    const toResult = ConfigVersionSchema.safeParse(toVersion);

    if (!fromResult.success) {
      throw new Error(`Invalid fromVersion: ${fromVersion}`);
    }

    if (!toResult.success) {
      throw new Error(`Invalid toVersion: ${toVersion}`);
    }

    const key = `${fromVersion}->${toVersion}`;
    this.migrations.set(key, {
      fromVersion,
      toVersion,
      migrate,
    });
  }

  /**
   * Check if a version is outdated
   *
   * Compares the given version against the current schema version.
   *
   * @param version - Version to check
   * @returns True if version is older than current version
   *
   * @example
   * ```typescript
   * if (manager.isVersionOutdated(config.schemaVersion)) {
   *   const migrated = manager.migrate(config);
   * }
   * ```
   */
  isVersionOutdated(version: string): boolean {
    try {
      const validated = ConfigVersionSchema.parse(version);
      return this.compareVersions(validated, this.currentVersion) < 0;
    } catch {
      // Invalid version is considered outdated
      return true;
    }
  }

  /**
   * Compare two semantic versions
   *
   * @param v1 - First version
   * @param v2 - Second version
   * @returns Negative if v1 < v2, 0 if equal, positive if v1 > v2
   * @private
   */
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('-')[0].split('+')[0].split('.').map(Number);
    const parts2 = v2.split('-')[0].split('+')[0].split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      const num1 = parts1[i] || 0;
      const num2 = parts2[i] || 0;

      if (num1 !== num2) {
        return num1 - num2;
      }
    }

    return 0;
  }

  /**
   * Find migration path from version to current
   *
   * Constructs a sequence of migrations to bring a config up to current version.
   *
   * @param fromVersion - Starting version
   * @returns Array of migration keys in execution order
   *
   * @example
   * ```typescript
   * const path = manager.findMigrationPath('0.9.0');
   * // Returns: ['0.9.0->0.10.0', '0.10.0->1.0.0']
   * ```
   */
  findMigrationPath(fromVersion: string): string[] {
    const path: string[] = [];
    let current = fromVersion;

    // Build path by finding sequential migrations
    while (this.compareVersions(current, this.currentVersion) < 0) {
      let found = false;

      // Find a migration from current version
      for (const [key, migration] of this.migrations.entries()) {
        if (migration.fromVersion === current) {
          path.push(key);
          current = migration.toVersion;
          found = true;
          break;
        }
      }

      // No migration found - path is broken
      if (!found) {
        return [];
      }
    }

    return path;
  }

  /**
   * Migrate configuration to current version
   *
   * Applies all necessary migrations in sequence to bring config up to current version.
   * Preserves user customizations while applying structural changes.
   *
   * @param config - Configuration to migrate
   * @returns Migrated configuration at current version
   * @throws Error if migration function fails
   *
   * @example
   * ```typescript
   * const oldConfig = loadConfig(); // schemaVersion: '0.9.0'
   * const newConfig = manager.migrate(oldConfig); // schemaVersion: '1.0.0'
   * ```
   */
  migrate(config: AppConfig): AppConfig {
    // If already current or newer, return as-is
    if (!this.isVersionOutdated(config.schemaVersion)) {
      return config;
    }

    // Find migration path
    const path = this.findMigrationPath(config.schemaVersion);

    // No path found - return config unchanged
    if (path.length === 0) {
      return config;
    }

    // Apply migrations in sequence
    let current = config;

    for (const key of path) {
      const migration = this.migrations.get(key);
      if (!migration) {
        continue; // Should not happen
      }

      try {
        current = migration.migrate(current);
        this.migrationHistory.push(key);
      } catch (error) {
        throw new Error(
          `Migration ${key} failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    return current;
  }

  /**
   * Get migration history
   *
   * Returns list of migrations applied during the last migrate() call.
   *
   * @returns Array of migration keys in execution order
   *
   * @example
   * ```typescript
   * manager.migrate(oldConfig);
   * const history = manager.getMigrationHistory();
   * console.log('Applied migrations:', history);
   * ```
   */
  getMigrationHistory(): string[] {
    return [...this.migrationHistory];
  }

  /**
   * Clear migration history
   *
   * Resets the migration history tracker.
   *
   * @example
   * ```typescript
   * manager.clearMigrationHistory();
   * ```
   */
  clearMigrationHistory(): void {
    this.migrationHistory = [];
  }

  /**
   * Get all registered migrations
   *
   * Returns map of all registered migrations.
   *
   * @returns Map of migration keys to Migration objects
   *
   * @example
   * ```typescript
   * const allMigrations = manager.getMigrations();
   * console.log('Registered migrations:', allMigrations.size);
   * ```
   */
  getMigrations(): Map<string, Migration> {
    return new Map(this.migrations);
  }
}

/**
 * Default migration manager instance
 *
 * Pre-configured with current schema version.
 */
export const defaultMigrationManager = new MigrationManager(DEFAULT_CONFIG.schemaVersion);

/**
 * Migrate configuration using default manager
 *
 * Convenience function for migrating configs with the default manager.
 *
 * @param config - Configuration to migrate
 * @returns Migrated configuration
 *
 * @example
 * ```typescript
 * const migrated = migrateConfig(oldConfig);
 * ```
 */
export function migrateConfig(config: AppConfig): AppConfig {
  return defaultMigrationManager.migrate(config);
}
