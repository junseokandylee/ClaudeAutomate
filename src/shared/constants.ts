/**
 * Shared constants for ClaudeParallelRunner
 *
 * This module contains all constant values used by both Main and Renderer processes.
 * All constants are cross-platform compatible.
 */

import type { IpcChannels, SupportedLocale } from './types';

// ============================================================================
// TASK-006: Application Constants (REQ-003, TAG-004)
// ============================================================================

/**
 * IPC channel names
 *
 * Canonical mapping of all IPC channels used for Main <-> Renderer communication.
 * Use these constants instead of string literals to avoid typos.
 *
 * @example
 * ```typescript
 * ipcRenderer.send(IPC_CHANNELS.SESSION_START, { specId: 'SPEC-001' });
 * ```
 */
export const IPC_CHANNELS: Record<string, IpcChannels> = {
  // Session Management (Main -> Renderer events)
  SESSION_CREATED: 'session:created',
  SESSION_STARTED: 'session:started',
  SESSION_COMPLETED: 'session:completed',
  SESSION_FAILED: 'session:failed',
  SESSION_OUTPUT: 'session:output',

  // Progress Updates (Main -> Renderer events)
  PROGRESS_UPDATE: 'progress:update',

  // Session Control (Renderer -> Main commands)
  SESSION_START: 'session:start',
  SESSION_CANCEL: 'session:cancel',
  SESSION_RETRY: 'session:retry',

  // Planning (Renderer -> Main commands)
  PLAN_GENERATE: 'plan:generate',

  // Configuration (Renderer -> Main commands)
  CONFIG_GET: 'config:get',
  CONFIG_SET: 'config:set',

  // Bootstrap (Renderer -> Main commands)
  BOOTSTRAP_CHECK: 'bootstrap:check',
} as const;

/**
 * Default application configuration
 *
 * Provides sensible defaults for all configurable application settings.
 *
 * @example
 * ```typescript
 * const userConfig = loadUserConfig();
 * const config = { ...DEFAULT_CONFIG, ...userConfig };
 * ```
 */
export const DEFAULT_CONFIG = {
  claudePath: '', // Will be detected during bootstrap
  projectRoot: '', // Will be set to current working directory
  maxParallelSessions: 10,
  locale: 'en' as SupportedLocale,
  autoCleanup: true,
} as const;

/**
 * Maximum number of parallel sessions allowed
 *
 * Hard upper limit to prevent system overload regardless of user configuration.
 *
 * @example
 * ```typescript
 * const effectiveMax = Math.min(userMax, MAX_PARALLEL_SESSIONS);
 * ```
 */
export const MAX_PARALLEL_SESSIONS = 10;

/**
 * Supported application locales
 *
 * Ordered list of available languages for the user interface.
 *
 * @example
 * ```typescript
 * if (!SUPPORTED_LOCALES.includes(userLocale)) {
 *   console.error('Unsupported locale');
 * }
 * ```
 */
export const SUPPORTED_LOCALES: SupportedLocale[] = ['ko', 'en', 'ja', 'zh'];

/**
 * Application color scheme
 *
 * Centralized color definitions for consistent UI across the application.
 *
 * @example
 * ```typescript
 * const style = { color: COLORS.ANTHROPIC };
 * ```
 */
export const COLORS = {
  /** Anthropic brand color (#D97757) */
  ANTHROPIC: '#D97757',

  /** Slate color palette for neutrals */
  SLATE: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },

  /** Blue color palette for primary actions */
  BLUE: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },

  /** Emerald color palette for success states */
  EMERALD: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },

  /** Amber color palette for warnings */
  AMBER: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },

  /** Red color palette for errors */
  RED: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },
} as const;

/**
 * Error code constants
 *
 * Canonical error codes used throughout the application for consistent error handling.
 *
 * @example
 * ```typescript
 * throw new BootstrapError(ERROR_CODES.BOOTSTRAP_CLAUDE_NOT_FOUND, 'Claude CLI not found');
 * ```
 */
