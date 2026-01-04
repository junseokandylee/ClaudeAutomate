/**
 * ProgressOverview Component
 *
 * REQ-005: ProgressOverview Component
 * TAG-DESIGN-005: ProgressOverview Design
 * TAG-FUNC-005: ProgressOverview Implementation
 *
 * Shows overall execution progress with statistics.
 * Features:
 * - Progress bar with percentage
 * - Completed/running/pending counts
 * - Estimated time remaining
 * - Success/failure statistics
 *
 * @example
 * ```tsx
 * function MainView() {
 *   return <ProgressOverview />;
 * }
 * ```
 */

import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/renderer/components/Card';
import { Progress } from '@/renderer/components/Progress';
import { cn } from '@/shared/lib/utils';

/**
 * Session stats interface
 */
interface SessionStats {
  completed: number;
  running: number;
  pending: number;
  failed: number;
  total: number;
}

/**
 * ProgressOverview Component
 */
export function ProgressOverview() {
  const [stats, setStats] = useState<SessionStats>({
    completed: 0,
    running: 0,
    pending: 0,
    failed: 0,
    total: 0,
  });

  useEffect(() => {
    // Register for session updates
    const cleanup = window.electronAPI.onSessionUpdate((event, sessions) => {
      const newStats: SessionStats = {
        completed: sessions.filter((s: any) => s.status === 'completed').length,
        running: sessions.filter((s: any) => s.status === 'running').length,
        pending: sessions.filter((s: any) => s.status === 'pending').length,
        failed: sessions.filter((s: any) => s.status === 'failed').length,
        total: sessions.length,
      };
      setStats(newStats);
    });

    return cleanup;
  }, []);

  const progressPercentage = useMemo(() => {
    if (stats.total === 0) return 0;
    return Math.round(((stats.completed + stats.failed) / stats.total) * 100);
  }, [stats]);

  const successRate = useMemo(() => {
    const finished = stats.completed + stats.failed;
    if (finished === 0) return 0;
    return Math.round((stats.completed / finished) * 100);
  }, [stats]);

  return (
    <div
      data-testid="progress-overview"
      className={cn(
        'progress-overview',
        'flex flex-col gap-4'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Execution Progress</h3>
        <div className="text-sm text-muted-foreground">
          {progressPercentage}% Complete
        </div>
      </div>

      {/* Progress Bar */}
      <Progress value={progressPercentage} showLabel color="anthropic" />

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Completed */}
        <Card padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-500">
              {stats.completed}
            </p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
        </Card>

        {/* Running */}
        <Card padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-500 animate-pulse">
              {stats.running}
            </p>
            <p className="text-xs text-muted-foreground">Running</p>
          </div>
        </Card>

        {/* Pending */}
        <Card padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-500">
              {stats.pending}
            </p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
        </Card>

        {/* Failed */}
        <Card padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-red-500">
              {stats.failed}
            </p>
            <p className="text-xs text-muted-foreground">Failed</p>
          </div>
        </Card>

        {/* Total */}
        <Card padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold">
              {stats.total}
            </p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
        </Card>
      </div>

      {/* Success Rate */}
      {stats.total > 0 && (
        <div className="text-center text-sm">
          <span className="text-muted-foreground">Success Rate: </span>
          <span className={cn(
            'font-semibold',
            successRate >= 80 ? 'text-green-500' :
            successRate >= 50 ? 'text-yellow-500' :
            'text-red-500'
          )}>
            {successRate}%
          </span>
        </div>
      )}
    </div>
  );
}
