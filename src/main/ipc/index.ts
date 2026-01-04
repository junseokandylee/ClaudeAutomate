/**
 * IPC handler registration
 *
 * This module registers all IPC handlers for communication between
 * Main and Renderer processes. Handlers are organized by category:
 * - Bootstrap: Dependency validation and environment checks
 * - Config: Configuration management
 * - Session: Session lifecycle management
 * - Spec: SPEC analysis and planning
 */

import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/constants';
import type {
  SessionStartPayload,
  SessionCancelPayload,
  SessionRetryPayload,
  PlanGeneratePayload,
  ConfigSetPayload,
} from '../../shared/types';
import {
  handleBootstrapCheck,
  handleConfigGet,
  handleConfigSet,
  handleSessionStart,
  handleSessionStop,
  handleSessionStatus,
  handleSpecScan,
  handleSpecAnalyze,
  handleSpecList,
} from './handlers';

// ============================================================================
// Handler Registration (REQ-003)
// ============================================================================

/**
 * Register all IPC handlers
 *
 * This function is called during app initialization to register all
 * IPC handlers for Main <-> Renderer communication.
 *
 * @example
 * ```typescript
 * import { registerIpcHandlers } from './ipc';
 * app.whenReady().then(() => {
 *   registerIpcHandlers();
 *   createWindow();
 * });
 * ```
 */
export function registerIpcHandlers(): void {
  // ========================================================================
  // Bootstrap Handlers (REQ-003)
  // ========================================================================

  /**
   * Check bootstrap dependencies
   * Channel: bootstrap:check
   */
  ipcMain.handle(
    IPC_CHANNELS.BOOTSTRAP_CHECK,
    async (): Promise<{ success: boolean; dependencies: Record<string, boolean>; errors: string[] }> => {
      try {
        const result = await handleBootstrapCheck();
        return {
          success: result.claude && result.moaiAdk && result.moaiWorktree,
          dependencies: {
            claude: result.claude,
            moaiAdk: result.moaiAdk,
            moaiWorktree: result.moaiWorktree,
          },
          errors: [],
        };
      } catch (error) {
        return {
          success: false,
          dependencies: {
            claude: false,
            moaiAdk: false,
            moaiWorktree: false,
          },
          errors: [error instanceof Error ? error.message : String(error)],
        };
      }
    }
  );

  // ========================================================================
  // Configuration Handlers (REQ-003)
  // ========================================================================

  /**
   * Get configuration value
   * Channel: config:get
   */
  ipcMain.handle(
    IPC_CHANNELS.CONFIG_GET,
    async (_event, key: string): Promise<unknown> => {
      try {
        return await handleConfigGet(key);
      } catch (error) {
        console.error(`[IPC] config:get failed for key "${key}":`, error);
        throw error;
      }
    }
  );

  /**
   * Set configuration value
   * Channel: config:set
   */
  ipcMain.handle(
    IPC_CHANNELS.CONFIG_SET,
    async (_event, payload: ConfigSetPayload): Promise<void> => {
      try {
        await handleConfigSet(payload.key, payload.value as never);
      } catch (error) {
        console.error(`[IPC] config:set failed for key "${String(payload.key)}":`, error);
        throw error;
      }
    }
  );

  // ========================================================================
  // Session Handlers (REQ-003)
  // ========================================================================

  /**
   * Start a SPEC execution session
   * Channel: session:start
   */
  ipcMain.handle(
    IPC_CHANNELS.SESSION_START,
    async (_event, payload: SessionStartPayload): Promise<void> => {
      try {
        await handleSessionStart(payload.specId);
      } catch (error) {
        console.error(`[IPC] session:start failed for SPEC "${payload.specId}":`, error);
        throw error;
      }
    }
  );

  /**
   * Cancel a running session
   * Channel: session:cancel
   */
  ipcMain.handle(
    IPC_CHANNELS.SESSION_CANCEL,
    async (_event, payload: SessionCancelPayload): Promise<void> => {
      try {
        await handleSessionStop(payload.sessionId);
      } catch (error) {
        console.error(`[IPC] session:cancel failed for session "${payload.sessionId}":`, error);
        throw error;
      }
    }
  );

  /**
   * Retry a failed session
   * Channel: session:retry
   */
  ipcMain.handle(
    IPC_CHANNELS.SESSION_RETRY,
    async (_event, payload: SessionRetryPayload): Promise<void> => {
      try {
        // For now, retry is same as start
        // TODO: Implement proper retry logic in SPEC-SESSION-001
        await handleSessionStop(payload.sessionId);
      } catch (error) {
        console.error(`[IPC] session:retry failed for session "${payload.sessionId}":`, error);
        throw error;
      }
    }
  );

  // ========================================================================
  // Spec Handlers (REQ-003)
  // ========================================================================

  /**
   * Generate execution plan from SPECs
   * Channel: plan:generate
   */
  ipcMain.handle(
    IPC_CHANNELS.PLAN_GENERATE,
    async (_event, payload: PlanGeneratePayload): Promise<unknown> => {
      try {
        // TODO: Implement in SPEC-ANALYZER-001
        const projectRoot = process.cwd();
        return await handleSpecScan(projectRoot);
      } catch (error) {
        console.error('[IPC] plan:generate failed:', error);
        throw error;
      }
    }
  );

  // ========================================================================
  // Error Handling (REQ-005)
  // ========================================================================

  /**
   * Global IPC error handler
   *
   * Catches unhandled errors in IPC handlers and formats them
   * for proper transmission to Renderer process.
   */
  ipcMain.on('error', (error) => {
    console.error('[IPC] Unhandled error:', error);
  });

  // Log successful registration
  console.log('[IPC] All handlers registered successfully');
}

/**
 * Unregister all IPC handlers (for testing/cleanup)
 *
 * @example
 * ```typescript
 * import { unregisterIpcHandlers } from './ipc';
 * afterEach(() => {
 *   unregisterIpcHandlers();
 * });
 * ```
 */
export function unregisterIpcHandlers(): void {
  // Remove all handlers for registered channels
  Object.values(IPC_CHANNELS).forEach((channel) => {
    ipcMain.removeAllListeners(channel);
  });

  console.log('[IPC] All handlers unregistered');
}
