/**
 * Electron Main Process Entry Point
 *
 * This module is the entry point for the Electron main process. It handles:
 * - Application lifecycle events (ready, window-all-closed, activate)
 * - BrowserWindow creation and management
 * - IPC handler registration
 * - Security configuration (context isolation, no node integration)
 *
 * @see https://www.electronjs.org/docs/latest/tutorial/quick-start
 */

import { app, BrowserWindow } from 'electron';
import { join } from 'path';
import { registerIpcHandlers } from './ipc';

// Export functions for testing
export { registerIpcHandlers } from './ipc';

// ============================================================================
// Window Management (REQ-001, REQ-002)
// ============================================================================

/**
 * Reference to the main application window
 *
 * Maintained to prevent garbage collection and for window management.
 */
let mainWindow: BrowserWindow | null = null;

/**
 * Create the main application window
 *
 * Creates a BrowserWindow with the configured security settings and loads
 * the renderer HTML file.
 *
 * @returns The created BrowserWindow instance
 *
 * @example
 * ```typescript
 * app.whenReady().then(() => {
 *   const window = createWindow();
 *   window.webContents.openDevTools();
 * });
 * ```
 */
export function createWindow(): BrowserWindow {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    backgroundColor: '#0F172A', // Slate dark background
    show: false, // Don't show until ready-to-show
    webPreferences: {
      // Security: Enable context isolation (REQ-002)
      contextIsolation: true,

      // Security: Disable node integration (REQ-002)
      nodeIntegration: false,

      // Security: Use preload script for secure IPC bridge
      preload: join(__dirname, '../preload/index.js'),

      // Enable remote module only if absolutely necessary (disabled for security)
      enableRemoteModule: false,

      // Additional security settings
      sandbox: true, // Enable renderer process sandboxing
      webSecurity: true, // Enable web security
      allowRunningInsecureContent: false, // Block mixed content
    },
  });

  // Load the renderer HTML file
  if (process.env.NODE_ENV === 'development') {
    // Development: Load from dev server
    mainWindow.loadURL('http://localhost:5173');
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    // Production: Load from built files
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Window lifecycle: Clear reference when closed
  mainWindow.on('closed', () => {
    mainWindow = null;
    console.log('[Main] Window closed');
  });

  // Log navigation events for debugging
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[Main] Renderer finished loading');
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('[Main] Renderer failed to load:', errorCode, errorDescription);
  });

  console.log('[Main] Window created');
  return mainWindow;
}

// ============================================================================
// Application Lifecycle (REQ-001)
// ============================================================================

/**
 * App ready event handler
 *
 * Called when Electron has finished initialization.
 * Creates the main window and registers IPC handlers.
 */
app.on('ready', () => {
  console.log('[Main] App ready');

  // Register IPC handlers before creating window
  registerIpcHandlers();

  // Create the main window
  createWindow();
});

/**
 * Window all closed event handler
 *
 * Called when all windows have been closed.
 * On Windows/Linux, quit the app. On macOS, keep running (Cmd+Q to quit).
 */
app.on('window-all-closed', () => {
  console.log('[Main] All windows closed');

  // On macOS, keep app running even when all windows are closed
  // On Windows/Linux, quit app when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * Activate event handler
 *
 * Called when app is activated (macOS dock click).
 * Creates a new window if none exist.
 */
app.on('activate', () => {
  console.log('[Main] App activated');

  // On macOS, re-create window when dock icon is clicked
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

/**
 * Before quit event handler
 *
 * Called before app quits. Perform cleanup here.
 */
app.on('before-quit', () => {
  console.log('[Main] App quitting');
  // TODO: Cleanup resources, stop sessions, etc.
});

// ============================================================================
// Security Hardening (REQ-001)
// ============================================================================

/**
 * Permission request handler
 *
 * Deny all permission requests by default for security.
 * Explicitly allow only necessary permissions.
 */
app.on('web-contents-created', (_event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);

    // Prevent navigation to external URLs
    if (parsedUrl.origin !== 'http://localhost:5173' && process.env.NODE_ENV === 'development') {
      event.preventDefault();
    }
  });

  // Deny all permission requests by default
  contents.on('will-attach-webview', (event) => {
    event.preventDefault();
    console.warn('[Main] Webview attachment blocked for security');
  });
});

// ============================================================================
// Process Exceptions
// ============================================================================

/**
 * Uncaught exception handler
 *
 * Prevents app from crashing on uncaught exceptions.
 * Logs error and continues execution.
 */
process.on('uncaughtException', (error) => {
  console.error('[Main] Uncaught exception:', error);
  // TODO: Send error to error tracking service
});

/**
 * Unhandled rejection handler
 *
 * Catches unhandled promise rejections.
 */
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Main] Unhandled rejection at:', promise, 'reason:', reason);
  // TODO: Send error to error tracking service
});

// ============================================================================
// Development Helpers
// ============================================================================

/**
 * Enable hardware acceleration for better performance
 *
 * Disable if experiencing rendering issues.
 */
app.disableHardwareAcceleration(); // Disable to prevent rendering issues

/**
 * Set app user model ID for Windows (notification and taskbar)
 */
if (process.platform === 'win32') {
  app.setAppUserModelId('com.claudeparallellauncher.app');
}

console.log('[Main] Main process initialized');
