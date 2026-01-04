/**
 * Shared type definitions for ClaudeParallelRunner
 *
 * This module contains all core type definitions used by both Main and Renderer processes.
 * All types are cross-platform compatible and avoid Node.js-specific APIs.
 */

// ============================================================================
// TASK-001: Core Status Types (REQ-001, TAG-001)
// ============================================================================

/**
 * Status of a SPEC in the execution pipeline
 *
 * Represents the lifecycle state of a single SPEC from planning through completion.
 *
 * @example
 * ```typescript
 * const status: SpecStatus = 'running';
 * if (status === 'completed') {
 *   console.log('SPEC finished successfully');
 * }
 * ```
 */
export type SpecStatus =
  | 'pending'   // SPEC is queued but not yet started
  | 'running'   // SPEC is currently executing
  | 'completed' // SPEC finished successfully
  | 'failed';   // SPEC encountered an error

/**
 * Status of a SPEC execution session
 *
 * Tracks the execution state of a single SPEC session within a wave.
 *
 * @example
 * ```typescript
 * const sessionStatus: SessionStatus = 'running';
 * if (sessionStatus === 'failed') {
 *   console.log('Session failed, retrying...');
 * }
 * ```
 */
export type SessionStatus =
  | 'idle'       // Session created but not started
  | 'running'    // Session is actively executing
  | 'completed'  // Session finished successfully
  | 'failed'     // Session encountered an error
  | 'cancelled'; // Session was cancelled by user

/**
 * Types of progress events during SPEC execution
 *
 * Defines all possible event types that can be emitted during SPEC execution
 * to communicate progress and status updates.
 *
 * @example
 * ```typescript
 * const event: ProgressEventType = 'spec:started';
 * console.log(`Event: ${event}`);
 * ```
 */
export type ProgressEventType =
  | 'session:created'      // New session created
  | 'session:started'      // Session execution started
  | 'session:completed'    // Session finished successfully
  | 'session:failed'       // Session encountered error
  | 'spec:started'         // SPEC execution started
  | 'spec:completed'       // SPEC finished successfully
  | 'spec:failed';         // SPEC encountered error

// ============================================================================
// TASK-002: Locale and I18n Types (REQ-001, TAG-001)
// ============================================================================

/**
 * Supported application locales
 *
 * Defines all languages supported by the application interface.
 *
 * @example
 * ```typescript
 * const locale: SupportedLocale = 'ko';
 * console.log(`Language: ${locale}`);
 * ```
 */
export type SupportedLocale =
  | 'ko'  // Korean
  | 'en'  // English
  | 'ja'  // Japanese
  | 'zh'; // Chinese

/**
 * Internationalization namespaces
 *
 * Defines logical groupings of translations for different parts of the application.
 *
 * @example
 * ```typescript
 * const namespace: I18nNamespace = 'common';
 * const translation = t(`${namespace}:key`);
 * ```
 */
export type I18nNamespace =
  | 'common'     // Shared translations across all contexts
  | 'main'       // Main process specific translations
  | 'renderer'   // Renderer process (UI) specific translations
  | 'errors'     // Error message translations
  | 'validation' // Form validation messages
  | 'status';    // Status and progress indicators

// ============================================================================
// TASK-003: Core Data Interfaces (REQ-002, TAG-002)
// ============================================================================

/**
 * Information about a SPEC in the execution plan
 *
 * Contains metadata and status for a single SPEC that will be executed.
 *
 * @property id - Unique identifier for the SPEC
 * @property title - Human-readable title of the SPEC
 * @property filePath - Absolute path to the SPEC file
 * @property status - Current execution status
 * @property dependencies - Array of SPEC IDs that must complete first
 *
 * @example
 * ```typescript
 * const spec: SpecInfo = {
 *   id: 'SPEC-001',
 *   title: 'User Authentication',
 *   filePath: '/specs/SPEC-001.md',
 *   status: 'pending',
 *   dependencies: []
 * };
 * ```
 */
export interface SpecInfo {
  id: string;
  title: string;
  filePath: string;
  status: SpecStatus;
  dependencies: string[];
}

/**
 * A wave of parallel SPEC executions
 *
 * Groups independent SPECs that can be executed simultaneously.
 *
 * @property waveNumber - Sequential wave index (1-based)
 * @property specs - Array of SPECs to execute in this wave
 *
 * @example
 * ```typescript
 * const wave: Wave = {
 *   waveNumber: 1,
 *   specs: [
 *     { id: 'SPEC-001', title: 'Auth', filePath: '/specs/001.md', status: 'pending', dependencies: [] },
 *     { id: 'SPEC-002', title: 'UI', filePath: '/specs/002.md', status: 'pending', dependencies: [] }
 *   ]
 * };
 * ```
 */
export interface Wave {
  waveNumber: number;
  specs: SpecInfo[];
}

/**
 * Complete execution plan for all SPECs
 *
 * Organizes all SPECs into dependency-resolved waves for parallel execution.
 *
 * @property waves - Array of waves to execute sequentially
 * @property totalSpecs - Total number of SPECs in the plan
 * @property estimatedParallelism - Estimated max parallel sessions (for resource planning)
 *
 * @example
 * const plan: ExecutionPlan = {
 *   waves: [
 *     { waveNumber: 1, specs: [] },
 *     { waveNumber: 2, specs: [] }
 *   ],
 *   totalSpecs: 10,
 *   estimatedParallelism: 4
 * };
 */
