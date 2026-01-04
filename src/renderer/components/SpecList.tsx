/**
 * SpecList Component
 *
 * REQ-003: SpecList Component
 * TAG-DESIGN-003: SpecList Component Design
 * TAG-FUNC-003: SpecList Implementation
 *
 * Displays list of discovered SPECs with status indicators.
 * Features:
 * - List view with status indicators
 * - Filtering and sorting capabilities
 * - Real-time updates via IPC
 * - SPEC selection for details
 *
 * @example
 * ```tsx
 * function MainView() {
 *   return <SpecList />;
 * }
 * ```
 */

import { useState, useEffect } from 'react';
import { Card } from '@/renderer/components/Card';
import { cn } from '@/shared/lib/utils';

/**
 * SPEC status type
 */
type SpecStatus = 'pending' | 'running' | 'completed' | 'failed';

/**
 * SPEC info interface
 */
interface SpecInfo {
  id: string;
  title: string;
  status: SpecStatus;
}

/**
 * SpecList Component
 */
export function SpecList() {
  const [specs, setSpecs] = useState<SpecInfo[]>([]);
  const [filter, setFilter] = useState<'all' | SpecStatus>('all');

  useEffect(() => {
    // Load specs on mount
    loadSpecs();

    // Register for real-time updates
    const cleanup = window.electronAPI.onSpecStatus((event, data) => {
      setSpecs((prev) =>
        prev.map((spec) =>
          spec.id === data.specId
            ? { ...spec, status: data.status }
            : spec
        )
      );
    });

    return cleanup;
  }, []);

  const loadSpecs = async () => {
    try {
      const scannedSpecs = await window.electronAPI.scanSpecs(
        process.cwd() || '.'
      );
      setSpecs(scannedSpecs);
    } catch (error) {
      console.error('Failed to load specs:', error);
    }
  };

  const filteredSpecs =
    filter === 'all' ? specs : specs.filter((spec) => spec.status === filter);

  const getStatusColor = (status: SpecStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-500';
      case 'running':
        return 'bg-blue-500 animate-pulse';
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div
      data-testid="spec-list"
      className={cn(
        'spec-list',
        'flex flex-col gap-2',
        'h-full max-h-[400px]'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">SPEC List</h3>
        <select
          value={filter}
          onChange={(e) =>
            setFilter(e.target.value as 'all' | SpecStatus)
          }
          className="px-2 py-1 text-sm rounded bg-white/10 border border-white/20"
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="running">Running</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Spec List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {filteredSpecs.length === 0 ? (
          <Card padding="md">
            <p className="text-center text-muted-foreground">
              No specs found
            </p>
          </Card>
        ) : (
          filteredSpecs.map((spec) => (
            <Card key={spec.id} padding="sm" hover="lift">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'w-3 h-3 rounded-full',
                    getStatusColor(spec.status)
                  )}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">{spec.id}</p>
                  <p className="text-xs text-muted-foreground">
                    {spec.title}
                  </p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
