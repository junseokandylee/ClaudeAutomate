/**
 * DependencyCheck Component Tests
 *
 * TAG-TEST-002: DependencyCheck Component Test Suite
 *
 * Tests for DependencyCheck component following TDD methodology.
 *
 * REQ-002: DependencyCheck Component
 * - Displays three dependency items (Claude, moai-adk, moai-worktree)
 * - Shows checking/installed/missing status for each
 * - Uses icons and colors to indicate status
 * - Provides installation guidance for missing dependencies
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DependencyCheck } from '../DependencyCheck';
import type { BootstrapCheckResult } from '@shared/types';

// Mock electronAPI
const mockElectronAPI = {
  checkDependencies: vi.fn(),
  onBootstrapProgress: vi.fn(),
  getConfig: vi.fn(),
  setConfig: vi.fn(),
};

global.window.electronAPI = mockElectronAPI as any;

describe('DependencyCheck Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should render loading state when checking', () => {
      // Arrange
      const mockResult: BootstrapCheckResult = {
        claude: { name: 'Claude CLI', installed: false, version: null, path: null },
        moaiAdk: { name: 'MoAI-ADK', installed: false, version: null, path: null },
        moaiWorktree: { name: 'Git Worktree', installed: false, version: null, path: null },
      };

      // Act
      render(<DependencyCheck result={null} loading={true} />);

      // Assert
      expect(screen.getByText(/checking dependencies/i)).toBeInTheDocument();
    });

    it('should display all three dependency items', () => {
      // Arrange
      const mockResult: BootstrapCheckResult = {
        claude: { name: 'Claude CLI', installed: false, version: null, path: null },
        moaiAdk: { name: 'MoAI-ADK', installed: false, version: null, path: null },
        moaiWorktree: { name: 'Git Worktree', installed: false, version: null, path: null },
      };

      // Act
      render(<DependencyCheck result={mockResult} loading={false} />);

      // Assert
      expect(screen.getByText('Claude CLI')).toBeInTheDocument();
      expect(screen.getByText('MoAI-ADK')).toBeInTheDocument();
      expect(screen.getByText('Git Worktree')).toBeInTheDocument();
    });
  });

  describe('Status Display', () => {
    it('should show green checkmark for installed dependencies', () => {
      // Arrange
      const mockResult: BootstrapCheckResult = {
        claude: { name: 'Claude CLI', installed: true, version: '1.0.0', path: '/usr/local/bin/claude' },
        moaiAdk: { name: 'MoAI-ADK', installed: false, version: null, path: null },
        moaiWorktree: { name: 'Git Worktree', installed: false, version: null, path: null },
      };

      // Act
      render(<DependencyCheck result={mockResult} loading={false} />);

      // Assert
      const claudeStatus = screen.getByTestId('claude-status');
      expect(claudeStatus).toHaveClass('text-emerald-500');
    });

    it('should show red X icon for missing dependencies', () => {
      // Arrange
      const mockResult: BootstrapCheckResult = {
        claude: { name: 'Claude CLI', installed: false, version: null, path: null },
        moaiAdk: { name: 'MoAI-ADK', installed: false, version: null, path: null },
        moaiWorktree: { name: 'Git Worktree', installed: false, version: null, path: null },
      };

      // Act
      render(<DependencyCheck result={mockResult} loading={false} />);

      // Assert
      const claudeStatus = screen.getByTestId('claude-status');
      expect(claudeStatus).toHaveClass('text-red-500');
    });

    it('should display version number when installed', () => {
      // Arrange
      const mockResult: BootstrapCheckResult = {
        claude: { name: 'Claude CLI', installed: true, version: '1.0.0', path: '/usr/local/bin/claude' },
        moaiAdk: { name: 'MoAI-ADK', installed: false, version: null, path: null },
        moaiWorktree: { name: 'Git Worktree', installed: false, version: null, path: null },
      };

      // Act
      render(<DependencyCheck result={mockResult} loading={false} />);

      // Assert
      expect(screen.getByText('1.0.0')).toBeInTheDocument();
    });
  });

  describe('Installation Guidance', () => {
    it('should show installation instructions for missing dependencies', () => {
      // Arrange
      const mockResult: BootstrapCheckResult = {
        claude: { name: 'Claude CLI', installed: false, version: null, path: null },
        moaiAdk: { name: 'MoAI-ADK', installed: false, version: null, path: null },
        moaiWorktree: { name: 'Git Worktree', installed: false, version: null, path: null },
      };

      // Act
      render(<DependencyCheck result={mockResult} loading={false} />);

      // Assert
      expect(screen.getByText(/installation required/i)).toBeInTheDocument();
    });

    it('should show retry button when dependencies are missing', () => {
      // Arrange
      const mockResult: BootstrapCheckResult = {
        claude: { name: 'Claude CLI', installed: false, version: null, path: null },
        moaiAdk: { name: 'MoAI-ADK', installed: false, version: null, path: null },
        moaiWorktree: { name: 'Git Worktree', installed: false, version: null, path: null },
      };
      const onRetry = vi.fn();

      // Act
      render(<DependencyCheck result={mockResult} loading={false} onRetry={onRetry} />);

      // Assert
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('should call onRetry when retry button is clicked', () => {
      // Arrange
      const mockResult: BootstrapCheckResult = {
        claude: { name: 'Claude CLI', installed: false, version: null, path: null },
        moaiAdk: { name: 'MoAI-ADK', installed: false, version: null, path: null },
        moaiWorktree: { name: 'Git Worktree', installed: false, version: null, path: null },
      };
      const onRetry = vi.fn();

      // Act
      render(<DependencyCheck result={mockResult} loading={false} onRetry={onRetry} />);
      const retryButton = screen.getByRole('button', { name: /retry/i });
      retryButton.click();

      // Assert
      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });
});
