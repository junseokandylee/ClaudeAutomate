/**
 * Vitest setup file
 *
 * Global test configuration and setup for all test suites.
 */

import { vi } from 'vitest';

// Mock Electron APIs globally
const mockApp = {
  on: vi.fn(),
  whenReady: vi.fn(() => Promise.resolve()),
  quit: vi.fn(),
  getPath: vi.fn((key: string) => {
    const paths: Record<string, string> = {
      userData: '/tmp/test-userdata',
      home: '/tmp/test-home',
    };
    return paths[key] || '/tmp/test';
  }),
  disableHardwareAcceleration: vi.fn(),
  setAppUserModelId: vi.fn(),
};

vi.mock('electron', () => ({
  app: mockApp,
  BrowserWindow: vi.fn().mockImplementation(() => ({
    loadFile: vi.fn(() => Promise.resolve()),
    loadURL: vi.fn(() => Promise.resolve()),
    on: vi.fn(),
    webContents: {
      openDevTools: vi.fn(),
      on: vi.fn(),
    },
  })),
  ipcMain: {
    handle: vi.fn(),
    on: vi.fn(),
    removeAllListeners: vi.fn(),
  },
  ipcRenderer: {
    send: vi.fn(),
    on: vi.fn(),
    invoke: vi.fn(),
  },
  default: {
    app: mockApp,
    BrowserWindow: vi.fn().mockImplementation(() => ({
      loadFile: vi.fn(() => Promise.resolve()),
      loadURL: vi.fn(() => Promise.resolve()),
      on: vi.fn(),
      webContents: {
        openDevTools: vi.fn(),
        on: vi.fn(),
      },
    })),
    ipcMain: {
      handle: vi.fn(),
      on: vi.fn(),
      removeAllListeners: vi.fn(),
    },
  },
}));

// Mock fs module with default export
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    existsSync: vi.fn(() => false),
    readFileSync: vi.fn(() => '{}'),
    writeFileSync: vi.fn(),
    default: {
      existsSync: vi.fn(() => false),
      readFileSync: vi.fn(() => '{}'),
      writeFileSync: vi.fn(),
    },
  };
});

// Mock child_process module with default export
vi.mock('child_process', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    execSync: vi.fn(),
    default: {
      execSync: vi.fn(),
    },
  };
});
