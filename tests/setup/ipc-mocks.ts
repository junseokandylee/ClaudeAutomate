/**
 * IPC Mock Setup for Testing
 *
 * REQ-004: Integration Testing
 * REQ-002: Main Process Testing
 * TAG-001: Mock Electron APIs appropriately
 *
 * Provides mock factories and setup functions for Electron IPC communication.
 */

import { vi } from 'vitest';
import type {
  IpcChannels,
  SessionInfo,
  ExecutionPlan,
  BootstrapCheckResponse,
  AppConfig,
} from '@shared/types';

// ============================================================================
// IPC Handler Mocks
// ============================================================================

interface IpcMockHandlers {
  'session:start'?: (payload: { specId: string }) => Promise<SessionInfo>;
  'session:cancel'?: (payload: { sessionId: string }) => Promise<boolean>;
  'session:retry'?: (payload: { sessionId: string }) => Promise<SessionInfo>;
  'plan:generate'?: (payload?: { specIds?: string[] }) => Promise<ExecutionPlan>;
  'config:get'?: () => Promise<AppConfig>;
  'config:set'?: (payload: { key: string; value: unknown }) => Promise<void>;
  'bootstrap:check'?: () => Promise<BootstrapCheckResponse>;
}

/**
 * Create mock IPC renderer with handlers
 *
 * @param handlers - Map of channel to handler functions
 * @returns Mock IPC renderer object
 *
 * @example
 * ```typescript
 * const mockIpc = createMockIpcRenderer({
 *   'session:start': async ({ specId }) => createMockSession({ specId }),
 * });
 * ```
 */
export function createMockIpcRenderer(handlers: IpcMockHandlers = {}) {
  const mockSend = vi.fn();
  const mockOn = vi.fn();
  const mockInvoke = vi.fn();

  // Setup invoke handler
  mockInvoke.mockImplementation(async (channel: IpcChannels, ...args: unknown[]) => {
    const handler = handlers[channel as keyof IpcMockHandlers];
    if (handler) {
      return await handler(...args);
    }
    throw new Error(`No handler for channel: ${channel}`);
  });

  return {
    send: mockSend,
    on: mockOn,
    invoke: mockInvoke,
    // Helper to check if channel was called
    calledWith: (channel: IpcChannels, ...args: unknown[]) => {
      return mockInvoke.mock.calls.some(
        (call) => call[0] === channel &&
          JSON.stringify(call.slice(1)) === JSON.stringify(args)
      );
    },
    // Helper to get call count for channel
    callCount: (channel: IpcChannels) => {
      return mockInvoke.mock.calls.filter(
        (call) => call[0] === channel
      ).length;
    },
    // Reset all mocks
    reset: () => {
      mockSend.mockClear();
      mockOn.mockClear();
      mockInvoke.mockClear();
    },
  };
}

/**
 * Setup global Electron API mock for renderer tests
 *
 * @param mockIpc - Mock IPC renderer (optional, creates default if not provided)
 * @returns Cleanup function
 *
 * @example
 * ```typescript
 * const cleanup = setupMockElectronAPI();
 * // ... run tests
 * cleanup();
 * ```
 */
export function setupMockElectronAPI(mockIpc?: ReturnType<typeof createMockIpcRenderer>) {
  const ipc = mockIpc || createMockIpcRenderer();

  // @ts-ignore - Adding to window for testing
  window.electronAPI = {
    ipc: ipc,
    // Add other Electron API methods as needed
    platform: process.platform || 'darwin',
    versions: {
      node: '18.0.0',
      chrome: '120.0.0',
      electron: '28.0.0',
    },
  };

  return () => {
    // @ts-ignore
    delete window.electronAPI;
    ipc.reset();
  };
}

// ============================================================================
// IPC Event Emitters
// ============================================================================

/**
 * Mock IPC main event emitter for testing renderer process
 *
 * @returns Mock IPC main object
 *
 * @example
 * ```typescript
 * const mockIpcMain = createMockIpcMain();
 * mockIpcMain.emit('session:created', { sessionId: '123', specId: 'SPEC-001' });
 * ```
 */
export function createMockIpcMain() {
  const listeners = new Map<string, Function[]>();
  const mockHandle = vi.fn();
  const mockOn = vi.fn();
  const mockRemoveAllListeners = vi.fn();

  // Setup on handler to track listeners
  mockOn.mockImplementation((channel: string, callback: Function) => {
    if (!listeners.has(channel)) {
      listeners.set(channel, []);
    }
    listeners.get(channel)!.push(callback);
  });

  // Setup removeAllListeners
  mockRemoveAllListeners.mockImplementation((channel?: string) => {
    if (channel) {
      listeners.delete(channel);
    } else {
      listeners.clear();
    }
  });

  return {
    handle: mockHandle,
    on: mockOn,
    removeAllListeners: mockRemoveAllListeners,
    // Emit event to all listeners
    emit: (channel: string, ...args: unknown[]) => {
      const channelListeners = listeners.get(channel) || [];
      channelListeners.forEach((listener) => listener(...args));
    },
    // Get listener count for channel
    listenerCount: (channel: string) => {
      return listeners.get(channel)?.length || 0;
    },
    // Clear all listeners
    clear: () => {
      listeners.clear();
    },
  };
}

// ============================================================================
// File System Mocks
// ============================================================================

