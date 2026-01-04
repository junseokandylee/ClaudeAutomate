/**
 * useProgress Hook
 *
 * REQ-006: useProgress Hook
 * TAG-DESIGN-006: useProgress Hook Design
 * TAG-FUNC-006: useProgress Implementation
 *
 * Custom React hook for progress calculation.
 * Calculates progress based on session states.
 *
 * Features:
 * - Calculate overall progress percentage
 * - Count completed/running/pending SPECs
 * - Estimate remaining time
 * - Subscribe to session store updates
 */

import { useMemo } from 'react';
import { useSessionStore } from '@/renderer/stores/sessionStore';
import type { SessionStatus } from '@/shared/types';

/**
 * useProgress return value
 */
export interface UseProgressReturn {
  /** Progress percentage (0-100) */
  percentage: number;
  /** Number of completed sessions */
  completed: number;
  /** Number of running sessions */
  running: number;
  /** Number of pending (idle) sessions */
  pending: number;
  /** Number of failed sessions */
  failed: number;
  /** Estimated remaining time in seconds (null if cannot estimate) */
  remainingTime: number | null;
}

/**
 * useProgress Hook
 *
 * Calculates progress based on session states.
 *
 * @example
 * ```tsx
 * function ProgressBar() {
 *   const { percentage, remainingTime } = useProgress();
 *
 *   return (
 *     <div>
 *       <div>Progress: {percentage}%</div>
 *       {remainingTime !== null && (
 *         <div>ETA: {remainingTime}s</div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useProgress(): UseProgressReturn {
  const sessions = useSessionStore((state) => state.sessions);
  const progress = useSessionStore((state) => state.progress);

  // Count sessions by status
  const statusCounts = useMemo(() => {
    const counts: Record<SessionStatus, number> = {
      idle: 0,
      running: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
    };

    sessions.forEach((session) => {
      counts[session.status]++;
    });

    return counts;
  }, [sessions]);

  // Calculate progress percentage
  const percentage = progress.percentage;

  // Estimate remaining time
  const remainingTime = useMemo(() => {
    const completedCount = statusCounts.completed;
    const totalCount = progress.total;

    // If no sessions completed, cannot estimate
    if (completedCount === 0) {
      return null;
    }

    // If all completed, return 0
    if (completedCount === totalCount && totalCount > 0) {
      return 0;
    }

    // Calculate average time per completed session
    let totalTime = 0;
    let validCount = 0;

    sessions.forEach((session) => {
      if (session.status === 'completed' && session.startedAt && session.completedAt) {
        const started = new Date(session.startedAt).getTime();
        const completed = new Date(session.completedAt).getTime();
        totalTime += completed - started;
        validCount++;
      }
    });

    if (validCount === 0) {
      return null;
    }

    const avgTimePerSession = totalTime / validCount;
    const remaining = totalCount - completedCount;

    return Math.ceil((avgTimePerSession * remaining) / 1000); // Convert to seconds
  }, [sessions, statusCounts.completed, progress.total]);

  return {
    percentage,
    completed: statusCounts.completed,
    running: statusCounts.running,
    pending: statusCounts.idle,
    failed: statusCounts.failed,
    remainingTime,
  };
}
