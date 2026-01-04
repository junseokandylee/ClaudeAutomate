/**
 * Preload Script - SPEC-PRELOAD-001
 *
 * Creates secure context bridge between Main and Renderer processes.
 * Exposes typed API for Bootstrap, SPEC, Session, and Config operations.
 *
 * TAG-001: Context Bridge Setup
 * TAG-002: Bootstrap API (Enhanced with detailed status)
 * TAG-003: SPEC API
 * TAG-004: Session API
 * TAG-005: Config API
 * TAG-006: Type Declarations (see index.d.ts)
 */

import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/constants';
import type { BootstrapCheckResult } from '../shared/types';

/**
 * ElectronAPI - Secure bridge for Main ↔ Renderer communication
 *
 * Provides typed methods for:
 * - Bootstrap: Dependency checking with detailed status (version, path)
 * - SPEC: Scanning and analyzing SPEC files
 * - Session: Managing parallel SPEC execution sessions
 * - Config: Application configuration management
 *
 * Security: No direct ipcRenderer exposure
 */
const electronAPI = {
  // ========================================================================
  // TAG-002: Bootstrap API (REQ-002, REQ-003)
  // ========================================================================

  /**
   * Check if required dependencies are installed
   *
   * Enhanced version that returns detailed status including version and path:
   * - Claude CLI availability, version, and executable path
   * - MoAI-ADK installation status and path
   * - Git worktree support status and version
   *
   * @returns Promise<BootstrapCheckResult> - Detailed status of all dependencies
   *
   * @example
   * ```typescript
   * const result = await window.electronAPI.checkDependencies();
   * if (!result.claude.installed) {
   *   console.error('Claude CLI not found');
   * } else {
   *   console.log(`Claude ${result.claude.version} at ${result.claude.path}`);
   * }
   * ```
   */
  checkDependencies: (): Promise<BootstrapCheckResult> => {
    return ipcRenderer.invoke(IPC_CHANNELS.BOOTSTRAP_CHECK);
  },

  /**
   * Register callback for bootstrap progress updates
   *
   * @param callback - Function to call when progress updates occur
   * @returns Cleanup function to remove listener
   *
   * @example
   * ```typescript
   * const cleanup = window.electronAPI.onBootstrapProgress((event, data) => {
   *   console.log('Progress:', data);
   * });
   * // Later: cleanup();
   * ```
   */
  onBootstrapProgress: (callback: (event: any, data: any) => void) => {
    ipcRenderer.on('bootstrap:progress', callback);
    return () => ipcRenderer.removeListener('bootstrap:progress', callback);
  },

  // ========================================================================
  // TAG-003: SPEC API (REQ-003)
  // ========================================================================

  /**
   * Scan project directory for SPEC files
   *
   * @param projectPath - Root directory to scan for SPECs
   * @returns Promise<SpecInfo[]> - Array of found SPECs with metadata
   *
   * @example
   * ```typescript
   * const specs = await window.electronAPI.scanSpecs('/project/root');
   * specs.forEach(spec => console.log(spec.id, spec.title));
   * ```
   */
  scanSpecs: (projectPath: string): Promise<any[]> => {
    return ipcRenderer.invoke('spec:scan', projectPath);
  },

  /**
   * Analyze SPECs to create execution plan
   *
   * @param specs - Array of SPECs to analyze
   * @returns Promise<ExecutionPlan> - Waves with dependency-resolved parallel execution
   *
   * @example
   * ```typescript
   * const plan = await window.electronAPI.analyzeSpecs(specs);
   * console.log(`Total waves: ${plan.waves.length}`);
   * ```
   */
  analyzeSpecs: (specs: any[]): Promise<any> => {
    return ipcRenderer.invoke('spec:analyze', specs);
  },

  /**
   * Register callback for SPEC status updates
   *
   * @param callback - Function to call when SPEC status changes
   * @returns Cleanup function to remove listener
   *
   * @example
   * ```typescript
   * const cleanup = window.electronAPI.onSpecStatus((event, data) => {
   *   console.log('SPEC status:', data.specId, data.status);
   * });
   * ```
   */
  onSpecStatus: (callback: (event: any, data: any) => void) => {
    ipcRenderer.on('spec:status', callback);
    return () => ipcRenderer.removeListener('spec:status', callback);
  },

  // ========================================================================
  // TAG-004: Session API (REQ-004)
  // ========================================================================

  /**
   * Start parallel SPEC execution
   *
   * @param plan - Execution plan with waves and SPECs
   * @returns Promise<void> - Resolves when execution starts
   *
   * @example
   * ```typescript
   * await window.electronAPI.startExecution(plan);
   * console.log('Execution started');
   * ```
   */
  startExecution: (plan: any): Promise<void> => {
    return ipcRenderer.invoke('session:start', plan);
  },

  /**
   * Stop all running SPEC execution sessions
   *
   * @returns Promise<void> - Resolves when execution stops
   *
   * @example
   * ```typescript
   * await window.electronAPI.stopExecution();
   * console.log('Execution stopped');
   * ```
   */
  stopExecution: (): Promise<void> => {
    return ipcRenderer.invoke('session:stop');
  },

  /**
   * Register callback for session update events
   *
   * @param callback - Function to call when session state changes
   * @returns Cleanup function to remove listener
   *
   * @example
   * ```typescript
   * const cleanup = window.electronAPI.onSessionUpdate((event, sessions) => {
   *   console.log('Active sessions:', sessions.length);
   * });
   * ```
   */
  onSessionUpdate: (callback: (event: any, sessions: any[]) => void) => {
    ipcRenderer.on('session:update', callback);
    return () => ipcRenderer.removeListener('session:update', callback);
  },

  /**
   * Register callback for session output events
   *
   * @param callback - Function to call when session output is available
   * @returns Cleanup function to remove listener
   *
   * @example
   * ```typescript
   * const cleanup = window.electronAPI.onSessionOutput((event, output) => {
   *   console.log('Output:', output);
   * });
   * ```
   */
  onSessionOutput: (callback: (event: any, output: any) => void) => {
    ipcRenderer.on('session:output', callback);
    return () => ipcRenderer.removeListener('session:output', callback);
  },

  // ========================================================================
  // TAG-005: Config API (REQ-005)
  // ========================================================================

  /**
   * Get configuration value by key
   *
   * @param key - Configuration key
   * @returns Promise<any> - Configuration value
   *
   * @example
   * ```typescript
   * const claudePath = await window.electronAPI.getConfig('claudePath');
   * console.log('Claude CLI path:', claudePath);
   * ```
   */
  getConfig: (key: string): Promise<any> => {
    return ipcRenderer.invoke('config:get', key);
  },

  /**
   * Set configuration value by key
   *
   * @param key - Configuration key
   * @param value - Configuration value
   * @returns Promise<void> - Resolves when config is saved
   *
   * @example
   * ```typescript
   * await window.electronAPI.setConfig('maxParallelSessions', 5);
   * console.log('Config updated');
   * ```
   */
  setConfig: (key: string, value: any): Promise<void> => {
    return ipcRenderer.invoke('config:set', key, value);
  },

  /**
   * Register callback for configuration change events
   *
   * @param callback - Function to call when configuration changes
   * @returns Cleanup function to remove listener
   *
   * @example
   * ```typescript
   * const cleanup = window.electronAPI.onConfigChange((event, data) => {
   *   console.log('Config changed:', data.key, data.value);
   * });
   * ```
   */
  onConfigChange: (callback: (event: any, data: any) => void) => {
    ipcRenderer.on('config:change', callback);
    return () => ipcRenderer.removeListener('config:change', callback);
  },
};

// ========================================================================
// TAG-001: Context Bridge Setup (REQ-001)
// ========================================================================

/**
 * Expose electronAPI to Renderer process via contextBridge
 *
 * Security: Only electronAPI methods are exposed, not ipcRenderer directly
 */
try {
  contextBridge.exposeInMainWorld('electronAPI', electronAPI);
} catch (error) {
  console.error('Failed to expose electronAPI:', error);
  throw error;
}
