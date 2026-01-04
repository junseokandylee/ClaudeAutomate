/**
 * Worktree Manager Service
 *
 * Manages git worktrees for parallel SPEC execution.
 * Creates, tracks, and cleans up worktrees using git commands.
 *
 * @module worktree-manager.service
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import simpleGit, { SimpleGit } from 'simple-git';
import { WorktreeError } from '../../shared/errors';

const execAsync = promisify(exec);

/**
 * Worktree information
 */
export interface WorktreeInfo {
  specId: string;
  worktreePath: string;
  branchName: string;
  createdAt: Date;
}

/**
 * Worktree Manager Service
 *
 * Manages lifecycle of git worktrees for isolated SPEC execution.
 */
export class WorktreeManagerService {
  private activeWorktrees = new Map<string, WorktreeInfo>();
  private git: SimpleGit;

  constructor(projectRoot: string) {
    this.git = simpleGit(projectRoot);
  }

  /**
   * Create a new worktree for a SPEC
   *
   * Creates a git worktree with a branch named after the SPEC.
   * The worktree is created in .worktrees/{SPEC-ID}/ directory.
   *
   * @param specId - SPEC identifier (e.g., 'SPEC-001')
   * @param baseBranch - Base branch to create worktree from (default: current branch)
   * @returns Path to the created worktree
   *
   * @throws {WorktreeError} If worktree creation fails
   *
   * @example
   * ```typescript
   * const manager = new WorktreeManagerService('/project');
   * const worktreePath = await manager.createWorktree('SPEC-001', 'main');
   * console.log(`Worktree created at ${worktreePath}`);
   * ```
   */
  async createWorktree(
    specId: string,
    baseBranch?: string
  ): Promise<string> {
    // Check if worktree already exists
    if (this.activeWorktrees.has(specId)) {
      throw new WorktreeError(
        'WORKTREE_ALREADY_EXISTS' as const,
        `Worktree for ${specId} already exists`,
        { specId }
      );
    }

    // Sanitize specId for branch name
    const branchName = `feature/${specId}`;
    const worktreePath = path.join('.worktrees', specId);

    try {
      // Get current branch if baseBranch not specified
      const branch = baseBranch || (await this.git.branch()).current;

      // Create worktree using git
      await this.git.worktree(['add', worktreePath, branch]);

      // Create and checkout feature branch
      const worktreeGit = simpleGit(worktreePath);
      await worktreeGit.checkoutLocalBranch(branchName);

      // Track the worktree
      const worktreeInfo: WorktreeInfo = {
        specId,
        worktreePath: path.resolve(worktreePath),
        branchName,
        createdAt: new Date(),
      };

      this.activeWorktrees.set(specId, worktreeInfo);

      return worktreeInfo.worktreePath;
    } catch (error) {
      throw new WorktreeError(
        'WORKTREE_CREATE_FAILED' as const,
        `Failed to create worktree for ${specId}`,
        {
          specId,
          reason: error instanceof Error ? error.message : String(error),
        }
      );
    }
  }

  /**
   * Clean up a worktree after SPEC completion
   *
   * Removes the worktree from git and deletes the directory.
   *
   * @param specId - SPEC identifier
   *
   * @throws {WorktreeError} If cleanup fails
   *
   * @example
   * ```typescript
   * await manager.cleanupWorktree('SPEC-001');
   * console.log('Worktree cleaned up');
   * ```
   */
  async cleanupWorktree(specId: string): Promise<void> {
    const worktreeInfo = this.activeWorktrees.get(specId);

    if (!worktreeInfo) {
      throw new WorktreeError(
        'WORKTREE_NOT_FOUND' as const,
        `No worktree found for ${specId}`,
        { specId }
      );
    }

    try {
      // Remove worktree using git
      await this.git.worktree(['remove', worktreeInfo.worktreePath]);

      // Remove from tracking
      this.activeWorktrees.delete(specId);
    } catch (error) {
      throw new WorktreeError(
        'WORKTREE_REMOVE_FAILED' as const,
        `Failed to remove worktree for ${specId}`,
        {
          specId,
          reason: error instanceof Error ? error.message : String(error),
        }
      );
    }
  }

  /**
   * Get worktree information by SPEC ID
   *
   * @param specId - SPEC identifier
   * @returns WorktreeInfo if found, undefined otherwise
   */
  getWorktree(specId: string): WorktreeInfo | undefined {
    return this.activeWorktrees.get(specId);
  }

