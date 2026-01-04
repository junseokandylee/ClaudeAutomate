/**
 * Card Component
 *
 * Reusable card component with glassmorphism styling, slots, and animations.
 * Follows shadcn/ui patterns with Tailwind CSS and Framer Motion.
 *
 * TAG-DESIGN-002: Card Component Design
 * TAG-FUNC-002: Card Component Implementation
 */

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib/utils';

// Card variants
const cardVariants = cva(
  // Base styles with glassmorphism
  'rounded-lg border bg-white/10 backdrop-blur-lg transition-all duration-200',
  {
    variants: {
      padding: {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
      radius: {
        sm: 'rounded-sm',
        md: 'rounded-md',
        lg: 'rounded-lg',
        xl: 'rounded-xl',
      },
      hover: {
        none: '',
        lift: 'hover:scale-[1.02] hover:shadow-xl',
        glow: 'hover:shadow-2xl hover:bg-white/15',
      },
    },
    defaultVariants: {
      padding: 'md',
      radius: 'lg',
      hover: 'glow',
    },
  }
);

export interface CardProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {
  /** Card content */
  children: ReactNode;
}

/**
 * Card Root Component
 *
 * @example
 * ```tsx
 * <Card>
 *   <Card.Header>Title</Card.Header>
 *   <Card.Content>Content</Card.Content>
 *   <Card.Footer>Footer</Card.Footer>
 * </Card>
 * ```
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, padding, radius, hover, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          cardVariants({ padding, radius, hover }),
          'border-white/20 dark:border-white/10',
          'dark:bg-black/40 dark:hover:bg-black/50',
          className
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={hover === 'lift' ? { scale: 1.02, y: -4 } : undefined}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';

// Header Component
const headerVariants = cva('flex flex-col space-y-1.5', {
  variants: {
    padding: {
      none: '',
      sm: 'p-4 pb-2',
      md: 'p-6 pb-4',
      lg: 'p-8 pb-6',
    },
  },
  defaultVariants: {
    padding: 'md',
  },
});

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /** Optional title for shorthand rendering */
  title?: string;
  /** Optional description for shorthand rendering */
  description?: string;
  /** HTML tag to render */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div';
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, title, description, as: Tag = 'div', children, ...props }, ref) => {
    if (title || description) {
      return (
        <div
          ref={ref}
          className={cn(headerVariants(), className)}
          {...props}
        >
          {title && <Tag className="text-2xl font-semibold leading-none tracking-tight">{title}</Tag>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
          {children}
        </div>
      );
    }

    return (
      <Tag
        ref={ref as any}
        className={cn(headerVariants(), className)}
        {...props}
      >
        {children}
      </Tag>
    );
  }
);

CardHeader.displayName = 'CardHeader';

// Content Component
const contentVariants = cva('', {
  variants: {
    padding: {
      none: '',
      sm: 'p-4 pt-0',
      md: 'p-6 pt-0',
      lg: 'p-8 pt-0',
    },
  },
  defaultVariants: {
    padding: 'md',
  },
});

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(contentVariants(), className)}
      {...props}
    />
  )
);

CardContent.displayName = 'CardContent';

// Footer Component
const footerVariants = cva('flex items-center', {
  variants: {
    padding: {
      none: '',
      sm: 'p-4 pt-2',
      md: 'p-6 pt-4',
      lg: 'p-8 pt-6',
    },
  },
  defaultVariants: {
    padding: 'md',
  },
});

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(footerVariants(), className)}
      {...props}
    />
  )
);

CardFooter.displayName = 'CardFooter';

// Attach sub-components to Card
Card.Header = CardHeader;
Card.Content = CardContent;
Card.Footer = CardFooter;
