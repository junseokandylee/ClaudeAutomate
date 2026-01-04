/**
 * Bootstrap Service
 *
 * TAG-FUNC-001: Bootstrap Service Implementation
 *
 * REQ-003: Bootstrap Service
 * - Checks if 'claude' CLI is available (which claude / where claude)
 * - Checks if 'moai-adk' is installed
 * - Checks if 'moai-worktree' is available
 * - Returns version information for each installed tool
 * - Returns path information for each tool
 *
 * Technical Constraints:
 * - Bootstrap check runs on app startup
 * - Must work on Windows, macOS, and Linux
 * - Use child_process.exec for CLI checks
 * - Non-blocking async checks
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

/**
 * Dependency check result for a single dependency
 *
 * @property name - Human-readable name of the dependency
 * @property installed - Whether the dependency is installed
 * @property version - Version string if available
 * @property path - Absolute path to the executable
 */
export interface DependencyCheckResult {
  name: string;
  installed: boolean;
  version: string | null;
  path: string | null;
}

/**
 * Complete bootstrap check result
 *
 * @property claude - Claude CLI status
 * @property moaiAdk - MoAI-ADK framework status
 * @property moaiWorktree - Git worktree support status
 */
export interface BootstrapCheckResult {
  claude: DependencyCheckResult;
  moaiAdk: DependencyCheckResult;
  moaiWorktree: DependencyCheckResult;
}

/**
 * Check all bootstrap dependencies
 *
 * Performs async validation of all required dependencies for the application.
 * Returns detailed status information including version and path for each tool.
 *
 * @returns Promise resolving to bootstrap check results
 *
 * @example
 * ```typescript
 * const result = await checkBootstrap();
 * if (!result.claude.installed) {
 *   console.error('Claude CLI is required');
 * }
 * ```
 */
export async function checkBootstrap(): Promise<BootstrapCheckResult> {
  const [claude, moaiAdk, moaiWorktree] = await Promise.all([
    checkClaudeCLI(),
    checkMoaiAdk(),
    checkGitWorktree(),
  ]);

  return {
    claude,
    moaiAdk,
    moaiWorktree,
  };
}

/**
 * Check if Claude Code CLI is installed and accessible
 *
 * Uses platform-specific commands to detect CLI:
 * - Windows: 'where claude'
 * - macOS/Linux: 'which claude'
 *
 * @returns Promise resolving to dependency check result
 */
async function checkClaudeCLI(): Promise<DependencyCheckResult> {
  try {
    const isWindows = process.platform === 'win32';
    const command = isWindows ? 'where claude' : 'which claude';

    const output = execSync(command, {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });

    const path = output.trim().split('\n')[0];

    if (!path) {
      return {
        name: 'Claude CLI',
        installed: false,
        version: null,
        path: null,
      };
    }

    // Get version information
    let version: string | null = null;
    try {
      const versionOutput = execSync('claude --version', {
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      version = versionOutput.trim();
    } catch {
      version = null;
    }

    return {
      name: 'Claude CLI',
      installed: true,
      version,
      path,
    };
  } catch {
    return {
      name: 'Claude CLI',
      installed: false,
      version: null,
      path: null,
    };
  }
}

/**
 * Check if MoAI-ADK framework is installed in the project
 *
 * Checks for the existence of the .moai directory in the current working directory.
 *
 * @returns Promise resolving to dependency check result
 */
async function checkMoaiAdk(): Promise<DependencyCheckResult> {
  try {
    const moaiPath = join(process.cwd(), '.moai');
    const installed = existsSync(moaiPath);

    if (!installed) {
      return {
        name: 'MoAI-ADK',
        installed: false,
        version: null,
        path: null,
      };
    }

    // Try to read version from .moai/config.yaml or similar
    let version: string | null = null;
    try {
      const packageJsonPath = join(process.cwd(), 'package.json');
      const packageJson = require(packageJsonPath);
      const moaiVersion = packageJson.dependencies?.['moai-adk'];
      version = moaiVersion || null;
    } catch {
      version = null;
    }

    return {
      name: 'MoAI-ADK',
      installed: true,
      version,
      path: moaiPath,
    };
  } catch {
    return {
      name: 'MoAI-ADK',
      installed: false,
      version: null,
      path: null,
    };
  }
}

/**
 * Check if git worktree support is available
 *
 * Git worktree requires git version 2.5 or later.
 *
 * @returns Promise resolving to dependency check result
 */
async function checkGitWorktree(): Promise<DependencyCheckResult> {
  try {
    // Check git version
    const versionOutput = execSync('git --version', {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });

    const version = versionOutput.trim();

    // Check if worktree is supported
    execSync('git worktree list', {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });

    // Get git path
    let gitPath: string | null = null;
    try {
      const isWindows = process.platform === 'win32';
      const command = isWindows ? 'where git' : 'which git';
      const pathOutput = execSync(command, {
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      gitPath = pathOutput.trim().split('\n')[0];
    } catch {
      gitPath = null;
    }

    return {
      name: 'Git Worktree',
      installed: true,
      version,
      path: gitPath,
    };
  } catch {
    return {
      name: 'Git Worktree',
      installed: false,
      version: null,
      path: null,
    };
  }
}