  /**
   * Get all active worktrees
   *
   * @returns Map of specId to WorktreeInfo
   */
  getActiveWorktrees(): Map<string, WorktreeInfo> {
    return new Map(this.activeWorktrees);
  }

  /**
   * Check if a worktree exists for a SPEC
   *
   * @param specId - SPEC identifier
   * @returns True if worktree exists
   */
  hasWorktree(specId: string): boolean {
    return this.activeWorktrees.has(specId);
  }

  /**
   * Get list of all worktree paths
   *
   * @returns Array of worktree paths
   */
  getWorktreePaths(): string[] {
    return Array.from(this.activeWorktrees.values()).map(
      (info) => info.worktreePath
    );
  }

  /**
   * Merge worktree branch back to base branch
   *
   * Switches to base branch, merges the worktree branch, and returns to original branch.
   *
   * @param specId - SPEC identifier
   * @param targetBranch - Target branch to merge into (default: current branch)
   *
   * @throws {WorktreeError} If merge fails or has conflicts
   *
   * @example
   * ```typescript
   * await manager.mergeWorktree('SPEC-001', 'main');
   * console.log('Merged successfully');
   * ```
   */
  async mergeWorktree(specId: string, targetBranch?: string): Promise<void> {
    const worktreeInfo = this.activeWorktrees.get(specId);

    if (!worktreeInfo) {
      throw new WorktreeError(
        'WORKTREE_NOT_FOUND' as const,
        `No worktree found for ${specId}`,
        { specId }
      );
    }

    try {
      // Get current branch
      const currentBranch = (await this.git.branch()).current;
      const mergeTarget = targetBranch || currentBranch;

      // Switch to target branch
      await this.git.checkout(mergeTarget);

      // Pull latest changes
      await this.git.pull();

      // Merge worktree branch
      try {
        await this.git.merge([`origin/${worktreeInfo.branchName}`]);
      } catch (mergeError) {
        // Revert if merge fails
        await this.git.checkout(currentBranch);
        throw new WorktreeError(
          'WORKTREE_CREATE_FAILED' as const,
          `Merge conflict when merging ${specId}`,
          {
            specId,
            reason: mergeError instanceof Error ? mergeError.message : String(mergeError),
          }
        );
      }

      // Return to original branch
      await this.git.checkout(currentBranch);
    } catch (error) {
      if (error instanceof WorktreeError) {
        throw error;
      }

      throw new WorktreeError(
        'WORKTREE_CREATE_FAILED' as const,
        `Failed to merge worktree for ${specId}`,
        {
          specId,
          reason: error instanceof Error ? error.message : String(error),
        }
      );
    }
  }

  /**
   * Clean up all worktrees
   *
   * Removes all active worktrees. Useful for shutdown or reset scenarios.
   *
   * @returns Array of errors for any failed cleanups
   */
  async cleanupAllWorktrees(): Promise<string[]> {
    const errors: string[] = [];
    const specIds = Array.from(this.activeWorktrees.keys());

    for (const specId of specIds) {
      try {
        await this.cleanupWorktree(specId);
      } catch (error) {
        errors.push(
          `Failed to cleanup ${specId}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    return errors;
  }

  /**
   * Get worktree statistics
   *
   * @returns Object with worktree count and total size
   */
  getWorktreeStats(): {
    count: number;
    oldest: Date | null;
    newest: Date | null;
  } {
    const worktrees = Array.from(this.activeWorktrees.values());

    if (worktrees.length === 0) {
      return {
        count: 0,
        oldest: null,
        newest: null,
      };
    }

    const createdAt = worktrees.map((w) => w.createdAt);

    return {
      count: worktrees.length,
      oldest: new Date(Math.min(...createdAt.map((d) => d.getTime()))),
      newest: new Date(Math.max(...createdAt.map((d) => d.getTime()))),
    };
  }
}

/**
 * Create a worktree manager instance
 *
 * Factory function for creating WorktreeManagerService.
 *
 * @param projectRoot - Root directory of the project
 * @returns WorktreeManagerService instance
 *
 * @example
 * ```typescript
 * const manager = createWorktreeManager('/home/user/project');
 * await manager.createWorktree('SPEC-001');
 * ```
 */
export function createWorktreeManager(
  projectRoot: string
): WorktreeManagerService {
  return new WorktreeManagerService(projectRoot);
}
