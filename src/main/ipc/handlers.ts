/**
 * IPC handler implementations
 *
 * This module contains all IPC handler functions for communication between
 * Main and Renderer processes. Handlers are organized by category:
 * - Bootstrap: Dependency validation and environment checks
 * - Config: Configuration management
 * - Session: Session lifecycle management (placeholders for future SPECs)
 * - Spec: SPEC analysis and planning (placeholders for future SPECs)
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';
import { app } from 'electron';
import type {
  BootstrapResult,
  AppConfig,
  DependencyStatus,
} from '../../shared/types';
import { DEFAULT_CONFIG, MAX_PARALLEL_SESSIONS, SUPPORTED_LOCALES } from '../../shared/constants';
import { ConfigError, BootstrapError } from '../../shared/errors';
import { ERROR_CODES } from '../../shared/constants';

// ============================================================================
// Bootstrap Handlers (REQ-004)
// ============================================================================

/**
 * Check bootstrap dependencies and environment
 *
 * Validates that all required dependencies are installed and configured:
 * - Claude Code CLI
 * - MoAI-ADK framework
 * - Git worktree support
 *
 * @returns Promise resolving to bootstrap validation result
 *
 * @example
 * ```typescript
 * const result = await handleBootstrapCheck();
 * if (!result.claude) {
 *   console.error('Claude CLI not found');
 * }
 * ```
 */
export async function handleBootstrapCheck(): Promise<BootstrapResult> {
  try {
    // Check Claude Code CLI
    const claude = await checkClaudeCLI();

    // Check MoAI-ADK framework
    const moaiAdk = await checkMoaiAdk();

    // Check git worktree support
    const moaiWorktree = await checkGitWorktree();

    return {
      claude,
      moaiAdk,
      moaiWorktree,
    };
  } catch (error) {
    throw new BootstrapError(
      'BOOTSTRAP_CLAUDE_NOT_FOUND',
      'Bootstrap validation failed',
      { error: error instanceof Error ? error.message : String(error) }
    );
  }
}

/**
 * Check if Claude Code CLI is installed and accessible
 *
 * @returns Promise resolving to true if Claude CLI is available
 */
