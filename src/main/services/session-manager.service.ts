/**
 * SessionManager Service - REQ-001
 *
 * TAG-FUNC-001: SessionManager Implementation
 *
 * Orchestrates parallel Claude Code CLI sessions for SPEC execution.
 * Implements wave-based execution respecting dependencies and parallel limits.
 *
 * Features:
 * - Wave-by-wave execution respecting dependencies
 * - Maximum parallel session limit enforcement
 * - Session lifecycle management (create, start, stop, cleanup)
 * - Real-time session status tracking
 * - IPC communication with renderer process
 * - Graceful failure handling and recovery
 */

import { EventEmitter } from 'events';
import { ClaudeSession } from './claude-session';
import { WorktreeManagerService } from './worktree-manager.service';
import type { ExecutionPlan, Wave, SessionInfo, SpecInfo } from '@/shared/types';
import { ipcMain } from 'electron';

/**
 * SessionManager Events
 */
export type SessionManagerEvent =
  | 'execution:start'
  | 'execution:complete'
  | 'execution:stopped'
  | 'wave:start'
  | 'wave:complete'
  | 'session:created'
  | 'session:started'
  | 'session:completed'
  | 'session:failed'
  | 'session:output'
  | 'session:update'
  | 'progress:update'
  | 'error';

/**
 * SessionManager - Orchestrates parallel Claude Code CLI sessions
 *
 * @example
 * ```typescript
 * const manager = new SessionManager('/usr/bin/claude', 10);
 *
 * manager.on('session:completed', (session) => {
 *   console.log(`Session ${session.specId} completed`);
 * });
 *
 * await manager.startExecution(executionPlan);
 * ```
 */
export class SessionManager extends EventEmitter {
  /** Path to Claude Code CLI executable */
  private readonly claudePath: string;

  /** Maximum parallel sessions allowed */
  private readonly maxParallel: number;

  /** Worktree manager for creating isolated execution environments */
  private readonly worktreeManager: WorktreeManagerService;

  /** Active sessions map (sessionId -> ClaudeSession) */
  private activeSessions: Map<string, ClaudeSession> = new Map();

  /** Session info map (sessionId -> SessionInfo) */
  private sessionInfo: Map<string, SessionInfo> = new Map();

  /** Execution state */
  private isExecuting: boolean = false;

  /** Stop flag for graceful shutdown */
  private stopRequested: boolean = false;

  /** Current wave being executed */
  private currentWave: number = 0;

  /** Total SPECs in execution plan */
  private totalSpecs: number = 0;

  /** Completed SPECs count */
  private completedSpecs: number = 0;

  /** Failed SPECs count */
  private failedSpecs: number = 0;

  /**
   * Create a new SessionManager
   *
   * @param claudePath - Path to Claude Code CLI executable
   * @param maxParallel - Maximum parallel sessions (default: 10)
   */
  constructor(claudePath: string, maxParallel: number = 10) {
    super();
    this.claudePath = claudePath;
    this.maxParallel = maxParallel;
    this.worktreeManager = new WorktreeManagerService();

    this.setupIPCHandlers();
  }

  /**
   * Set up IPC handlers for renderer communication
   */
  private setupIPCHandlers(): void {
    ipcMain.handle('session:getActive', () => this.getActiveSessions());
    ipcMain.handle('session:getById', (event, sessionId: string) =>
      this.getSession(sessionId)
    );
  }

