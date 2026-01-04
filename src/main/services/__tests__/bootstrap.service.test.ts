/**
 * Bootstrap Service Tests
 *
 * TAG-TEST-001: Bootstrap Service Test Suite
 *
 * Tests for bootstrap validation and dependency checking functionality.
 * Follows RED-GREEN-REFACTOR TDD methodology.
 *
 * REQ-003: Bootstrap Service
 * - Checks if 'claude' CLI is available (which claude / where claude)
 * - Checks if 'moai-adk' is installed
 * - Checks if 'moai-worktree' is available
 * - Returns version information for each installed tool
 * - Returns path information for each tool
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkBootstrap, type BootstrapCheckResult } from '../bootstrap.service';

// Mock child_process and fs modules at the top level before imports
vi.mock('child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('child_process')>();
  return {
    ...actual,
    execSync: vi.fn(),
  };
});

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    existsSync: vi.fn(),
  };
});

import { execSync } from 'child_process';
import { existsSync } from 'fs';

describe('Bootstrap Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('checkBootstrap', () => {
    it('should return all dependencies installed when all checks pass', async () => {
      // Arrange
      const mockClaudePath = '/usr/local/bin/claude';
      const mockClaudeVersion = 'claude 1.0.0';
      const mockGitPath = '/usr/local/bin/git';
      const mockGitVersion = 'git version 2.30.0';
      const mockWorktreeOutput = '/path/to/worktree';

      vi.mocked(execSync).mockImplementation((command: string) => {
        if (command.includes('which') || command.includes('where')) {
          if (command.includes('claude')) return Buffer.from(mockClaudePath);
          if (command.includes('git')) return Buffer.from(mockGitPath);
        }
        if (command.includes('claude --version')) {
          return Buffer.from(mockClaudeVersion);
        }
        if (command.includes('git --version')) {
          return Buffer.from(mockGitVersion);
        }
        if (command.includes('git worktree')) {
          return Buffer.from(mockWorktreeOutput);
        }
        return Buffer.from('');
      });

      vi.mocked(existsSync).mockReturnValue(true);

      // Act
      const result = await checkBootstrap();

      // Assert
      expect(result).toBeDefined();
      expect(result.claude.installed).toBe(true);
      expect(result.claude.version).toBe(mockClaudeVersion);
      expect(result.claude.path).toBe(mockClaudePath);
      expect(result.moaiAdk.installed).toBe(true);
      expect(result.moaiWorktree.installed).toBe(true);
      expect(result.moaiWorktree.version).toBe(mockGitVersion);
      expect(result.moaiWorktree.path).toBe(mockGitPath);
    });

    it('should return missing claude dependency when CLI is not found', async () => {
      // Arrange
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error('Command not found');
      });

      vi.mocked(existsSync).mockReturnValue(false);

      // Act
      const result = await checkBootstrap();

      // Assert
      expect(result.claude.installed).toBe(false);
      expect(result.claude.version).toBeNull();
      expect(result.claude.path).toBeNull();
    });

    it('should return missing moai-adk dependency when .moai directory does not exist', async () => {
      // Arrange
      vi.mocked(execSync).mockReturnValue(Buffer.from('output'));
      vi.mocked(existsSync).mockReturnValue(false);

      // Act
      const result = await checkBootstrap();

      // Assert
      expect(result.moaiAdk.installed).toBe(false);
      expect(result.moaiAdk.version).toBeNull();
      expect(result.moaiAdk.path).toBeNull();
    });

    it('should return missing git worktree dependency when git worktree fails', async () => {
      // Arrange
      vi.mocked(execSync).mockImplementation((command: string) => {
        if (command.includes('git worktree')) {
          throw new Error('git worktree not supported');
        }
        return Buffer.from('claude output');
      });

      vi.mocked(existsSync).mockReturnValue(true);

      // Act
      const result = await checkBootstrap();

      // Assert
      expect(result.moaiWorktree.installed).toBe(false);
      expect(result.moaiWorktree.version).toBeNull();
      expect(result.moaiWorktree.path).toBeNull();
    });

    it('should use platform-specific commands (Windows: where)', async () => {
      // Arrange
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        writable: true,
      });

      vi.mocked(execSync).mockReturnValue(Buffer.from('C:\\path\\to\\claude.exe'));
      vi.mocked(existsSync).mockReturnValue(true);

      // Act
      const result = await checkBootstrap();

      // Assert
      expect(vi.mocked(execSync)).toHaveBeenCalledWith(
        expect.stringContaining('where'),
        expect.any(Object)
      );

      // Cleanup
      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
        writable: true,
      });
    });

    it('should use platform-specific commands (Unix: which)', async () => {
      // Arrange
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        writable: true,
      });

      vi.mocked(execSync).mockReturnValue(Buffer.from('/usr/local/bin/claude'));
      vi.mocked(existsSync).mockReturnValue(true);

      // Act
      const result = await checkBootstrap();

      // Assert
      expect(vi.mocked(execSync)).toHaveBeenCalledWith(
        expect.stringContaining('which'),
        expect.any(Object)
      );

      // Cleanup
      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
        writable: true,
      });
    });

    it('should complete bootstrap check in under 3 seconds', async () => {
      // Arrange
      const startTime = Date.now();

      vi.mocked(execSync).mockReturnValue(Buffer.from('version output'));
      vi.mocked(existsSync).mockReturnValue(true);

      // Act
      await checkBootstrap();

      // Assert
      const endTime = Date.now();
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(3000);
    });
  });
});