/**
 * Create mock file system for testing
 *
 * @returns Mock file system object
 *
 * @example
 * ```typescript
 * const mockFs = createMockFileSystem();
 * mockFs.setFile('/path/to/file.md', 'content');
 * expect(mockFs.readFile('/path/to/file.md')).toBe('content');
 * ```
 */
export function createMockFileSystem() {
  const files = new Map<string, string>();

  return {
    // Set file content
    setFile: (path: string, content: string) => {
      files.set(path, content);
    },
    // Get file content
    getFile: (path: string) => {
      return files.get(path);
    },
    // Check if file exists
    exists: (path: string) => {
      return files.has(path);
    },
    // Delete file
    delete: (path: string) => {
      files.delete(path);
    },
    // Clear all files
    clear: () => {
      files.clear();
    },
    // Get all files
    allFiles: () => {
      return Object.fromEntries(files);
    },
  };
}

/**
 * Setup mock fs module for Node.js tests
 *
 * @param mockFs - Mock file system (optional, creates default if not provided)
 * @returns Mock fs module
 *
 * @example
 * ```typescript
 * const mockFs = setupMockFs();
 * mockFs.setFile('/test.md', 'content');
 * expect(fs.readFileSync('/test.md', 'utf-8')).toBe('content');
 * ```
 */
export function setupMockFs(mockFs?: ReturnType<typeof createMockFileSystem>) {
  const fs = mockFs || createMockFileSystem();

  vi.doMock('fs', () => ({
    existsSync: vi.fn((path: string) => fs.exists(path)),
    readFileSync: vi.fn((path: string) => fs.getFile(path) || ''),
    writeFileSync: vi.fn((path: string, content: string) => fs.setFile(path, content)),
    mkdirSync: vi.fn(),
    readdirSync: vi.fn(() => []),
  }));

  return fs;
}

// ============================================================================
// Child Process Mocks
// ============================================================================

/**
 * Mock child_process spawn result
 */
interface MockSpawnResult {
  stdout: NodeJS.ReadableStream;
  stderr: NodeJS.ReadableStream;
  on: (event: string, callback: (code?: number) => void) => void;
  kill: (signal?: string) => void;
  pid: number;
}

/**
 * Create mock child process for testing
 *
 * @param options - Mock options
 * @returns Mock child process object
 *
 * @example
 * ```typescript
 * const mockProcess = createMockChildProcess({
 *   stdout: 'output',
 *   stderr: '',
 *   exitCode: 0,
 * });
 * ```
 */
export function createMockChildProcess(options: {
  stdout?: string;
  stderr?: string;
  exitCode?: number;
  pid?: number;
}): MockSpawnResult {
  const { Readable } = require('stream');

  const stdoutStream = new Readable();
  stdoutStream.push(options.stdout || '');
  stdoutStream.push(null);

  const stderrStream = new Readable();
  stderrStream.push(options.stderr || '');
  stderrStream.push(null);

  let exitCallback: ((code?: number) => void) | null = null;

  return {
    stdout: stdoutStream,
    stderr: stderrStream,
    on: (event: string, callback: (code?: number) => void) => {
      if (event === 'close' || event === 'exit') {
        exitCallback = callback;
        // Simulate immediate exit
        setTimeout(() => callback(options.exitCode || 0), 0);
      }
    },
    kill: () => {
      if (exitCallback) {
        exitCallback(options.exitCode || 0);
      }
    },
    pid: options.pid || Math.floor(Math.random() * 10000),
  };
}

/**
 * Setup mock child_process module
 *
 * @returns Setup object with spawn and execSync mocks
 *
 * @example
 * ```typescript
 * const mockChildProcess = setupMockChildProcess();
 * mockChildProcess.spawnMock.mockReturnValue(createMockChildProcess({ exitCode: 0 }));
 * ```
 */
export function setupMockChildProcess() {
  const spawnMock = vi.fn();
  const execSyncMock = vi.fn();

  vi.doMock('child_process', () => ({
    spawn: spawnMock,
    execSync: execSyncMock,
  }));

  return {
    spawnMock,
    execSyncMock,
  };
}

// ============================================================================
// Integration Test Setup
// ============================================================================

/**
 * Setup complete mock environment for integration tests
 *
 * @returns Cleanup function
 *
 * @example
 * ```typescript
 * describe('Integration Test', () => {
 *   beforeEach(() => {
 *     const cleanup = setupIntegrationTestEnvironment();
 *     // ... setup test data
 *   });
 *
 *   afterEach(() => {
 *     cleanup();
 *   });
 * });
 * ```
 */
export function setupIntegrationTestEnvironment() {
  const cleanupFns: (() => void)[] = [];

  // Setup IPC mocks
  const mockIpc = createMockIpcRenderer({
    'config:get': async () => ({
      claudePath: '/usr/bin/claude',
      projectRoot: '/test/project',
      maxParallelSessions: 5,
      locale: 'en',
      autoCleanup: true,
    }),
    'bootstrap:check': async () => ({
      success: true,
      dependencies: {},
      errors: [],
    }),
  });

  cleanupFns.push(setupMockElectronAPI(mockIpc));

  // Setup fs mocks
  const mockFs = createMockFileSystem();
  setupMockFs(mockFs);
  cleanupFns.push(() => mockFs.clear());

  // Setup child_process mocks
  const mockChildProcess = setupMockChildProcess();
  cleanupFns.push(() => {
    mockChildProcess.spawnMock.mockReset();
    mockChildProcess.execSyncMock.mockReset();
  });

  // Return combined cleanup function
  return () => {
    cleanupFns.forEach((fn) => fn());
  };
}