export interface ExecutionPlan {
  waves: Wave[];
  totalSpecs: number;
  estimatedParallelism: number;
}

// ============================================================================
// TASK-004: Session and Bootstrap Interfaces (REQ-002, TAG-002)
// ============================================================================

/**
 * Information about a SPEC execution session
 *
 * Tracks the complete lifecycle of a single SPEC execution attempt.
 *
 * @property id - Unique session identifier (UUID)
 * @property specId - ID of the SPEC being executed
 * @property status - Current session status
 * @property worktreePath - Path to the git worktree for this session
 * @property startedAt - Timestamp when session started (ISO string)
 * @property completedAt - Timestamp when session completed (ISO string, optional)
 * @property output - Accumulated output from Claude Code CLI
 * @property error - Error message if session failed
 *
 * @example
 * ```typescript
 * const session: SessionInfo = {
 *   id: '550e8400-e29b-41d4-a716-446655440000',
 *   specId: 'SPEC-001',
 *   status: 'running',
 *   worktreePath: '/worktrees/SPEC-001',
 *   startedAt: '2025-01-04T10:00:00Z',
 *   output: '',
 *   error: null
 * };
 * ```
 */
export interface SessionInfo {
  id: string;
  specId: string;
  status: SessionStatus;
  worktreePath: string;
  startedAt: string;
  completedAt?: string;
  output: string;
  error: string | null;
}

/**
 * Bootstrap validation result
 *
 * Reports the status of required external dependencies and tools.
 *
 * @property claude - Whether Claude Code CLI is available and configured
 * @property moaiAdk - Whether MoAI-ADK framework is installed
 * @property moaiWorktree - Whether git worktree support is available
 *
 * @example
 * ```typescript
 * const bootstrap: BootstrapResult = {
 *   claude: true,
 *   moaiAdk: true,
 *   moaiWorktree: false
 * };
 * if (!bootstrap.moaiWorktree) {
 *   console.error('Git worktree not supported');
 * }
 * ```
 */
export interface BootstrapResult {
  claude: boolean;
  moaiAdk: boolean;
  moaiWorktree: boolean;
}

/**
 * Dependency check result
 *
 * Reports the availability status of a single external dependency.
 *
 * @property name - Human-readable name of the dependency
 * @property installed - Whether the dependency is installed
 * @property version - Version string if available
 * @property path - Absolute path to the executable
 *
 * @example
 * ```typescript
 * const dep: DependencyStatus = {
 *   name: 'Claude Code CLI',
 *   installed: true,
 *   version: '1.0.0',
 *   path: '/usr/local/bin/claude'
 * };
 * ```
 */
export interface DependencyStatus {
  name: string;
  installed: boolean;
  version: string | null;
  path: string | null;
}

/**
 * Application configuration
 *
 * Contains all user-configurable application settings.
 *
 * @property claudePath - Path to Claude Code CLI executable
 * @property projectRoot - Root directory of the project
 * @property maxParallelSessions - Maximum concurrent sessions (default: 10)
 * @property locale - User interface language
 * @property autoCleanup - Whether to clean up worktrees after completion
 *
 * @example
 * ```typescript
 * const config: AppConfig = {
 *   claudePath: '/usr/local/bin/claude',
 *   projectRoot: '/home/user/myproject',
 *   maxParallelSessions: 5,
 *   locale: 'en',
 *   autoCleanup: true
 * };
 * ```
 */
export interface AppConfig {
  claudePath: string;
  projectRoot: string;
  maxParallelSessions: number;
  locale: SupportedLocale;
  autoCleanup: boolean;
}

// ============================================================================
// TASK-005: IPC Type Definitions (REQ-002, TAG-003)
// ============================================================================

/**
 * IPC channel names used for Main <-> Renderer communication
 *
 * Defines all bidirectional communication channels between Electron processes.
 *
 * @example
 * ```typescript
 * const channel: IpcChannels = 'session:start';
 * ipcRenderer.send(channel, { specId: 'SPEC-001' });
 * ```
 */
export type IpcChannels =
  // Main -> Renderer (events)
  | 'session:created'
  | 'session:started'
  | 'session:completed'
  | 'session:failed'
  | 'session:output'
  | 'progress:update'
  // Renderer -> Main (commands)
  | 'session:start'
  | 'session:cancel'
  | 'session:retry'
  | 'plan:generate'
  | 'config:get'
  | 'config:set'
  | 'bootstrap:check';

// IPC Payload Interfaces

/** Payload for session:start command */
export interface SessionStartPayload {
  specId: string;
}

/** Payload for session:cancel command */
export interface SessionCancelPayload {
  sessionId: string;
}

/** Payload for session:retry command */
export interface SessionRetryPayload {
  sessionId: string;
}

/** Payload for plan:generate command */
export interface PlanGeneratePayload {
  specIds?: string[];
}

/** Payload for config:set command */
export interface ConfigSetPayload {
  key: keyof AppConfig;
  value: unknown;
}

/** Payload for session events */
export interface SessionEventPayload {
  sessionId: string;
  specId: string;
  status: SessionStatus;
  output?: string;
  error?: string;
}

/** Payload for progress events */
export interface ProgressUpdatePayload {
  eventType: ProgressEventType;
  sessionId: string;
  specId: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

/** Response from bootstrap:check */
export interface BootstrapCheckResponse {
  success: boolean;
  dependencies: Record<string, DependencyStatus>;
  errors: string[];
}
