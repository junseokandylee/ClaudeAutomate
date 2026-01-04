/**
 * ClaudeSession Service - REQ-002
 *
 * TAG-FUNC-002: ClaudeSession Implementation
 *
 * Manages a single Claude Code CLI session using node-pty for pseudo-terminal.
 * Handles process spawning, output capture, command input, and termination.
 *
 * Features:
 * - Spawn Claude Code CLI in dedicated pty
 * - Capture stdout/stderr in real-time
 * - Send input commands to Claude
 * - Detect completion markers
 * - Handle process termination
 * - Memory management for long-running sessions
 */

import { spawn } from 'node-pty';
import type { IPty } from 'node-pty';
import { v4 as uuidv4 } from 'uuid';
import type { SessionInfo, SessionStatus } from '@/shared/types';
import { EventEmitter } from 'events';

/**
 * Maximum output buffer size (10MB)
 * Prevents memory issues with long-running sessions
 */
const MAX_OUTPUT_BUFFER = 10 * 1024 * 1024;

/**
 * ClaudeSession Events
 */
export type ClaudeSessionEvent = 'started' | 'completed' | 'failed' | 'cancelled' | 'output';

/**
 * ClaudeSession - Manages a single Claude Code CLI execution
 *
 * @example
 * ```typescript
 * const session = new ClaudeSession('SPEC-001', '/worktree/path', '/usr/bin/claude');
 *
 * session.on('output', (data) => console.log(data));
 * session.on('completed', () => console.log('Done!'));
 *
 * await session.start();
 * session.send('/help');
 *
 * await session.waitForCompletion();
 * ```
 */
export class ClaudeSession extends EventEmitter {
  /** Unique session identifier */
  public readonly id: string;

  /** SPEC ID being executed */
  public readonly specId: string;

  /** Git worktree path for this session */
  public readonly worktreePath: string;

  /** Path to Claude Code CLI executable */
  private readonly claudePath: string;

  /** Pty process for Claude Code CLI */
  private pty: IPty | null = null;

  /** Current session status */
  private _status: SessionStatus = 'idle';

  /** Accumulated output from Claude Code CLI */
  private _output: string = '';

  /** Error message if session failed */
  private _error: string | null = null;

  /** Session start timestamp */
  private _startedAt: string | null = null;

  /** Session completion timestamp */
  private _completedAt: string | null = null;

  /** Output buffer for memory management */
  private outputBuffer: string[] = [];

  /**
   * Create a new ClaudeSession
   *
   * @param specId - SPEC ID to execute
   * @param worktreePath - Git worktree path for execution
   * @param claudePath - Path to Claude Code CLI executable
   */
  constructor(specId: string, worktreePath: string, claudePath: string) {
    super();
    this.id = uuidv4();
    this.specId = specId;
    this.worktreePath = worktreePath;
    this.claudePath = claudePath;
  }

  /**
   * Get current session status
   */
  get status(): SessionStatus {
    return this._status;
  }

  /**
   * Get accumulated output
   */
  get output(): string {
    return this._output;
  }

  /**
   * Get error message
   */
  get error(): string | null {
    return this._error;
  }

  /**
   * Get start timestamp
   */
  get startedAt(): string | null {
    return this._startedAt;
  }

  /**
   * Get completion timestamp
   */
  get completedAt(): string | null {
    return this._completedAt;
  }

  /**
   * Start the Claude Code CLI session
   *
   * Spawns a pty process and begins capturing output.
   *
   * @throws {Error} If spawn fails or session already started
   */
  async start(): Promise<void> {
    if (this._status !== 'idle') {
      throw new Error(`Cannot start session with status: ${this._status}`);
    }

    try {
      // Spawn pty process
      this.pty = spawn(this.claudePath, [], {
        cwd: this.worktreePath,
        name: 'xterm-color',
        cols: 80,
        rows: 24,
      });

      // Update state
      this._status = 'running';
      this._startedAt = new Date().toISOString();

      // Set up event handlers
      this.setupPtyHandlers();

      // Emit started event
      this.emit('started');
    } catch (error) {
      this._status = 'failed';
      this._error = error instanceof Error ? error.message : 'Failed to spawn process';
      this._completedAt = new Date().toISOString();
      this.emit('failed', this._error);
      throw error;
    }
  }

