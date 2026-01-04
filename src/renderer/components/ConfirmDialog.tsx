/**
 * Confirm Dialog Component
 *
 * REQ-002: Confirm Dialog
 * TAG-DESIGN-002: Confirm Dialog Design
 * TAG-FUNC-002: Confirm Dialog Implementation
 *
 * Displays a confirmation dialog with customizable message and button labels.
 * Used to confirm critical actions before execution.
 *
 * Features:
 * - Displays confirmation message
 * - Has confirm and cancel buttons
 * - Supports customizable button labels
 * - Returns user choice via callback
 * - Uses Dialog component from UI library
 */

import { useTranslation } from 'react-i18next';
import { Dialog } from './Dialog';
import { Button } from './Button';

/**
 * Confirm Dialog Variant
 */
export type ConfirmDialogVariant = 'default' | 'destructive';

/**
 * Confirm Dialog Props
 */
export interface ConfirmDialogProps {
  /** Controlled open state */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Dialog title */
  title: string;
  /** Confirmation message to display */
  message: string;
  /** Callback when user confirms */
  onConfirm: () => void;
  /** Custom confirm button label (optional, defaults to 'Confirm') */
  confirmLabel?: string;
  /** Custom cancel button label (optional, defaults to 'Cancel') */
  cancelLabel?: string;
  /** Dialog variant (default or destructive) */
  variant?: ConfirmDialogVariant;
}

/**
 * Confirm Dialog Component
 *
 * Displays a confirmation dialog for critical actions.
 *
 * @example
 * ```tsx
 * <ConfirmDialog
 *   open={showConfirm}
 *   onOpenChange={setShowConfirm}
 *   title="Delete File"
 *   message="Are you sure you want to delete this file? This action cannot be undone."
 *   onConfirm={handleDelete}
 *   confirmLabel="Delete"
 *   cancelLabel="Cancel"
 *   variant="destructive"
 * />
 * ```
 */
export const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  message,
  onConfirm,
  confirmLabel,
  cancelLabel,
  variant = 'default',
}: ConfirmDialogProps) => {
  const { t } = useTranslation();

  /**
   * Handle confirm button click
   */
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  /**
   * Handle cancel button click
   */
  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content size="sm">
        <Dialog.Header>
          <Dialog.Title>{title}</Dialog.Title>
        </Dialog.Header>

        <div className="py-4">
          <p className="text-sm text-zinc-700 dark:text-zinc-300">{message}</p>
        </div>

        <Dialog.Footer>
          <Button variant="ghost" onClick={handleCancel}>
            {cancelLabel || t('cancel')}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'primary'}
            onClick={handleConfirm}
          >
            {confirmLabel || t('confirm')}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
};

ConfirmDialog.displayName = 'ConfirmDialog';
