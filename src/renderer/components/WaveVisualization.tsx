/**
 * WaveVisualization Component
 *
 * REQ-004: WaveVisualization Component
 * TAG-DESIGN-004: WaveVisualization Design
 * TAG-FUNC-004: WaveVisualization Implementation
 *
 * Displays execution waves graphically with animations.
 * Features:
 * - Visual wave representation
 * - Dependency graph display
 * - Framer Motion animations
 * - Status highlighting (completed/active/pending)
 *
 * @example
 * ```tsx
 * function MainView() {
 *   return <WaveVisualization />;
 * }
 * ```
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/renderer/components/Card';
import { cn } from '@/shared/lib/utils';

/**
 * Wave data interface
 */
interface Wave {
  id: number;
  specs: string[];
  status: 'pending' | 'active' | 'completed';
}

/**
 * WaveVisualization Component
 */
export function WaveVisualization() {
  const [waves, setWaves] = useState<Wave[]>([]);

  // TODO: Load waves from execution plan
  // This will be integrated with the execution manager

  const getWaveColor = (status: Wave['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-500/30 border-gray-500/50';
      case 'active':
        return 'bg-[#D97757]/30 border-[#D97757] animate-pulse';
      case 'completed':
        return 'bg-green-500/30 border-green-500';
      default:
        return 'bg-gray-500/30 border-gray-500/50';
    }
  };

  return (
    <div
      data-testid="wave-visualization"
      className={cn(
        'wave-visualization',
        'flex flex-col gap-2',
        'h-full'
      )}
    >
      {/* Header */}
      <h3 className="text-lg font-semibold">Execution Waves</h3>

      {/* Waves Display */}
      <div className="flex-1 overflow-y-auto">
        {waves.length === 0 ? (
          <Card padding="md">
            <p className="text-center text-muted-foreground">
              No waves to display
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {waves.map((wave, index) => (
              <motion.div
                key={wave.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  padding="sm"
                  className={cn(
                    'border-2',
                    getWaveColor(wave.status)
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        Wave {wave.id}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {wave.specs.length} SPECs
                      </p>
                    </div>
                    <div className="text-xs uppercase font-semibold">
                      {wave.status}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
