/**
 * Shared error classes for ClaudeParallelRunner
 *
 * This module contains all custom error classes used by both Main and Renderer processes.
 * All errors are cross-platform compatible and provide structured error information.
 */

import { ERROR_CODES, ERROR_MESSAGES } from './constants';

// ============================================================================
// TASK-007: Error Class Hierarchy (REQ-004, TAG-005)
// ============================================================================

/**
 * Base application error class
 *
 * Provides structured error handling with error codes and contextual information.
 * All custom errors should extend this class.
 *
 * @property code - Unique error code identifier
 * @property message - Human-readable error message
 * @property details - Additional error context (optional)
 *
 * @example
 * ```typescript
 * throw new AppError('E0011', 'Session creation failed', { specId: 'SPEC-001' });
 * ```
 */
export class AppError extends Error {
  readonly code: string;
  readonly details?: Record<string, unknown>;

  constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Format error details for logging or display
   *
   * @returns String representation of the error with all details
   *
   * @example
   * ```typescript
   * const error = new AppError('E0011', 'Failed', { specId: 'SPEC-001' });
   * console.log(error.format()); // "[E0011] Failed - { specId: 'SPEC-001' }"
   * ```
   */
  format(): string {
    const detailsStr = this.details ? ` - ${JSON.stringify(this.details)}` : '';
    return `[${this.code}] ${this.message}${detailsStr}`;
  }

  /**
   * Convert error to plain object for IPC transport
   *
   * @returns Plain object representation of the error
   *
   * @example
   * ```typescript
   * const error = new AppError('E0011', 'Failed');
   * ipcRenderer.send('error', error.toJSON());
   * ```
   */
  toJSON(): { code: string; message: string; details?: Record<string, unknown> } {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }

  /**
   * Reconstruct error from plain object (IPC transport)
   *
   * @param obj - Plain object with error properties
   * @returns Reconstructed AppError instance
   *
   * @example
   * ```typescript
   * ipcMain.on('error', (event, errorObj) => {
   *   const error = AppError.fromJSON(errorObj);
   *   console.error(error.format());
   * });
   * ```
   */
  static fromJSON(
    obj: { code: string; message: string; details?: Record<string, unknown> }
  ): AppError {
    const error = new AppError(obj.code, obj.message, obj.details);
    return error;
  }
}

/**
 * Bootstrap-related errors
 *
 * Thrown when application bootstrap or dependency validation fails.
 *
 * @example
 * ```typescript
 * if (!claudeInstalled) {
 *   throw new BootstrapError(
 *     ERROR_CODES.BOOTSTRAP_CLAUDE_NOT_FOUND,
 *     'Claude Code CLI not found',
 *     { path: '/usr/local/bin/claude' }
 *   );
 * }
 * ```
 */
export class BootstrapError extends AppError {
  constructor(
    codeKey: keyof typeof ERROR_CODES,
    message?: string,
    details?: Record<string, unknown>
  ) {
    const errorCode = ERROR_CODES[codeKey];
    const errorMessage =
      message ||
      ERROR_MESSAGES[errorCode] ||
      'Bootstrap failed';

    super(errorCode, errorMessage, details);
  }
}

/**
 * Session-related errors
 *
 * Thrown when session creation, execution, or management fails.
 *
 * @example
 * ```typescript
 * throw new SessionError(
 *   ERROR_CODES.SESSION_CREATE_FAILED,
 *   'Failed to create session',
 *   { specId: 'SPEC-001', reason: 'Worktree creation failed' }
 * );
 * ```
 */
export class SessionError extends AppError {
  constructor(
    codeKey: keyof typeof ERROR_CODES,
    message?: string,
    details?: Record<string, unknown>
  ) {
    const errorCode = ERROR_CODES[codeKey];
    const errorMessage =
      message ||
      ERROR_MESSAGES[errorCode] ||
      'Session operation failed';

    super(errorCode, errorMessage, details);
  }
}

/**
 * Git worktree-related errors
 *
 * Thrown when worktree creation, removal, or validation fails.
 *
 * @example
 * ```typescript
 * throw new WorktreeError(
 *   ERROR_CODES.WORKTREE_CREATE_FAILED,
 *   'Failed to create worktree',
 *   { path: '/worktrees/SPEC-001', reason: 'Permission denied' }
 * );
 * ```
 */
