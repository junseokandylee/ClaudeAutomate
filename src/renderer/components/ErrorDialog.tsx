/**
 * Error Dialog Component
 *
 * REQ-003: Error Dialog
 * TAG-DESIGN-003: Error Dialog Design
 * TAG-FUNC-003: Error Dialog Implementation
 *
 * Displays error messages with optional expandable details and retry functionality.
 * Used to show error information to users with debugging support.
 *
 * Features:
 * - Displays error messages with title and description
 * - Shows expandable error details (optional)
 * - Provides retry button callback (optional)
 * - Logs errors for debugging
 * - Uses Dialog component from UI library
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog } from './Dialog';
import { Button } from './Button';

/**
 * Error Dialog Props
 */
export interface ErrorDialogProps {
  /** Controlled open state */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Error title */
  title: string;
  /** Error message to display */
  message: string;
  /** Optional detailed error information (stack trace, etc.) */
  details?: string;
  /** Optional callback when user clicks retry */
  onRetry?: () => void;
}

/**
 * Error Dialog Component
 *
 * Displays an error dialog with optional details and retry functionality.
 *
 * @example
 * ```tsx
 * <ErrorDialog
 *   open={showError}
 *   onOpenChange={setShowError}
 *   title="Connection Failed"
 *   message="Unable to connect to server"
 *   details="Error: Network timeout at line 42"
 *   onRetry={handleRetry}
 * />
 * ```
 */
export const ErrorDialog = ({
  open,
  onOpenChange,
  title,
  message,
  details,
  onRetry,
}: ErrorDialogProps) => {
  const { t } = useTranslation();
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);

  /**
   * Log error to console for debugging
   */
  useEffect(() => {
    if (open) {
      if (details) {
        console.error('[ErrorDialog]', title, message, details);
      } else {
        console.error('[ErrorDialog]', title, message);
      }
    }
  }, [open, title, message, details]);

  /**
   * Handle retry button click
   */
  const handleRetry = () => {
    onRetry?.();
    onOpenChange(false);
  };

  /**
   * Handle close button click
   */
  const handleClose = () => {
    onOpenChange(false);
  };

  /**
   * Toggle details expansion
   */
  const toggleDetails = () => {
    setIsDetailsExpanded((prev) => !prev);
  };

  /**
   * Reset expanded state when dialog closes
   */
  useEffect(() => {
    if (!open) {
      setIsDetailsExpanded(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content size="md">
        <Dialog.Header>
          <Dialog.Title>{title}</Dialog.Title>
        </Dialog.Header>

        <div className="py-4">
          <p className="text-sm text-zinc-700 dark:text-zinc-300">{message}</p>

          {/* Expandable Error Details */}
          {details && details.trim().length > 0 && (
            <div className="mt-4">
              <button
                type="button"
                onClick={toggleDetails}
                className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:text-zinc-700 dark:hover:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 dark:focus:ring-zinc-300 dark:focus:ring-offset-zinc-950"
              >
                <span>{t(isDetailsExpanded ? 'error.hideDetails' : 'error.showDetails')}</span>
                <svg
                  className={`h-4 w-4 transition-transform ${isDetailsExpanded ? 'rotate-180' : ''}`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {isDetailsExpanded && (
                <div className="mt-2 rounded-md bg-zinc-100 p-3 dark:bg-zinc-800">
                  <pre className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-all">
                    {details}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        <Dialog.Footer>
          {onRetry && (
            <Button variant="primary" onClick={handleRetry} className="sm:order-last">
              {t('error.retry')}
            </Button>
          )}
          <Button variant="ghost" onClick={handleClose}>
            {t('close')}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
};

ErrorDialog.displayName = 'ErrorDialog';