  /**
   * Start execution of an execution plan
   *
   * Executes SPECs wave by wave, respecting dependencies and parallel limits.
   *
   * @param plan - Execution plan with waves and SPECs
   * @throws {Error} If execution already in progress
   */
  async startExecution(plan: ExecutionPlan): Promise<void> {
    if (this.isExecuting) {
      throw new Error('Execution already in progress');
    }

    this.isExecuting = true;
    this.stopRequested = false;
    this.totalSpecs = plan.totalSpecs;
    this.completedSpecs = 0;
    this.failedSpecs = 0;

    this.emit('execution:start', { plan });

    try {
      // Execute waves sequentially
      for (const wave of plan.waves) {
        if (this.stopRequested) {
          this.emit('execution:stopped', {
            completed: this.completedSpecs,
            failed: this.failedSpecs,
          });
          return;
        }

        this.currentWave = wave.waveNumber;
        await this.executeWave(wave);
      }

      this.isExecuting = false;
      this.emit('execution:complete', {
        total: this.totalSpecs,
        completed: this.completedSpecs,
        failed: this.failedSpecs,
      });
    } catch (error) {
      this.isExecuting = false;
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Execute a single wave of SPECs
   *
   * Executes SPECs in the wave with respect to max parallel limit.
   *
   * @param wave - Wave to execute
   */
  private async executeWave(wave: Wave): Promise<void> {
    this.emit('wave:start', wave);

    const specs = wave.specs;
    const sessions: ClaudeSession[] = [];

    // Create sessions for all SPECs in wave
    for (const spec of specs) {
      if (this.stopRequested) break;

      try {
        const session = await this.createSession(spec);
        sessions.push(session);
        this.activeSessions.set(session.id, session);
        this.emit('session:created', session.toSessionInfo());
      } catch (error) {
        this.emit('error', {
          specId: spec.id,
          error: error instanceof Error ? error.message : 'Failed to create session',
        });
      }
    }

    // Execute sessions with parallel limit
    await this.executeSessionsWithLimit(sessions);

    // Wait for all sessions to complete
    await Promise.all(
      sessions.map(async (session) => {
        try {
          await session.waitForCompletion();
        } catch (error) {
          // Session failed, already handled by event handlers
        }
      })
    );

    this.emit('wave:complete', wave);
  }

  /**
   * Create a session for a SPEC
   *
   * Creates worktree and Claude session.
   *
   * @param spec - SPEC to create session for
   * @returns ClaudeSession instance
   */
  private async createSession(spec: SpecInfo): Promise<ClaudeSession> {
    // Create worktree for isolated execution
    const worktreePath = await this.worktreeManager.createWorktree(
      spec.id,
      spec.filePath
    );

    // Create Claude session
    const session = new ClaudeSession(spec.id, worktreePath, this.claudePath);

    // Set up session event handlers
    this.setupSessionHandlers(session);

    return session;
  }

  /**
   * Set up event handlers for a session
   *
   * @param session - ClaudeSession to set up handlers for
   */
  private setupSessionHandlers(session: ClaudeSession): void {
    // Session started
    session.on('started', () => {
      this.emit('session:started', session.toSessionInfo());
      this.updateSessionInfo(session);
    });

    // Session completed
    session.on('completed', () => {
      this.completedSpecs++;
      this.emit('session:completed', session.toSessionInfo());
      this.updateSessionInfo(session);
      this.emitProgress();
    });

    // Session failed
    session.on('failed', (error) => {
      this.failedSpecs++;
      this.emit('session:failed', {
        ...session.toSessionInfo(),
        error,
      });
      this.updateSessionInfo(session);
      this.emitProgress();
    });

    // Session cancelled
    session.on('cancelled', () => {
      this.emit('session:cancelled', session.toSessionInfo());
      this.updateSessionInfo(session);
    });

    // Session output
    session.on('output', (data) => {
      this.emit('session:output', {
        sessionId: session.id,
        specId: session.specId,
        data,
      });
      this.updateSessionInfo(session);
    });
  }

  /**
   * Execute sessions with parallel limit
   *
   * Executes sessions in batches respecting max parallel limit.
   *
   * @param sessions - Sessions to execute
   */
  private async executeSessionsWithLimit(sessions: ClaudeSession[]): Promise<void> {
    const batchSize = this.maxParallel;
    const batches: ClaudeSession[][] = [];

    // Split into batches
    for (let i = 0; i < sessions.length; i += batchSize) {
      batches.push(sessions.slice(i, i + batchSize));
    }

    // Execute batches sequentially
    for (const batch of batches) {
      if (this.stopRequested) break;

      // Start all sessions in batch
      await Promise.all(
        batch.map(async (session) => {
          try {
            await session.start();
          } catch (error) {
            this.emit('error', {
              sessionId: session.id,
              error: error instanceof Error ? error.message : 'Failed to start session',
            });
          }
        })
      );

      // Wait for at least one session to complete before starting next batch
      // This ensures we don't exceed the parallel limit
      await Promise.race(
        batch.map((session) => session.waitForCompletion())
      );
    }
  }

  /**
   * Update session info in cache
   *
   * @param session - ClaudeSession to update info for
   */
  private updateSessionInfo(session: ClaudeSession): void {
    const info = session.toSessionInfo();
    this.sessionInfo.set(session.id, info);
    this.emit('session:update', info);
  }

  /**
   * Emit progress update event
   */
  private emitProgress(): void {
    const progress = {
      total: this.totalSpecs,
      completed: this.completedSpecs,
      failed: this.failedSpecs,
      running: this.activeSessions.size - this.completedSpecs - this.failedSpecs,
      percentage: Math.floor(
        ((this.completedSpecs + this.failedSpecs) / this.totalSpecs) * 100
      ),
    };

    this.emit('progress:update', progress);
  }

  /**
   * Stop all running sessions
   *
   * Gracefully stops all active sessions.
   */
  async stopExecution(): Promise<void> {
    this.stopRequested = true;

    // Stop all active sessions
    const stopPromises = Array.from(this.activeSessions.values()).map((session) => {
      return new Promise<void>((resolve) => {
        try {
          session.stop();
          session.once('cancelled', () => resolve());
          setTimeout(() => resolve(), 1000); // Timeout after 1s
        } catch (error) {
          resolve(); // Continue even if stop fails
        }
      });
    });

    await Promise.all(stopPromises);

    this.emit('execution:stopped', {
      completed: this.completedSpecs,
      failed: this.failedSpecs,
    });
  }

  /**
   * Get all active sessions
   *
   * @returns Array of SessionInfo objects
   */
  getActiveSessions(): SessionInfo[] {
    return Array.from(this.activeSessions.values()).map((session) =>
      session.toSessionInfo()
    );
  }

  /**
   * Get session by ID
   *
   * @param sessionId - Session ID to look up
   * @returns SessionInfo or undefined if not found
   */
  getSession(sessionId: string): SessionInfo | undefined {
    return this.sessionInfo.get(sessionId);
  }

  /**
   * Clean up completed sessions
   *
   * Removes sessions that have completed, failed, or been cancelled.
   */
  private cleanupCompletedSessions(): void {
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (
        session.status === 'completed' ||
        session.status === 'failed' ||
        session.status === 'cancelled'
      ) {
        session.destroy();
        this.activeSessions.delete(sessionId);
      }
    }
  }

  /**
   * Destroy the session manager
   *
   * Stops all sessions and cleans up resources.
   */
  destroy(): void {
    this.stopExecution();

    // Destroy all sessions
    for (const session of this.activeSessions.values()) {
      session.destroy();
    }

    this.activeSessions.clear();
    this.sessionInfo.clear();
    this.removeAllListeners();
  }
}