export const ERROR_CODES = {
  // Bootstrap errors (E0001-E0010)
  BOOTSTRAP_CLAUDE_NOT_FOUND: 'E0001',
  BOOTSTRAP_MOAI_ADK_NOT_FOUND: 'E0002',
  BOOTSTRAP_WORKTREE_NOT_SUPPORTED: 'E0003',
  BOOTSTRAP_GIT_NOT_FOUND: 'E0004',

  // Session errors (E0011-E0020)
  SESSION_CREATE_FAILED: 'E0011',
  SESSION_START_FAILED: 'E0012',
  SESSION_CANCEL_FAILED: 'E0013',
 _SESSION_TIMEOUT: 'E0014',
  SESSION_WORKTREE_CLEANUP_FAILED: 'E0015',

  // Worktree errors (E0021-E0030)
  WORKTREE_CREATE_FAILED: 'E0021',
  WORKTREE_REMOVE_FAILED: 'E0022',
  WORKTREE_ALREADY_EXISTS: 'E0023',
  WORKTREE_NOT_FOUND: 'E0024',

  // Config errors (E0031-E0040)
  CONFIG_INVALID_PATH: 'E0031',
  CONFIG_INVALID_VALUE: 'E0032',
  CONFIG_LOAD_FAILED: 'E0033',
  CONFIG_SAVE_FAILED: 'E0034',

  // Analysis errors (E0041-E0050)
  ANALYSIS_PARSE_FAILED: 'E0041',
  ANALYSIS_DEPENDENCY_CYCLE: 'E0042',
  ANALYSIS_INVALID_SPEC: 'E0043',
  ANALYSIS_NO_SPECS_FOUND: 'E0044',
} as const;

/**
 * Error message templates
 *
 * Human-readable error messages for each error code with placeholders for dynamic values.
 *
 * @example
 * ```typescript
 * const message = ERROR_MESSAGES[ERROR_CODES.BOOTSTRAP_CLAUDE_NOT_FOUND];
 * const formatted = message.replace('{path}', '/usr/local/bin/claude');
 * ```
 */
export const ERROR_MESSAGES: Record<string, string> = {
  [ERROR_CODES.BOOTSTRAP_CLAUDE_NOT_FOUND]:
    'Claude Code CLI not found at {path}. Please install Claude Code CLI.',
  [ERROR_CODES.BOOTSTRAP_MOAI_ADK_NOT_FOUND]:
    'MoAI-ADK framework not found. Please initialize MoAI-ADK in the project.',
  [ERROR_CODES.BOOTSTRAP_WORKTREE_NOT_SUPPORTED]:
    'Git worktree support not available. Please upgrade Git to version 2.5 or later.',
  [ERROR_CODES.BOOTSTRAP_GIT_NOT_FOUND]:
    'Git not found at {path}. Please install Git to use worktree functionality.',

  [ERROR_CODES.SESSION_CREATE_FAILED]:
    'Failed to create session for SPEC {specId}: {reason}',
  [ERROR_CODES.SESSION_START_FAILED]:
    'Failed to start session {sessionId}: {reason}',
  [ERROR_CODES.SESSION_CANCEL_FAILED]:
    'Failed to cancel session {sessionId}: {reason}',
  [ERROR_CODES._SESSION_TIMEOUT]:
    'Session {sessionId} timed out after {duration}ms',
  [ERROR_CODES.SESSION_WORKTREE_CLEANUP_FAILED]:
    'Failed to clean up worktree for session {sessionId}: {reason}',

  [ERROR_CODES.WORKTREE_CREATE_FAILED]:
    'Failed to create worktree at {path}: {reason}',
  [ERROR_CODES.WORKTREE_REMOVE_FAILED]:
    'Failed to remove worktree at {path}: {reason}',
  [ERROR_CODES.WORKTREE_ALREADY_EXISTS]:
    'Worktree already exists at {path}',
  [ERROR_CODES.WORKTREE_NOT_FOUND]:
    'Worktree not found at {path}',

  [ERROR_CODES.CONFIG_INVALID_PATH]:
    'Invalid configuration path: {path}',
  [ERROR_CODES.CONFIG_INVALID_VALUE]:
    'Invalid configuration value for {key}: {value}',
  [ERROR_CODES.CONFIG_LOAD_FAILED]:
    'Failed to load configuration from {path}: {reason}',
  [ERROR_CODES.CONFIG_SAVE_FAILED]:
    'Failed to save configuration to {path}: {reason}',

  [ERROR_CODES.ANALYSIS_PARSE_FAILED]:
    'Failed to parse SPEC file {path}: {reason}',
  [ERROR_CODES.ANALYSIS_DEPENDENCY_CYCLE]:
    'Circular dependency detected: {cycle}',
  [ERROR_CODES.ANALYSIS_INVALID_SPEC]:
    'Invalid SPEC format in {path}: {reason}',
  [ERROR_CODES.ANALYSIS_NO_SPECS_FOUND]:
    'No SPEC files found in project root {path}',
};
