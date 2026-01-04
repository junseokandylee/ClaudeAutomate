/**
 * Tooltip Component
 *
 * Hover-triggered tooltip with configurable placement and dark theme.
 * Follows shadcn/ui patterns with Radix UI primitives.
 *
 * TAG-DESIGN-007: Tooltip Component Design
 * TAG-FUNC-007: Tooltip Component Implementation
 */

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/shared/lib/utils';

export interface TooltipProps {
  /** Tooltip content */
  content: ReactNode;
  /** Tooltip children (trigger element) */
  children: ReactNode;
  /** Placement of tooltip relative to trigger */
  placement?: 'top' | 'bottom' | 'left' | 'right';
  /** Delay in ms before showing tooltip */
  delayDuration?: number;
  /** Skip delay duration in ms */
  skipDelayDuration?: number;
  /** Custom className for tooltip content */
  className?: string;
  /** Offset from trigger */
  sideOffset?: number;
  /** Show arrow indicator */
  arrow?: boolean;
}

/**
 * Tooltip Root Component
 *
 * @example
 * ```tsx
 * <Tooltip content="Tooltip content">
 *   <button>Hover me</button>
 * </Tooltip>
 *
 * <Tooltip content="Top tooltip" placement="top">
 *   <button>Hover</button>
 * </Tooltip>
 * ```
 */
export const Tooltip = ({
  content,
  children,
  placement = 'top',
  delayDuration = 200,
  skipDelayDuration = 300,
  className,
  sideOffset = 4,
  arrow = true,
}: TooltipProps) => {
  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration} skipDelayDuration={skipDelayDuration}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Content
          side={placement}
          sideOffset={sideOffset}
          className={cn(
            'z-50 overflow-hidden rounded-md bg-zinc-900 px-3 py-1.5 text-xs text-white animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
            'dark:bg-zinc-50 dark:text-zinc-900',
            className
          )}
        >
          {content}
          {arrow && (
            <TooltipPrimitive.Arrow className="fill-zinc-900 dark:fill-zinc-50" />
          )}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
};

// Export sub-components for advanced usage
export const TooltipTrigger = TooltipPrimitive.Trigger;
export const TooltipContent = TooltipPrimitive.Content;
export const TooltipProvider = TooltipPrimitive.Provider;
export const TooltipArrow = TooltipPrimitive.Arrow;
