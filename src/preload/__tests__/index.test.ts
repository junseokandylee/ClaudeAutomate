/**
 * Unit tests for Preload Script (SPEC-PRELOAD-001)
 *
 * TDD RED-GREEN-REFACTOR cycle implementation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../../shared/constants';

// Mock Electron APIs
vi.mock('electron', () => ({
  contextBridge: {
    exposeInMainWorld: vi.fn(),
  },
  ipcRenderer: {
    invoke: vi.fn(),
    on: vi.fn(),
    removeListener: vi.fn(),
  },
}));

// Helper function to get electronAPI
let cachedAPI: any = null;
async function getElectronAPI() {
  vi.clearAllMocks();
  vi.resetModules();
  await import('../index');
  const exposeCall = (contextBridge.exposeInMainWorld as any).mock.calls[0];
  cachedAPI = exposeCall ? exposeCall[1] : null;
  return cachedAPI;
}

// Synchronous version for tests that don't need fresh API
function getAPI() {
  return cachedAPI || getElectronAPI();
}

describe('Preload Script - TAG-001: Context Bridge Setup', () => {
  /**
   * REQ-001: Context Bridge Setup
   */
  it('should expose electronAPI via contextBridge', async () => {
    await getElectronAPI();

    expect(contextBridge.exposeInMainWorld).toHaveBeenCalledWith(
      'electronAPI',
      expect.any(Object)
    );
  });

  it('should expose all required API methods', async () => {
    const api = await getElectronAPI();

    // Bootstrap API (REQ-002)
    expect(api).toHaveProperty('checkDependencies');
    expect(api).toHaveProperty('onBootstrapProgress');

    // SPEC API (REQ-003)
    expect(api).toHaveProperty('scanSpecs');
    expect(api).toHaveProperty('analyzeSpecs');
    expect(api).toHaveProperty('onSpecStatus');

    // Session API (REQ-004)
    expect(api).toHaveProperty('startExecution');
    expect(api).toHaveProperty('stopExecution');
    expect(api).toHaveProperty('onSessionUpdate');
    expect(api).toHaveProperty('onSessionOutput');

    // Config API (REQ-005)
    expect(api).toHaveProperty('getConfig');
    expect(api).toHaveProperty('setConfig');
    expect(api).toHaveProperty('onConfigChange');
  });

  /**
   * REQ-006: Security - No Direct IPC Exposure
   */
  it('should not expose ipcRenderer directly', async () => {
    const api = await getElectronAPI();

    expect(api).not.toHaveProperty('ipcRenderer');
    expect(api).not.toHaveProperty('send');
    expect(api).not.toHaveProperty('on');
    expect(api).not.toHaveProperty('removeListener');
  });
});

describe('Preload Script - TAG-002: Bootstrap API', () => {
  /**
   * REQ-002: Bootstrap API - checkDependencies
   */
  it('should invoke IPC channel bootstrap:check', async () => {
    const api = await getElectronAPI();
    const mockResult = { claude: true, moaiAdk: true, moaiWorktree: true };
    (ipcRenderer.invoke as any).mockResolvedValue(mockResult);

    const result = await api.checkDependencies();

    expect(ipcRenderer.invoke).toHaveBeenCalledWith(IPC_CHANNELS.BOOTSTRAP_CHECK);
    expect(result).toEqual(mockResult);
  });

  /**
   * REQ-002: Bootstrap API - onBootstrapProgress
   */
  it('should register IPC listener and return cleanup function', async () => {
    const api = await getElectronAPI();
    const mockCallback = vi.fn();

    const cleanup = api.onBootstrapProgress(mockCallback);

    expect(ipcRenderer.on).toHaveBeenCalledWith('bootstrap:progress', mockCallback);
    expect(typeof cleanup).toBe('function');
  });

  it('should remove listener when cleanup is called', async () => {
    const api = await getElectronAPI();
    const mockCallback = vi.fn();

    const cleanup = api.onBootstrapProgress(mockCallback);
    cleanup();

    expect(ipcRenderer.removeListener).toHaveBeenCalledWith('bootstrap:progress', mockCallback);
  });
});

