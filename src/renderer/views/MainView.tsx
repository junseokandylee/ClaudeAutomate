/**
 * MainView Component
 *
 * REQ-001: MainView Container
 * TAG-DESIGN-001: MainView Layout Design
 * TAG-FUNC-001: MainView Implementation
 *
 * Main application layout with terminal, SPEC list, and visualization panels.
 * Uses CSS Grid for responsive layout with proper component placement.
 *
 * Layout Structure:
 * - Top: Progress overview (spans full width)
 * - Middle Left (2 cols): Terminal component
 * - Middle Right (1 col): SpecList and WaveVisualization
 * - Bottom: StatusBar (spans full width)
 *
 * Responsive Behavior:
 * - Mobile: Single column, stacked vertically
 * - Desktop (lg+): 3 columns (2:1 ratio)
 */

import { useEffect } from 'react';
import { Terminal } from '@/renderer/components/Terminal';
import { SpecList } from '@/renderer/components/SpecList';
import { WaveVisualization } from '@/renderer/components/WaveVisualization';
import { ProgressOverview } from '@/renderer/components/ProgressOverview';
import { StatusBar } from '@/renderer/components/StatusBar';
import { useAppStore } from '@/renderer/stores/appStore';
import { cn } from '@/shared/lib/utils';

/**
 * MainView Component
 *
 * @example
 * ```tsx
 * function App() {
 *   return <MainView />;
 * }
 * ```
 */
export function MainView() {
  const currentView = useAppStore((state) => state.currentView);

  useEffect(() => {
    // Ensure we're in main view
    if (currentView !== 'main') {
      console.debug('MainView: Current view is', currentView);
    }
  }, [currentView]);

  return (
    <div
      data-testid="main-view"
      className={cn(
        // Grid layout
        'grid',
        // Responsive columns: mobile (1) -> desktop (3)
        'grid-cols-1',
        'lg:grid-cols-3',
        // Gap between grid items
        'gap-4',
        // Full height minus any margins
        'h-full',
        // Padding
        'p-4'
      )}
    >
      {/* Progress Overview - Top Full Width */}
      <div className="col-span-1 lg:col-span-3">
        <ProgressOverview />
      </div>

      {/* Left Panel - Terminal (2 columns) */}
      <div className="col-span-1 lg:col-span-2 flex flex-col gap-4">
        <Terminal />
      </div>

      {/* Right Panel - Spec List and Visualization (1 column) */}
      <div className="col-span-1 lg:col-span-1 flex flex-col gap-4">
        <SpecList />
        <WaveVisualization />
      </div>

      {/* Status Bar - Bottom Full Width */}
      <div className="col-span-1 lg:col-span-3">
        <StatusBar />
      </div>
    </div>
  );
}
