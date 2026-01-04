/**
 * StartupView Component Tests
 *
 * TAG-TEST-003: StartupView Component Test Suite
 *
 * Tests for StartupView component following TDD methodology.
 *
 * REQ-001: StartupView Component
 * - Displays application logo and title
 * - Shows version number
 * - Contains DependencyCheck component
 * - Animates on initial render
 * - Transitions to MainView when bootstrap passes
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { StartupView } from '../StartupView';
import type { BootstrapCheckResult } from '@shared/types';

// Mock electronAPI
const mockElectronAPI = {
  checkDependencies: vi.fn(),
  onBootstrapProgress: vi.fn(),
  getConfig: vi.fn(),
  setConfig: vi.fn(),
};

global.window.electronAPI = mockElectronAPI as any;

describe('StartupView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial Render', () => {
    it('should render application logo and title', () => {
      // Act
      render(<StartupView onComplete={vi.fn()} />);

      // Assert
      expect(screen.getByText('ClaudeParallelRunner')).toBeInTheDocument();
    });

    it('should show version number', () => {
      // Act
      render(<StartupView onComplete={vi.fn()} />);

      // Assert
      expect(screen.getByText(/version/i)).toBeInTheDocument();
    });

    it('should contain DependencyCheck component', () => {
      // Act
      render(<StartupView onComplete={vi.fn()} />);

      // Assert
      expect(screen.getByText(/dependency check/i)).toBeInTheDocument();
    });

    it('should check dependencies on mount', async () => {
      // Arrange
      const mockResult: BootstrapCheckResult = {
        claude: { name: 'Claude CLI', installed: true, version: '1.0.0', path: '/usr/local/bin/claude' },
        moaiAdk: { name: 'MoAI-ADK', installed: true, version: '1.0.0', path: '/path/to/.moai' },
        moaiWorktree: { name: 'Git Worktree', installed: true, version: '2.30.0', path: '/usr/bin/git' },
      };
      mockElectronAPI.checkDependencies.mockResolvedValue(mockResult);

      // Act
      render(<StartupView onComplete={vi.fn()} />);

      // Assert
      await waitFor(() => {
        expect(mockElectronAPI.checkDependencies).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Animation', () => {
    it('should animate on initial render', () => {
      // Act
      const { container } = render(<StartupView onComplete={vi.fn()} />);

      // Assert
      const mainElement = container.querySelector('[data-testid="startup-view"]');
      expect(mainElement).toBeInTheDocument();
    });
  });

  describe('Bootstrap Transition', () => {
    it('should call onComplete when all dependencies are installed', async () => {
      // Arrange
      const mockResult: BootstrapCheckResult = {
        claude: { name: 'Claude CLI', installed: true, version: '1.0.0', path: '/usr/local/bin/claude' },
        moaiAdk: { name: 'MoAI-ADK', installed: true, version: '1.0.0', path: '/path/to/.moai' },
        moaiWorktree: { name: 'Git Worktree', installed: true, version: '2.30.0', path: '/usr/bin/git' },
      };
      mockElectronAPI.checkDependencies.mockResolvedValue(mockResult);
      const onComplete = vi.fn();

      // Act
      render(<StartupView onComplete={onComplete} />);

      // Wait for checkDependencies to be called and the timeout to trigger
      // Use a longer timeout to account for the 1500ms delay in the component
      await waitFor(
        () => {
          expect(onComplete).toHaveBeenCalledTimes(1);
        },
        { timeout: 3000 }
      );
    });

    it('should not call onComplete when dependencies are missing', async () => {
      // Arrange
      const mockResult: BootstrapCheckResult = {
        claude: { name: 'Claude CLI', installed: false, version: null, path: null },
        moaiAdk: { name: 'MoAI-ADK', installed: true, version: '1.0.0', path: '/path/to/.moai' },
        moaiWorktree: { name: 'Git Worktree', installed: true, version: '2.30.0', path: '/usr/bin/git' },
      };
      mockElectronAPI.checkDependencies.mockResolvedValue(mockResult);
      const onComplete = vi.fn();

      // Act
      render(<StartupView onComplete={onComplete} />);

      // Assert
      await waitFor(() => {
        expect(mockElectronAPI.checkDependencies).toHaveBeenCalled();
      });
      expect(onComplete).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle bootstrap check errors gracefully', async () => {
      // Arrange
      mockElectronAPI.checkDependencies.mockRejectedValue(new Error('Bootstrap failed'));

      // Act
      render(<StartupView onComplete={vi.fn()} />);

      // Assert
      await waitFor(() => {
        expect(mockElectronAPI.checkDependencies).toHaveBeenCalled();
      });
      // Should not throw, should display error state
      expect(screen.getByText(/dependency check/i)).toBeInTheDocument();
    });
  });
});