async function checkClaudeCLI(): Promise<boolean> {
  try {
    const claudePath = process.env.CLAUDE_PATH || 'claude';
    execSync(`${claudePath} --version`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if MoAI-ADK framework is installed in the project
 *
 * @returns Promise resolving to true if MoAI-ADK is available
 */
async function checkMoaiAdk(): Promise<boolean> {
  try {
    const moaiPath = join(process.cwd(), '.moai');
    return existsSync(moaiPath);
  } catch {
    return false;
  }
}

/**
 * Check if git worktree support is available
 *
 * @returns Promise resolving to true if git worktree is supported
 */
async function checkGitWorktree(): Promise<boolean> {
  try {
    // Check git version (worktree requires git 2.5+)
    execSync('git worktree list', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Configuration Handlers (REQ-004)
// ============================================================================

/**
 * Get configuration value by key
 *
 * Retrieves the current value for a configuration key. If no user config
 * exists, returns the default value.
 *
 * @param key - Configuration key to retrieve
 * @returns Promise resolving to configuration value
 * @throws ConfigError if key is invalid
 *
 * @example
 * ```typescript
 * const maxSessions = await handleConfigGet('maxParallelSessions');
 * console.log(`Max sessions: ${maxSessions}`);
 * ```
 */
export async function handleConfigGet<T extends keyof AppConfig>(
  key: T
): Promise<AppConfig[T]> {
  try {
    const config = loadConfig();

    if (!(key in config)) {
      throw new ConfigError(
        'CONFIG_INVALID_VALUE',
        `Invalid configuration key: ${String(key)}`
      );
    }

    return config[key];
  } catch (error) {
    if (error instanceof ConfigError) {
      throw error;
    }
    throw new ConfigError(
      'CONFIG_LOAD_FAILED',
      'Failed to get configuration value',
      { key, error: error instanceof Error ? error.message : String(error) }
    );
  }
}

/**
 * Set configuration value by key
 *
 * Updates a configuration value with validation and persistence.
 *
 * @param key - Configuration key to set
 * @param value - New value for the key
 * @returns Promise resolving when configuration is saved
 * @throws ConfigError if key is invalid or value fails validation
 *
 * @example
 * ```typescript
 * await handleConfigSet('maxParallelSessions', 5);
 * await handleConfigSet('locale', 'ko');
 * ```
 */
export async function handleConfigSet<T extends keyof AppConfig>(
  key: T,
  value: AppConfig[T]
): Promise<void> {
  try {
    // Validate key
    if (!(key in DEFAULT_CONFIG)) {
      throw new ConfigError(
        'CONFIG_INVALID_VALUE',
        `Invalid configuration key: ${String(key)}`
      );
    }

    // Validate value based on key
    validateConfigValue(key, value);

    // Load current config
    const config = loadConfig();

    // Update value
    config[key] = value;

    // Persist config
    saveConfig(config);
  } catch (error) {
    if (error instanceof ConfigError) {
      throw error;
    }
    throw new ConfigError(
      'CONFIG_SAVE_FAILED',
      'Failed to set configuration value',
      { key, value, error: error instanceof Error ? error.message : String(error) }
    );
  }
}

/**
 * Validate configuration value based on key
 *
 * @param key - Configuration key
 * @param value - Value to validate
 * @throws ConfigError if validation fails
 */
function validateConfigValue<T extends keyof AppConfig>(
  key: T,
  value: AppConfig[T]
): void {
  switch (key) {
    case 'maxParallelSessions':
      const maxVal = value as number;
      if (typeof maxVal !== 'number' || maxVal < 1 || maxVal > MAX_PARALLEL_SESSIONS) {
        throw new ConfigError(
          'CONFIG_INVALID_VALUE',
          `maxParallelSessions must be between 1 and ${MAX_PARALLEL_SESSIONS}`,
          { key, value: maxVal }
        );
      }
      break;

    case 'locale':
      const localeVal = value as string;
      if (!SUPPORTED_LOCALES.includes(localeVal as any)) {
        throw new ConfigError(
          'CONFIG_INVALID_VALUE',
          `locale must be one of: ${SUPPORTED_LOCALES.join(', ')}`,
          { key, value: localeVal }
        );
      }
      break;

    case 'claudePath':
    case 'projectRoot':
      if (typeof value !== 'string' || value.trim().length === 0) {
        throw new ConfigError(
          'CONFIG_INVALID_VALUE',
          `${String(key)} must be a non-empty string`,
          { key, value }
        );
      }
      break;

    case 'autoCleanup':
      if (typeof value !== 'boolean') {
        throw new ConfigError(
          'CONFIG_INVALID_VALUE',
          `autoCleanup must be a boolean`,
          { key, value }
        );
      }
      break;
  }
}

/**
 * Load configuration from user data directory
 *
 * @returns Current configuration (user config merged with defaults)
 */
function loadConfig(): AppConfig {
  try {
    const configPath = join(app.getPath('userData'), 'config.json');

    if (!existsSync(configPath)) {
      return { ...DEFAULT_CONFIG };
    }

    const userConfig = JSON.parse(readFileSync(configPath, 'utf-8'));
    return { ...DEFAULT_CONFIG, ...userConfig };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Save configuration to user data directory
 *
 * @param config - Configuration to save
 */
function saveConfig(config: AppConfig): void {
  try {
    const configPath = join(app.getPath('userData'), 'config.json');
    writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
  } catch (error) {
    throw new ConfigError(
      'CONFIG_SAVE_FAILED',
      'Failed to save configuration file',
      { error: error instanceof Error ? error.message : String(error) }
    );
  }
}

// ============================================================================
// Session Handlers (Placeholders for future SPECs)
// ============================================================================

/**
 * Start a SPEC execution session
 *
 * Placeholder for SPEC-SESSION-001 implementation
 */
export async function handleSessionStart(specId: string): Promise<void> {
  // TODO: Implement in SPEC-SESSION-001
  throw new Error('Session management not yet implemented');
}

/**
 * Stop a running session
 *
 * Placeholder for SPEC-SESSION-001 implementation
 */
export async function handleSessionStop(sessionId: string): Promise<void> {
  // TODO: Implement in SPEC-SESSION-001
  throw new Error('Session management not yet implemented');
}

/**
 * Get session status
 *
 * Placeholder for SPEC-SESSION-001 implementation
 */
export async function handleSessionStatus(sessionId: string): Promise<unknown> {
  // TODO: Implement in SPEC-SESSION-001
  throw new Error('Session management not yet implemented');
}

// ============================================================================
// Spec Handlers (Placeholders for future SPECs)
// ============================================================================

/**
 * Scan project for SPEC files
 *
 * Placeholder for SPEC-ANALYZER-001 implementation
 */
export async function handleSpecScan(projectPath: string): Promise<unknown> {
  // TODO: Implement in SPEC-ANALYZER-001
  throw new Error('SPEC analysis not yet implemented');
}

/**
 * Analyze SPEC dependencies
 *
 * Placeholder for SPEC-ANALYZER-001 implementation
 */
export async function handleSpecAnalyze(specs: unknown): Promise<unknown> {
  // TODO: Implement in SPEC-ANALYZER-001
  throw new Error('SPEC analysis not yet implemented');
}

/**
 * List all available SPECs
 *
 * Placeholder for SPEC-ANALYZER-001 implementation
 */
export async function handleSpecList(): Promise<unknown> {
  // TODO: Implement in SPEC-ANALYZER-001
  throw new Error('SPEC analysis not yet implemented');
}
