/**
 * Dialog Component
 *
 * Modal dialog component with backdrop blur, animations, and accessibility.
 * Follows shadcn/ui patterns with Radix UI primitives and Framer Motion.
 *
 * TAG-DESIGN-003: Dialog Component Design
 * TAG-FUNC-003: Dialog Component Implementation
 */

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib/utils';

// Dialog content variants
const dialogVariants = cva(
  // Base styles
  'fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 shadow-lg duration-200 sm:rounded-lg',
  {
    variants: {
      size: {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        full: 'max-w-full h-full rounded-none',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export interface DialogProps {
  /** Controlled open state */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Dialog content */
  children: ReactNode;
}

// Extend Dialog with sub-components
interface DialogComponent extends React.FC<DialogProps> {
  Content: typeof DialogContent;
  Header: typeof DialogHeader;
  Footer: typeof DialogFooter;
  Title: typeof DialogTitle;
  Description: typeof DialogDescription;
}

/**
 * Dialog Root Component
 *
 * @example
 * ```tsx
 * <Dialog open={open} onOpenChange={setOpen}>
 *   <Dialog.Content>
 *     <Dialog.Title>Title</Dialog.Title>
 *     <Dialog.Description>Description</Dialog.Description>
 *   </Dialog.Content>
 * </Dialog>
 * ```
 */
const DialogRoot = ({ open, onOpenChange, children }: DialogProps) => {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal forceMount>
        <DialogPrimitive.Overlay asChild>
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        </DialogPrimitive.Overlay>
        {children}
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

export const Dialog = DialogRoot as DialogComponent;

export interface DialogContentProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dialogVariants> {
  /** Dialog size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Position variant (reserved for future use) */
  position?: 'center' | 'top' | 'bottom';
}

/**
 * Dialog Content Component
 */
export const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, size, position = 'center', ...props }, ref) => {
    return (
      <DialogPrimitive.Content asChild>
        <motion.div
          ref={ref}
          className={cn(
            dialogVariants({ size }),
            'dark:bg-zinc-900 dark:border-zinc-800',
            className
          )}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          aria-modal="true"
          {...props}
        >
          {children}
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-zinc-100 data-[state=open]:text-zinc-500 dark:ring-offset-zinc-950 dark:focus:ring-zinc-300 dark:data-[state=open]:bg-zinc-800 dark:data-[state=open]:text-zinc-400">
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </motion.div>
      </DialogPrimitive.Content>
    );
  }
);

DialogContent.displayName = 'DialogContent';

/**
 * Dialog Header Component
 */
export const DialogHeader = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)}
    {...props}
  />
);

DialogHeader.displayName = 'DialogHeader';

/**
 * Dialog Footer Component
 */
export const DialogFooter = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
    {...props}
  />
);

DialogFooter.displayName = 'DialogFooter';

/**
 * Dialog Title Component
 */
export const DialogTitle = forwardRef<
  HTMLHeadingElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-none tracking-tight',
      className
    )}
    {...props}
  />
));

DialogTitle.displayName = DialogPrimitive.Title.displayName;

/**
 * Dialog Description Component
 */
export const DialogDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-zinc-500 dark:text-zinc-400', className)}
    {...props}
  />
));

DialogDescription.displayName = DialogPrimitive.Description.displayName;

// Attach sub-components to Dialog
Dialog.Content = DialogContent;
Dialog.Header = DialogHeader;
Dialog.Footer = DialogFooter;
Dialog.Title = DialogTitle;
Dialog.Description = DialogDescription;
