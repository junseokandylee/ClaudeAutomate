/**
 * Progress Component
 *
 * Linear progress bar with indeterminate state and animations.
 * Follows shadcn/ui patterns with Tailwind CSS and Framer Motion.
 *
 * TAG-DESIGN-004: Progress Component Design
 * TAG-FUNC-004: Progress Component Implementation
 */

import { forwardRef, type HTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/shared/lib/utils';

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  /** Progress value (0-100) or undefined for indeterminate */
  value?: number;
  /** Color variant */
  color?: 'anthropic' | 'blue' | 'emerald' | 'destructive';
  /** Show percentage label */
  showLabel?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

const colorVariants = {
  anthropic: 'bg-[#D97757]',
  blue: 'bg-blue-500',
  emerald: 'bg-emerald-500',
  destructive: 'bg-destructive',
};

const sizeVariants = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, color = 'anthropic', showLabel = false, size = 'md', ...props }, ref) => {
    const isIndeterminate = value === undefined;
    const percentage = Math.min(100, Math.max(0, value));

    return (
      <div
        ref={ref}
        className={cn('w-full', className)}
        role="progressbar"
        aria-valuenow={isIndeterminate ? undefined : percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={isIndeterminate ? 'Loading' : `Progress: ${percentage}%`}
        {...props}
      >
        <div
          className={cn(
            'relative w-full overflow-hidden rounded-full bg-secondary',
            sizeVariants[size]
          )}
        >
          {isIndeterminate ? (
            <motion.div
              className={cn('absolute h-full', colorVariants[color])}
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          ) : (
            <motion.div
              className={cn('h-full', colorVariants[color])}
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          )}
        </div>
        {showLabel && !isIndeterminate && (
          <p className="mt-1 text-center text-xs text-muted-foreground">{percentage}%</p>
        )}
      </div>
    );
  }
);

Progress.displayName = 'Progress';
