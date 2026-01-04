/**
 * DependencyCheck Component
 *
 * TAG-FUNC-003: DependencyCheck Component Implementation
 *
 * REQ-002: DependencyCheck Component
 * - Displays three dependency items (Claude, moai-adk, moai-worktree)
 * - Shows checking/installed/missing status for each
 * - Uses icons and colors to indicate status
 * - Provides installation guidance for missing dependencies
 *
 * REQ-005: Status Display
 * - Spinner animation for "checking" state
 * - Green checkmark for "installed" state
 * - Red X icon for "missing" state
 * - Version number when installed
 *
 * REQ-006: Installation Guidance
 * - Display installation instructions
 * - Provide clickable links to documentation
 * - Show platform-specific commands
 * - Allow retry after installation
 */

import { motion } from 'framer-motion';
import { Card } from './Card';
import { Button } from './Button';
import { Progress } from './Progress';
import type { BootstrapCheckResult } from '@shared/types';

export interface DependencyCheckProps {
  /** Bootstrap check result (null if not yet checked) */
  result: BootstrapCheckResult | null;
  /** Whether dependencies are currently being checked */
  loading?: boolean;
  /** Callback when user clicks retry button */
  onRetry?: () => void;
}

/**
 * DependencyCheck Component
 *
 * Displays the status of all required dependencies with visual indicators
 * and installation guidance when needed.
 *
 * @example
 * ```tsx
 * <DependencyCheck
 *   result={bootstrapResult}
 *   loading={isChecking}
 *   onRetry={() => checkDependencies()}
 * />
 * ```
 */
export const DependencyCheck: React.FC<DependencyCheckProps> = ({
  result,
  loading = false,
  onRetry,
}) => {
  const hasAllDependencies = result
    ? result.claude.installed && result.moaiAdk.installed && result.moaiWorktree.installed
    : false;

  const hasMissingDependencies = result && !hasAllDependencies;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">Dependency Check</h2>
        <p className="text-muted-foreground">
          Verifying required dependencies for ClaudeParallelRunner
        </p>
      </div>

      {/* Loading State */}
      {loading && !result && (
        <Card>
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Progress value={undefined} color="anthropic" />
            <p className="text-sm text-muted-foreground">Checking dependencies...</p>
          </div>
        </Card>
      )}

      {/* Dependency Status Cards */}
      {result && (
        <div className="space-y-4">
          {/* Claude CLI */}
          <DependencyCard
            name={result.claude.name}
            installed={result.claude.installed}
            version={result.claude.version}
            path={result.claude.path}
            testId="claude-status"
          />

          {/* MoAI-ADK */}
          <DependencyCard
            name={result.moaiAdk.name}
            installed={result.moaiAdk.installed}
            version={result.moaiAdk.version}
            path={result.moaiAdk.path}
            testId="moai-adk-status"
          />

          {/* Git Worktree */}
          <DependencyCard
            name={result.moaiWorktree.name}
            installed={result.moaiWorktree.installed}
            version={result.moaiWorktree.version}
            path={result.moaiWorktree.path}
            testId="git-worktree-status"
          />
        </div>
      )}

      {/* Installation Guidance */}
      {hasMissingDependencies && (
        <Card>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-red-500">Installation Required</h3>
            <p className="text-sm text-muted-foreground">
              Some dependencies are missing. Please install them and click Retry.
            </p>

            <div className="space-y-3 text-sm">
              {!result.claude.installed && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
                  <p className="font-medium mb-2">Claude CLI Not Found</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Install Claude Code CLI from the official repository
                  </p>
                  <code className="text-xs bg-background px-2 py-1 rounded">
                    npm install -g @anthropic-ai/claude-code
                  </code>
                </div>
              )}

              {!result.moaiAdk.installed && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
                  <p className="font-medium mb-2">MoAI-ADK Not Found</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Initialize MoAI-ADK in your project directory
                  </p>
                  <code className="text-xs bg-background px-2 py-1 rounded">
                    npx moai-adk init
                  </code>
                </div>
              )}

              {!result.moaiWorktree.installed && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
                  <p className="font-medium mb-2">Git Worktree Not Supported</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Upgrade Git to version 2.5 or later
                  </p>
                  <code className="text-xs bg-background px-2 py-1 rounded">
                    git --version
                  </code>
                </div>
              )}
            </div>

            {onRetry && (
              <Button onClick={onRetry} variant="primary" fullWidth>
                Retry Check
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* All Dependencies Installed */}
      {hasAllDependencies && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800"
        >
          <p className="text-emerald-700 dark:text-emerald-300 font-medium">
            ✓ All dependencies are installed and ready!
          </p>
        </motion.div>
      )}
    </div>
  );
};

interface DependencyCardProps {
  name: string;
  installed: boolean;
  version: string | null;
  path: string | null;
  testId: string;
}

const DependencyCard: React.FC<DependencyCardProps> = ({
  name,
  installed,
  version,
  path,
  testId,
}) => {
  return (
    <Card padding="md" hover="none">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h4 className="font-medium">{name}</h4>
          {installed && version && (
            <p className="text-sm text-muted-foreground">{version}</p>
          )}
          {installed && path && (
            <p className="text-xs text-muted-foreground mt-1">{path}</p>
          )}
        </div>

        <div data-testid={testId}>
          {installed ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-emerald-500"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-red-500"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </motion.div>
          )}
        </div>
      </div>
    </Card>
  );
};
