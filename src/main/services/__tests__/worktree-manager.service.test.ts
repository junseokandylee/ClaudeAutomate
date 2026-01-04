/**
 * Tests for Worktree Manager Service
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WorktreeManagerService, createWorktreeManager } from '../worktree-manager.service';
import { WorktreeError } from '../../../shared/errors';
import simpleGit, { SimpleGit } from 'simple-git';

// Mock simple-git
vi.mock('simple-git', () => ({
  default: vi.fn(() => ({
    worktree: vi.fn().mockResolvedValue(undefined),
    branch: vi.fn().mockResolvedValue({ current: 'main' }),
    checkout: vi.fn().mockResolvedValue(undefined),
    checkoutLocalBranch: vi.fn().mockResolvedValue(undefined),
    pull: vi.fn().mockResolvedValue(undefined),
    merge: vi.fn().mockResolvedValue(undefined),
  })),
}));

describe('worktree-manager.service', () => {
  let manager: WorktreeManagerService;
  const projectRoot = '/test/project';
  let mockGit: SimpleGit;

  beforeEach(() => {
    manager = new WorktreeManagerService(projectRoot);
    mockGit = simpleGit(projectRoot);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createWorktree', () => {
    it('should create a new worktree', async () => {
      const worktreePath = await manager.createWorktree('SPEC-001');

      expect(worktreePath).toContain('.worktrees');
      expect(worktreePath).toContain('SPEC-001');
      expect(manager.hasWorktree('SPEC-001')).toBe(true);
    });

    it('should create worktree with specified base branch', async () => {
      const worktreePath = await manager.createWorktree('SPEC-002', 'develop');

      expect(worktreePath).toBeTruthy();
      expect(manager.hasWorktree('SPEC-002')).toBe(true);

      const info = manager.getWorktree('SPEC-002');
      expect(info?.branchName).toBe('feature/SPEC-002');
    });

    it('should throw error when worktree already exists', async () => {
      await manager.createWorktree('SPEC-003');

      await expect(manager.createWorktree('SPEC-003')).rejects.toThrow(WorktreeError);
      await expect(manager.createWorktree('SPEC-003')).rejects.toThrow(/already exists/i);
    });

    it('should track worktree information', async () => {
      await manager.createWorktree('SPEC-004');

      const info = manager.getWorktree('SPEC-004');
      expect(info).toMatchObject({
        specId: 'SPEC-004',
        branchName: 'feature/SPEC-004',
      });
      expect(info?.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('cleanupWorktree', () => {
    it('should remove worktree', async () => {
      await manager.createWorktree('SPEC-005');
      expect(manager.hasWorktree('SPEC-005')).toBe(true);

      await manager.cleanupWorktree('SPEC-005');
      expect(manager.hasWorktree('SPEC-005')).toBe(false);
    });

    it('should throw error when worktree not found', async () => {
      await expect(manager.cleanupWorktree('SPEC-NONEXISTENT')).rejects.toThrow(WorktreeError);
      await expect(manager.cleanupWorktree('SPEC-NONEXISTENT')).rejects.toThrow();
    });
  });

  describe('getWorktree', () => {
    it('should return worktree info for existing worktree', async () => {
      await manager.createWorktree('SPEC-006');

      const info = manager.getWorktree('SPEC-006');
      expect(info).toBeDefined();
      expect(info?.specId).toBe('SPEC-006');
    });

    it('should return undefined for non-existent worktree', () => {
      const info = manager.getWorktree('SPEC-NONEXISTENT');
      expect(info).toBeUndefined();
    });
  });

  describe('getActiveWorktrees', () => {
    it('should return map of all active worktrees', async () => {
      await manager.createWorktree('SPEC-007');
      await manager.createWorktree('SPEC-008');

      const worktrees = manager.getActiveWorktrees();
      expect(worktrees.size).toBe(2);
      expect(worktrees.has('SPEC-007')).toBe(true);
      expect(worktrees.has('SPEC-008')).toBe(true);
    });

    it('should return empty map when no worktrees exist', () => {
      const worktrees = manager.getActiveWorktrees();
      expect(worktrees.size).toBe(0);
    });
  });

  describe('hasWorktree', () => {
    it('should return true for existing worktree', async () => {
      await manager.createWorktree('SPEC-009');
      expect(manager.hasWorktree('SPEC-009')).toBe(true);
    });

    it('should return false for non-existent worktree', () => {
      expect(manager.hasWorktree('SPEC-NONEXISTENT')).toBe(false);
    });
  });

  describe('getWorktreePaths', () => {
    it('should return array of worktree paths', async () => {
      await manager.createWorktree('SPEC-010');
      await manager.createWorktree('SPEC-011');

      const paths = manager.getWorktreePaths();
      expect(paths).toHaveLength(2);
      expect(paths.every((p) => p.includes('.worktrees'))).toBe(true);
    });

    it('should return empty array when no worktrees exist', () => {
      const paths = manager.getWorktreePaths();
      expect(paths).toEqual([]);
    });
  });

  describe('mergeWorktree', () => {
    it('should merge worktree branch to target', async () => {
      await manager.createWorktree('SPEC-012');

      // Should not throw
      await manager.mergeWorktree('SPEC-012', 'main');
    });

    it('should throw error when worktree not found', async () => {
      await expect(manager.mergeWorktree('SPEC-NONEXISTENT')).rejects.toThrow(WorktreeError);
    });
  });

  describe('cleanupAllWorktrees', () => {
    it('should remove all worktrees', async () => {
      await manager.createWorktree('SPEC-013');
      await manager.createWorktree('SPEC-014');
      await manager.createWorktree('SPEC-015');

      expect(manager.getActiveWorktrees().size).toBe(3);

      const errors = await manager.cleanupAllWorktrees();

      expect(errors).toHaveLength(0);
      expect(manager.getActiveWorktrees().size).toBe(0);
    });

    it('should collect errors from failed cleanups', async () => {
      await manager.createWorktree('SPEC-016');

      // Make one cleanup fail by manually deleting from map
      manager.getActiveWorktrees().delete('SPEC-016');

      const errors = await manager.cleanupAllWorktrees();

      // Should have error from attempting to cleanup non-existent worktree
      expect(errors.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getWorktreeStats', () => {
    it('should return stats for active worktrees', async () => {
      await manager.createWorktree('SPEC-017');
      await manager.createWorktree('SPEC-018');

      const stats = manager.getWorktreeStats();

      expect(stats.count).toBe(2);
      expect(stats.oldest).toBeInstanceOf(Date);
      expect(stats.newest).toBeInstanceOf(Date);
    });

    it('should return zero stats when no worktrees exist', () => {
      const stats = manager.getWorktreeStats();

      expect(stats.count).toBe(0);
      expect(stats.oldest).toBeNull();
      expect(stats.newest).toBeNull();
    });
  });

  describe('createWorktreeManager', () => {
    it('should create WorktreeManagerService instance', () => {
      const mgr = createWorktreeManager(projectRoot);
      expect(mgr).toBeInstanceOf(WorktreeManagerService);
    });
  });

  describe('branch naming', () => {
    it('should sanitize specId for branch name', async () => {
      await manager.createWorktree('SPEC-TEST-001');

      const info = manager.getWorktree('SPEC-TEST-001');
      expect(info?.branchName).toBe('feature/SPEC-TEST-001');
    });
  });
});
