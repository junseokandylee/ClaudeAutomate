/**
 * Button Component
 *
 * Reusable button component with variants, sizes, states, and animations.
 * Follows shadcn/ui patterns with Tailwind CSS and Framer Motion.
 *
 * TAG-DESIGN-001: Button Component Design
 * TAG-FUNC-001: Button Component Implementation
 */

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib/utils';

// Button variants using class-variance-authority
const buttonVariants = cva(
  // Base styles
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-[#D97757] text-white hover:bg-[#c96a4f] dark:bg-[#D97757] dark:text-white dark:hover:bg-[#c96a4f]',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 py-2',
        lg: 'h-12 px-8 text-base',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Render as a child component (e.g., Link) */
  asChild?: boolean;
  /** Show loading state with spinner */
  loading?: boolean;
  /** Button content */
  children: ReactNode;
}

/**
 * Button Component
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   Click me
 * </Button>
 *
 * <Button variant="destructive" loading>
 *   Deleting...
 * </Button>
 *
 * <Button asChild>
 *   <a href="/path">Link Button</a>
 * </Button>
 * ```
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      asChild = false,
      loading = false,
      className,
      variant,
      size,
      fullWidth,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    // Motion animation variants
    const motionVariants = {
      hover: { scale: 1.02 },
      tap: { scale: 0.98 },
    };

    // Loading spinner component
    const LoadingSpinner = () => (
      <motion.div
        data-testid="loading-spinner"
        className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
    );

    // Combine disabled state with loading
    const isDisabled = disabled || loading;

    // Render as child component or button
    const Comp = asChild ? Slot : motion.button;

    // When using asChild with loading, we can't show spinner inside Slot
    // So we render the child directly with loading indicator prepended
    const content = loading ? (
      <>
        <LoadingSpinner />
        {children}
      </>
    ) : (
      children
    );

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        disabled={isDisabled}
        aria-busy={loading}
        aria-disabled={isDisabled}
        variants={asChild ? undefined : motionVariants}
        whileHover={asChild ? undefined : 'hover'}
        whileTap={asChild ? undefined : 'tap'}
        {...props}
      >
        {content}
      </Comp>
    );
  }
);

Button.displayName = 'Button';