describe('Preload Script - TAG-003: SPEC API', () => {
  /**
   * REQ-003: SPEC API - scanSpecs
   */
  it('should invoke IPC for scanning SPECs', async () => {
    const api = await getElectronAPI();
    const mockSpecs = [{
      id: 'SPEC-001',
      title: 'Test SPEC',
      filePath: '/specs/SPEC-001.md',
      status: 'pending' as const,
      dependencies: [],
    }];
    (ipcRenderer.invoke as any).mockResolvedValue(mockSpecs);

    const result = await api.scanSpecs('/project/root');

    expect(ipcRenderer.invoke).toHaveBeenCalledWith('spec:scan', '/project/root');
    expect(result).toEqual(mockSpecs);
  });

  /**
   * REQ-003: SPEC API - analyzeSpecs
   */
  it('should invoke IPC for analyzing SPECs', async () => {
    const api = await getElectronAPI();
    const mockPlan = { waves: [], totalSpecs: 0, estimatedParallelism: 0 };
    (ipcRenderer.invoke as any).mockResolvedValue(mockPlan);

    const specs = [];
    const result = await api.analyzeSpecs(specs);

    expect(ipcRenderer.invoke).toHaveBeenCalledWith('spec:analyze', specs);
    expect(result).toEqual(mockPlan);
  });

  /**
   * REQ-003: SPEC API - onSpecStatus
   */
  it('should register listener and return cleanup function', async () => {
    const api = await getElectronAPI();
    const mockCallback = vi.fn();

    const cleanup = api.onSpecStatus(mockCallback);

    expect(ipcRenderer.on).toHaveBeenCalledWith('spec:status', mockCallback);
    expect(typeof cleanup).toBe('function');
  });
});

describe('Preload Script - TAG-004: Session API', () => {
  /**
   * REQ-004: Session API - startExecution
   */
  it('should invoke IPC for starting execution', async () => {
    const api = await getElectronAPI();
    (ipcRenderer.invoke as any).mockResolvedValue(undefined);

    const plan = { waves: [], totalSpecs: 0, estimatedParallelism: 0 };
    await api.startExecution(plan);

    expect(ipcRenderer.invoke).toHaveBeenCalledWith('session:start', plan);
  });

  /**
   * REQ-004: Session API - stopExecution
   */
  it('should invoke IPC for stopping execution', async () => {
    const api = await getElectronAPI();
    (ipcRenderer.invoke as any).mockResolvedValue(undefined);

    await api.stopExecution();

    expect(ipcRenderer.invoke).toHaveBeenCalledWith('session:stop');
  });

  /**
   * REQ-004: Session API - onSessionUpdate
   */
  it('should register listener and return cleanup function', async () => {
    const api = await getElectronAPI();
    const mockCallback = vi.fn();

    const cleanup = api.onSessionUpdate(mockCallback);

    expect(ipcRenderer.on).toHaveBeenCalledWith('session:update', mockCallback);
    expect(typeof cleanup).toBe('function');
  });

  /**
   * REQ-004: Session API - onSessionOutput
   */
  it('should register listener and return cleanup function', async () => {
    const api = await getElectronAPI();
    const mockCallback = vi.fn();

    const cleanup = api.onSessionOutput(mockCallback);

    expect(ipcRenderer.on).toHaveBeenCalledWith('session:output', mockCallback);
    expect(typeof cleanup).toBe('function');
  });
});

describe('Preload Script - TAG-005: Config API', () => {
  /**
   * REQ-005: Config API - getConfig
   */
  it('should invoke IPC for getting config', async () => {
    const api = await getElectronAPI();
    const mockValue = 'test-value';
    (ipcRenderer.invoke as any).mockResolvedValue(mockValue);

    const result = await api.getConfig('testKey');

    expect(ipcRenderer.invoke).toHaveBeenCalledWith('config:get', 'testKey');
    expect(result).toBe(mockValue);
  });

  /**
   * REQ-005: Config API - setConfig
   */
  it('should invoke IPC for setting config', async () => {
    const api = await getElectronAPI();
    (ipcRenderer.invoke as any).mockResolvedValue(undefined);

    await api.setConfig('testKey', 'testValue');

    expect(ipcRenderer.invoke).toHaveBeenCalledWith('config:set', 'testKey', 'testValue');
  });

  /**
   * REQ-005: Config API - onConfigChange
   */
  it('should register listener and return cleanup function', async () => {
    const api = await getElectronAPI();
    const mockCallback = vi.fn();

    const cleanup = api.onConfigChange(mockCallback);

    expect(ipcRenderer.on).toHaveBeenCalledWith('config:change', mockCallback);
    expect(typeof cleanup).toBe('function');
  });
});
