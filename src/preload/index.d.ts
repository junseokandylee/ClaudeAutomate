/**
 * Type Declarations for Preload Script - SPEC-PRELOAD-001
 *
 * TAG-006: Type Declarations (REQ-006)
 *
 * Extends Window interface with electronAPI for type-safe Renderer access
 */

import type {
  BootstrapResult,
  SpecInfo,
  ExecutionPlan,
  SessionInfo,
} from '../shared/types';

/**
 * ElectronAPI - Secure bridge interface for Main ↔ Renderer communication
 *
 * Provides complete TypeScript types for all exposed methods.
 * Renderer process can access via window.electronAPI with full IntelliSense.
 *
 * @example
 * ```typescript
 * // In Renderer process:
 * const api = window.electronAPI;
 * const result = await api.checkDependencies();
 * const cleanup = api.onSessionUpdate((event, sessions) => {
 *   console.log('Sessions:', sessions);
 * });
 * ```
 */
export interface ElectronAPI {
  // ========================================================================
  // TAG-002: Bootstrap API (REQ-002)
  // ========================================================================

  /**
   * Check if required dependencies are installed
   *
   * @returns Promise resolving to BootstrapResult with status of all dependencies
   *
   * @example
   * ```typescript
   * const result = await window.electronAPI.checkDependencies();
   * if (result.claude) {
   *   console.log('Claude CLI is available');
   * }
   * ```
   */
  checkDependencies(): Promise<BootstrapResult>;

  /**
   * Register callback for bootstrap progress updates
   *
   * @param callback - Function called with progress events
   * @returns Cleanup function to remove listener
   *
   * @example
   * ```typescript
   * const cleanup = window.electronAPI.onBootstrapProgress((event, data) => {
   *   console.log('Progress:', data);
   * });
   * // When done:
   * cleanup();
   * ```
   */
  onBootstrapProgress(
    callback: (event: any, data: any) => void
  ): () => void;

  // ========================================================================
  // TAG-003: SPEC API (REQ-003)
  // ========================================================================

  /**
   * Scan project directory for SPEC files
   *
   * @param projectPath - Root directory path to scan
   * @returns Promise resolving to array of SpecInfo objects
   *
   * @example
   * ```typescript
   * const specs = await window.electronAPI.scanSpecs('/project/root');
   * specs.forEach(spec => console.log(spec.id, spec.title));
   * ```
   */
  scanSpecs(projectPath: string): Promise<SpecInfo[]>;

  /**
   * Analyze SPECs to create dependency-resolved execution plan
   *
   * @param specs - Array of SPECs to analyze
   * @returns Promise resolving to ExecutionPlan with waves
   *
   * @example
   * ```typescript
   * const plan = await window.electronAPI.analyzeSpecs(specs);
   * console.log(`Total waves: ${plan.waves.length}`);
   * console.log(`Parallelism: ${plan.estimatedParallelism}`);
   * ```
   */
  analyzeSpecs(specs: SpecInfo[]): Promise<ExecutionPlan>;

  /**
   * Register callback for SPEC status updates
   *
   * @param callback - Function called when SPEC status changes
   * @returns Cleanup function to remove listener
   *
   * @example
   * ```typescript
   * const cleanup = window.electronAPI.onSpecStatus((event, data) => {
   *   console.log(`SPEC ${data.specId} is ${data.status}`);
   * });
   * ```
   */
  onSpecStatus(callback: (event: any, data: any) => void): () => void;

  // ========================================================================
  // TAG-004: Session API (REQ-004)
  // ========================================================================

  /**
   * Start parallel SPEC execution based on execution plan
   *
   * @param plan - Execution plan with waves and SPECs
   * @returns Promise resolving when execution starts
   *
   * @example
   * ```typescript
   * await window.electronAPI.startExecution(plan);
   * console.log('Execution started successfully');
   * ```
   */
  startExecution(plan: ExecutionPlan): Promise<void>;

  /**
   * Stop all running SPEC execution sessions
   *
   * @returns Promise resolving when execution stops
   *
   * @example
   * ```typescript
   * await window.electronAPI.stopExecution();
   * console.log('Execution stopped');
   * ```
   */
  stopExecution(): Promise<void>;

  /**
   * Register callback for session update events
   *
   * @param callback - Function called when session state changes
   * @returns Cleanup function to remove listener
   *
   * @example
   * ```typescript
   * const cleanup = window.electronAPI.onSessionUpdate((event, sessions) => {
   *   const running = sessions.filter(s => s.status === 'running');
   *   console.log(`Running sessions: ${running.length}`);
   * });
   * ```
   */
  onSessionUpdate(
    callback: (event: any, sessions: SessionInfo[]) => void
  ): () => void;

  /**
   * Register callback for session output events
   *
   * @param callback - Function called when session output is available
   * @returns Cleanup function to remove listener
   *
   * @example
   * ```typescript
   * const cleanup = window.electronAPI.onSessionOutput((event, output) => {
   *   console.log('Session output:', output);
   * });
   * ```
   */
  onSessionOutput(callback: (event: any, output: any) => void): () => void;

  // ========================================================================
  // TAG-005: Config API (REQ-005)
  // ========================================================================

  /**
   * Get configuration value by key
   *
   * @param key - Configuration key (e.g., 'claudePath', 'maxParallelSessions')
   * @returns Promise resolving to configuration value
   *
   * @example
   * ```typescript
   * const path = await window.electronAPI.getConfig('claudePath');
   * console.log('Claude CLI path:', path);
   * ```
   */
  getConfig(key: string): Promise<any>;

  /**
   * Set configuration value by key
   *
   * @param key - Configuration key
   * @param value - Configuration value to set
   * @returns Promise resolving when configuration is saved
   *
   * @example
   * ```typescript
   * await window.electronAPI.setConfig('maxParallelSessions', 5);
   * console.log('Configuration updated');
   * ```
   */
  setConfig(key: string, value: any): Promise<void>;

  /**
   * Register callback for configuration change events
   *
   * @param callback - Function called when configuration changes
   * @returns Cleanup function to remove listener
   *
   * @example
   * ```typescript
   * const cleanup = window.electronAPI.onConfigChange((event, data) => {
   *   console.log(`Config ${data.key} changed to ${data.value}`);
   * });
   * ```
   */
  onConfigChange(callback: (event: any, data: any) => void): () => void;
}

// ========================================================================
// TAG-006: Extend Window Interface (REQ-006)
// ========================================================================

/**
 * Extend global Window interface with electronAPI
 *
 * This declaration enables TypeScript to recognize window.electronAPI
 * in the Renderer process with full type safety and IntelliSense.
 */
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

// Export for external use
export {};