  /**
   * Set up pty event handlers
   */
  private setupPtyHandlers(): void {
    if (!this.pty) return;

    // Handle data output
    this.pty.on('data', (data: string) => {
      this.appendOutput(data);
      this.emit('output', data);
    });

    // Handle process exit
    this.pty.on('exit', (exitCode: number | null, signal: NodeJS.Signals | null) => {
      this.handleExit(exitCode, signal);
    });
  }

  /**
   * Append output to buffer with memory management
   */
  private appendOutput(data: string): void {
    this.outputBuffer.push(data);

    // Calculate total buffer size
    const totalSize = this.outputBuffer.reduce((sum, chunk) => sum + chunk.length, 0);

    // If buffer exceeds limit, truncate
    if (totalSize > MAX_OUTPUT_BUFFER) {
      // Remove oldest chunks until under limit
      while (this.outputBuffer.length > 0 && totalSize > MAX_OUTPUT_BUFFER) {
        this.outputBuffer.shift();
      }

      // Add truncation marker
      this.outputBuffer.push('\n... [Output truncated due to size limit] ...\n');
    }

    // Update output
    this._output = this.outputBuffer.join('');
  }

  /**
   * Handle process exit
   */
  private handleExit(exitCode: number | null, signal: NodeJS.Signals | null): void {
    this._completedAt = new Date().toISOString();

    if (signal === 'SIGTERM' || signal === 'SIGKILL') {
      // Killed by user
      this._status = 'cancelled';
      this.emit('cancelled');
    } else if (exitCode === 0) {
      // Successful completion
      this._status = 'completed';
      this.emit('completed');
    } else {
      // Failed
      this._status = 'failed';
      this._error = `Process exited with code ${exitCode}`;
      this.emit('failed', this._error);
    }
  }

  /**
   * Send input command to Claude Code CLI
   *
   * @param input - Command string to send
   * @throws {Error} If session not started
   */
  send(input: string): void {
    if (!this.pty || this._status !== 'running') {
      throw new Error('Session not started');
    }

    // Append carriage return for Enter key
    this.pty.write(`${input}\r`);
  }

  /**
   * Stop the session
   *
   * Terminates the pty process gracefully.
   */
  stop(): void {
    if (this._status === 'idle' || this._status === 'completed' || this._status === 'failed' || this._status === 'cancelled') {
      return; // Already stopped
    }

    if (this.pty) {
      this.pty.kill();
      this.pty = null;
    }

    this._status = 'cancelled';
    this._completedAt = new Date().toISOString();
    this.emit('cancelled');
  }

  /**
   * Wait for session completion
   *
   * @returns Promise that resolves when session completes
   */
  async waitForCompletion(): Promise<void> {
    return new Promise((resolve) => {
      if (this._status === 'completed' || this._status === 'failed' || this._status === 'cancelled') {
        resolve();
        return;
      }

      const done = () => {
        this.removeListener('completed', done);
        this.removeListener('failed', done);
        this.removeListener('cancelled', done);
        resolve();
      };

      this.on('completed', done);
      this.on('failed', done);
      this.on('cancelled', done);
    });
  }

  /**
   * Convert to SessionInfo interface
   *
   * @returns SessionInfo object
   */
  toSessionInfo(): SessionInfo {
    return {
      id: this.id,
      specId: this.specId,
      status: this._status,
      worktreePath: this.worktreePath,
      startedAt: this._startedAt || '',
      completedAt: this._completedAt || undefined,
      output: this._output,
      error: this._error,
    };
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stop();
    this.outputBuffer = [];
    this.removeAllListeners();
  }
}
