/**
 * Tests for IPC Mocks
 *
 * REQ-004: Integration Testing
 * REQ-002: Main Process Testing
 * TAG-001: Mock Electron APIs appropriately
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { SessionInfo, ExecutionPlan } from '@shared/types';
import {
  createMockIpcRenderer,
  setupMockElectronAPI,
  createMockIpcMain,
  createMockFileSystem,
  setupMockFs,
  createMockChildProcess,
  setupMockChildProcess,
  setupIntegrationTestEnvironment,
} from './ipc-mocks';

describe('IPC Mocks - REQ-004, REQ-002, TAG-001', () => {
  describe('createMockIpcRenderer', () => {
    it('should create mock IPC renderer with handlers', async () => {
      const mockSession: SessionInfo = {
        id: 'test-id',
        specId: 'SPEC-001',
        status: 'idle',
        worktreePath: '/test',
        startedAt: new Date().toISOString(),
        output: '',
        error: null,
      };

      const mockIpc = createMockIpcRenderer({
        'session:start': async ({ specId }) => ({
          ...mockSession,
          specId,
        }),
      });

      const result = await mockIpc.invoke('session:start', { specId: 'SPEC-001' });
      expect(result.specId).toBe('SPEC-001');
    });

    it('should throw error for unhandled channels', async () => {
      const mockIpc = createMockIpcRenderer({});
      await expect(mockIpc.invoke('session:start' as any)).rejects.toThrow(
        'No handler for channel'
      );
    });

    it('should track called channels', async () => {
      const mockIpc = createMockIpcRenderer({
        'config:get': async () => ({
          claudePath: '/test',
          projectRoot: '/test',
          maxParallelSessions: 5,
          locale: 'en',
          autoCleanup: true,
        }),
      });

      await mockIpc.invoke('config:get');
      expect(mockIpc.calledWith('config:get')).toBe(true);
      expect(mockIpc.calledWith('session:start' as any)).toBe(false);
    });

    it('should track call count for channels', async () => {
      const mockIpc = createMockIpcRenderer({
        'config:get': async () => ({
          claudePath: '/test',
          projectRoot: '/test',
          maxParallelSessions: 5,
          locale: 'en',
          autoCleanup: true,
        }),
      });

      await mockIpc.invoke('config:get');
      await mockIpc.invoke('config:get');
      expect(mockIpc.callCount('config:get')).toBe(2);
    });

    it('should reset mocks', async () => {
      const mockIpc = createMockIpcRenderer({
        'config:get': async () => ({
          claudePath: '/test',
          projectRoot: '/test',
          maxParallelSessions: 5,
          locale: 'en',
          autoCleanup: true,
        }),
      });

      await mockIpc.invoke('config:get');
      expect(mockIpc.callCount('config:get')).toBe(1);

      mockIpc.reset();
      expect(mockIpc.callCount('config:get')).toBe(0);
    });
  });

  describe('setupMockElectronAPI', () => {
    afterEach(() => {
      // @ts-ignore
      delete window.electronAPI;
    });

    it('should setup electronAPI on window', () => {
      const cleanup = setupMockElectronAPI();
      // @ts-ignore
      expect(window.electronAPI).toBeDefined();
      // @ts-ignore
      expect(window.electronAPI.ipc).toBeDefined();
      cleanup();
    });

    it('should provide platform info', () => {
      const cleanup = setupMockElectronAPI();
      // @ts-ignore
      expect(window.electronAPI.platform).toBeDefined();
      cleanup();
    });

    it('should provide version info', () => {
      const cleanup = setupMockElectronAPI();
      // @ts-ignore
      expect(window.electronAPI.versions).toBeDefined();
      // @ts-ignore
      expect(window.electronAPI.versions.node).toBeDefined();
      cleanup();
    });

    it('should cleanup electronAPI', () => {
      const cleanup = setupMockElectronAPI();
      // @ts-ignore
      expect(window.electronAPI).toBeDefined();
      cleanup();
      // @ts-ignore
      expect(window.electronAPI).toBeUndefined();
    });

    it('should use custom mock IPC', async () => {
      const mockIpc = createMockIpcRenderer({
        'config:get': async () => ({
          claudePath: '/custom',
          projectRoot: '/custom',
          maxParallelSessions: 10,
          locale: 'ko',
          autoCleanup: false,
        }),
      });

      const cleanup = setupMockElectronAPI(mockIpc);
      // @ts-ignore
      const result = await window.electronAPI.ipc.invoke('config:get');
      expect(result.maxParallelSessions).toBe(10);
      cleanup();
    });
  });

  describe('createMockIpcMain', () => {
    it('should create mock IPC main', () => {
      const mockIpcMain = createMockIpcMain();
      expect(mockIpcMain.handle).toBeDefined();
      expect(mockIpcMain.on).toBeDefined();
      expect(mockIpcMain.removeAllListeners).toBeDefined();
    });

    it('should track listeners', () => {
      const mockIpcMain = createMockIpcMain();
      const callback = vi.fn();

      mockIpcMain.on('test-channel', callback);
      expect(mockIpcMain.listenerCount('test-channel')).toBe(1);
    });

    it('should emit events to listeners', () => {
      const mockIpcMain = createMockIpcMain();
      const callback = vi.fn();

      mockIpcMain.on('test-channel', callback);
      mockIpcMain.emit('test-channel', 'arg1', 'arg2');

      expect(callback).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should emit to multiple listeners', () => {
      const mockIpcMain = createMockIpcMain();
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      mockIpcMain.on('test-channel', callback1);
      mockIpcMain.on('test-channel', callback2);
      mockIpcMain.emit('test-channel', 'data');

      expect(callback1).toHaveBeenCalledWith('data');
      expect(callback2).toHaveBeenCalledWith('data');
    });

    it('should remove listeners', () => {
      const mockIpcMain = createMockIpcMain();
      const callback = vi.fn();

      mockIpcMain.on('test-channel', callback);
      expect(mockIpcMain.listenerCount('test-channel')).toBe(1);

      mockIpcMain.removeAllListeners('test-channel');
      expect(mockIpcMain.listenerCount('test-channel')).toBe(0);
    });

    it('should clear all listeners', () => {
      const mockIpcMain = createMockIpcMain();

      mockIpcMain.on('channel1', vi.fn());
      mockIpcMain.on('channel2', vi.fn());

      mockIpcMain.clear();
      expect(mockIpcMain.listenerCount('channel1')).toBe(0);
      expect(mockIpcMain.listenerCount('channel2')).toBe(0);
    });
  });

  describe('createMockFileSystem', () => {
    it('should create mock file system', () => {
      const mockFs = createMockFileSystem();
      expect(mockFs.setFile).toBeDefined();
      expect(mockFs.getFile).toBeDefined();
      expect(mockFs.exists).toBeDefined();
      expect(mockFs.delete).toBeDefined();
    });

    it('should store and retrieve files', () => {
      const mockFs = createMockFileSystem();
      mockFs.setFile('/test.md', 'content');
      expect(mockFs.getFile('/test.md')).toBe('content');
    });

    it('should check file existence', () => {
      const mockFs = createMockFileSystem();
      expect(mockFs.exists('/test.md')).toBe(false);

      mockFs.setFile('/test.md', 'content');
      expect(mockFs.exists('/test.md')).toBe(true);
    });

    it('should delete files', () => {
      const mockFs = createMockFileSystem();
      mockFs.setFile('/test.md', 'content');
      expect(mockFs.exists('/test.md')).toBe(true);

      mockFs.delete('/test.md');
      expect(mockFs.exists('/test.md')).toBe(false);
    });

    it('should clear all files', () => {
      const mockFs = createMockFileSystem();
      mockFs.setFile('/test1.md', 'content1');
      mockFs.setFile('/test2.md', 'content2');

      mockFs.clear();
      expect(mockFs.exists('/test1.md')).toBe(false);
      expect(mockFs.exists('/test2.md')).toBe(false);
    });

    it('should return all files', () => {
      const mockFs = createMockFileSystem();
      mockFs.setFile('/test1.md', 'content1');
      mockFs.setFile('/test2.md', 'content2');

      const all = mockFs.allFiles();
      expect(Object.keys(all).length).toBe(2);
      expect(all['/test1.md']).toBe('content1');
      expect(all['/test2.md']).toBe('content2');
    });
  });

  describe('createMockChildProcess', () => {
    it('should create mock child process', () => {
      const mockProcess = createMockChildProcess({});
      expect(mockProcess.stdout).toBeDefined();
      expect(mockProcess.stderr).toBeDefined();
      expect(mockProcess.on).toBeDefined();
      expect(mockProcess.kill).toBeDefined();
      expect(mockProcess.pid).toBeDefined();
    });

    it('should set custom pid', () => {
      const mockProcess = createMockChildProcess({ pid: 12345 });
      expect(mockProcess.pid).toBe(12345);
    });
  });

  describe('setupMockChildProcess', () => {
    it('should setup child_process mocks', () => {
      const mockChildProcess = setupMockChildProcess();
      expect(mockChildProcess.spawnMock).toBeDefined();
      expect(mockChildProcess.execSyncMock).toBeDefined();
    });
  });

  describe('setupIntegrationTestEnvironment', () => {
    afterEach(() => {
      // @ts-ignore
      delete window.electronAPI;
    });

    it('should setup complete mock environment', () => {
      const cleanup = setupIntegrationTestEnvironment();

      // @ts-ignore
      expect(window.electronAPI).toBeDefined();
      // @ts-ignore
      expect(window.electronAPI.ipc).toBeDefined();

      cleanup();
    });

    it('should cleanup environment', () => {
      const cleanup = setupIntegrationTestEnvironment();

      // @ts-ignore
      expect(window.electronAPI).toBeDefined();

      cleanup();

      // @ts-ignore
      expect(window.electronAPI).toBeUndefined();
    });

    it('should provide default IPC handlers', async () => {
      const cleanup = setupIntegrationTestEnvironment();

      // @ts-ignore
      const config = await window.electronAPI.ipc.invoke('config:get');
      expect(config).toBeDefined();
      expect(config.maxParallelSessions).toBe(5);

      cleanup();
    });
  });
});
