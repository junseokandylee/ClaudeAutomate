/**
 * StatusBar Component Tests
 *
 * REQ-006: StatusBar Component
 * TAG-TEST-006: StatusBar Component Tests
 *
 * Test coverage:
 * - Component rendering
 * - Status display
 * - Session count display
 * - Locale display
 * - Settings access
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBar } from '../StatusBar';

// Mock stores
vi.mock('@/renderer/stores/appStore', () => ({
  useAppStore: vi.fn((fn) => fn({
    currentView: 'main',
    isBootstrapComplete: true,
    dialogs: { settings: false, confirm: false, error: false },
    errorState: null,
  })),
}));

// Mock config store
vi.mock('@/renderer/stores/configStore', () => ({
  useConfigStore: vi.fn((fn) => fn({
    config: {
      locale: 'en',
      claudePath: '/path/to/claude',
      projectRoot: '/project/root',
      maxParallelSessions: 10,
      autoCleanup: true,
    },
    isLoading: false,
    error: null,
  })),
}));

// Mock IPC
const mockOnSessionUpdate = vi.fn(() => vi.fn());

global.window.electronAPI = {
  onSessionUpdate: mockOnSessionUpdate,
  getConfig: vi.fn(),
  setConfig: vi.fn(),
  onConfigChange: vi.fn(),
  scanSpecs: vi.fn(),
  onSpecStatus: vi.fn(),
  onSessionOutput: vi.fn(),
} as any;

describe('StatusBar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the status bar container', () => {
      render(<StatusBar />);
      const container = screen.getByTestId('status-bar');
      expect(container).toBeInTheDocument();
    });

    it('should display application status', () => {
      render(<StatusBar />);
      expect(screen.getByText(/ready/i)).toBeInTheDocument();
    });
  });

  describe('Session Count', () => {
    it('should display active session count', () => {
      render(<StatusBar />);
      expect(screen.getByText(/sessions/i)).toBeInTheDocument();
    });
  });

  describe('Locale Display', () => {
    it('should display current locale', () => {
      render(<StatusBar />);
      expect(screen.getByText(/en/i)).toBeInTheDocument();
    });
  });

  describe('Settings Access', () => {
    it('should provide settings button', () => {
      render(<StatusBar />);
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      expect(settingsButton).toBeInTheDocument();
    });
  });
});