export class WorktreeError extends AppError {
  constructor(
    codeKey: keyof typeof ERROR_CODES,
    message?: string,
    details?: Record<string, unknown>
  ) {
    const errorCode = ERROR_CODES[codeKey];
    const errorMessage =
      message ||
      ERROR_MESSAGES[errorCode] ||
      'Worktree operation failed';

    super(errorCode, errorMessage, details);
  }
}

/**
 * Configuration-related errors
 *
 * Thrown when configuration loading, saving, or validation fails.
 *
 * @example
 * ```typescript
 * throw new ConfigError(
 *   ERROR_CODES.CONFIG_INVALID_VALUE,
 *   'Invalid maxParallelSessions value',
 *   { key: 'maxParallelSessions', value: -1 }
 * );
 * ```
 */
export class ConfigError extends AppError {
  constructor(
    codeKey: keyof typeof ERROR_CODES,
    message?: string,
    details?: Record<string, unknown>
  ) {
    const errorCode = ERROR_CODES[codeKey];
    const errorMessage =
      message ||
      ERROR_MESSAGES[errorCode] ||
      'Configuration error';

    super(errorCode, errorMessage, details);
  }
}

/**
 * SPEC analysis-related errors
 *
 * Thrown when SPEC parsing, dependency analysis, or validation fails.
 *
 * @example
 * ```typescript
 * throw new AnalysisError(
 *   ERROR_CODES.ANALYSIS_DEPENDENCY_CYCLE,
 *   'Circular dependency detected',
 *   { cycle: 'SPEC-001 -> SPEC-002 -> SPEC-001' }
 * );
 * ```
 */
export class AnalysisError extends AppError {
  constructor(
    codeKey: keyof typeof ERROR_CODES,
    message?: string,
    details?: Record<string, unknown>
  ) {
    const errorCode = ERROR_CODES[codeKey];
    const errorMessage =
      message ||
      ERROR_MESSAGES[errorCode] ||
      'Analysis failed';

    super(errorCode, errorMessage, details);
  }
}

// ============================================================================
// Error Type Guards
// ============================================================================

/**
 * Type guard for AppError and its subclasses
 *
 * @param error - Unknown error value
 * @returns True if error is an instance of AppError
 *
 * @example
 * ```typescript
 * try {
 *   await operation();
 * } catch (error) {
 *   if (isAppError(error)) {
 *     console.log(error.code); // TypeScript knows error is AppError
 *   } else {
 *     console.log('Unknown error:', error);
 *   }
 * }
 * ```
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Type guard for BootstrapError
 *
 * @param error - Unknown error value
 * @returns True if error is an instance of BootstrapError
 *
 * @example
 * ```typescript
 * if (isBootstrapError(error)) {
 *   console.log('Bootstrap failed:', error.details);
 * }
 * ```
 */
export function isBootstrapError(error: unknown): error is BootstrapError {
  return error instanceof BootstrapError;
}

/**
 * Type guard for SessionError
 *
 * @param error - Unknown error value
 * @returns True if error is an instance of SessionError
 *
 * @example
 * ```typescript
 * if (isSessionError(error)) {
 *   console.log('Session failed:', error.sessionId);
 * }
 * ```
 */
export function isSessionError(error: unknown): error is SessionError {
  return error instanceof SessionError;
}

/**
 * Type guard for WorktreeError
 *
 * @param error - Unknown error value
 * @returns True if error is an instance of WorktreeError
 *
 * @example
 * ```typescript
 * if (isWorktreeError(error)) {
 *   console.log('Worktree operation failed:', error.path);
 * }
 * ```
 */
export function isWorktreeError(error: unknown): error is WorktreeError {
  return error instanceof WorktreeError;
}

/**
 * Type guard for ConfigError
 *
 * @param error - Unknown error value
 * @returns True if error is an instance of ConfigError
 *
 * @example
 * ```typescript
 * if (isConfigError(error)) {
 *   console.log('Configuration error:', error.key);
 * }
 * ```
 */
export function isConfigError(error: unknown): error is ConfigError {
  return error instanceof ConfigError;
}

/**
 * Type guard for AnalysisError
 *
 * @param error - Unknown error value
 * @returns True if error is an instance of AnalysisError
 *
 * @example
 * ```typescript
 * if (isAnalysisError(error)) {
 *   console.log('Analysis failed:', error.cycle);
 * }
 * ```
 */
export function isAnalysisError(error: unknown): error is AnalysisError {
  return error instanceof AnalysisError;
}
