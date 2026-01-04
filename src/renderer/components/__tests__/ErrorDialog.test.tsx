/**
 * ErrorDialog Component Tests
 *
 * TDD RED Phase: Failing tests for ErrorDialog component functionality
 * Testing: error display, expandable details, retry option, error logging
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorDialog } from '../ErrorDialog';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'error.showDetails': 'Show Details',
        'error.hideDetails': 'Hide Details',
        'error.retry': 'Retry',
        'close': 'Close',
      };
      return translations[key] || key;
    },
    i18n: {
      changeLanguage: vi.fn(),
      language: 'en',
    },
  }),
}));

// Mock console.error to verify error logging
const consoleErrorSpy = vi.spyOn(console, 'error');

describe('ErrorDialog Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy.mockImplementation(() => {});
  });

  describe('Rendering', () => {
    it('should not render when open is false', () => {
      render(
        <ErrorDialog
          open={false}
          onOpenChange={() => {}}
          title="Error Title"
          message="An error occurred"
        />
      );

      expect(screen.queryByRole('dialog')).toHaveAttribute('data-state', 'closed');
    });

    it('should render dialog when open is true', () => {
      render(
        <ErrorDialog
          open={true}
          onOpenChange={() => {}}
          title="Error Title"
          message="An error occurred"
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Error Title')).toBeInTheDocument();
      expect(screen.getByText('An error occurred')).toBeInTheDocument();
    });

    it('should display error message', () => {
      render(
        <ErrorDialog
          open={true}
          onOpenChange={() => {}}
          title="Error Title"
          message="Something went wrong"
        />
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should not display details section when details not provided', () => {
      render(
        <ErrorDialog
          open={true}
          onOpenChange={() => {}}
          title="Error Title"
          message="An error occurred"
        />
      );

      expect(screen.queryByText('Show Details')).not.toBeInTheDocument();
    });
  });

  describe('Error Details (Expandable)', () => {
    it('should display details section when details provided', () => {
      render(
        <ErrorDialog
          open={true}
          onOpenChange={() => {}}
          title="Error Title"
          message="An error occurred"
          details="Stack trace: Error at line 42"
        />
      );

      expect(screen.getByText('Show Details')).toBeInTheDocument();
    });

    it('should hide details content by default', () => {
      render(
        <ErrorDialog
          open={true}
          onOpenChange={() => {}}
          title="Error Title"
          message="An error occurred"
          details="Stack trace: Error at line 42"
        />
      );

      const detailsContent = screen.queryByText('Stack trace: Error at line 42');
      expect(detailsContent).not.toBeInTheDocument();
    });

    it('should show details when expand button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <ErrorDialog
          open={true}
          onOpenChange={() => {}}
          title="Error Title"
          message="An error occurred"
          details="Stack trace: Error at line 42"
        />
      );

      const expandButton = screen.getByRole('button', { name: /show details/i });
      await user.click(expandButton);

      expect(screen.getByText('Stack trace: Error at line 42')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /hide details/i })).toBeInTheDocument();
    });

    it('should hide details when collapse button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <ErrorDialog
          open={true}
          onOpenChange={() => {}}
          title="Error Title"
          message="An error occurred"
          details="Stack trace: Error at line 42"
        />
      );

      const expandButton = screen.getByRole('button', { name: /show details/i });
      await user.click(expandButton);

      expect(screen.getByText('Stack trace: Error at line 42')).toBeInTheDocument();

      const collapseButton = screen.getByRole('button', { name: /hide details/i });
      await user.click(collapseButton);

      await waitFor(() => {
        expect(screen.queryByText('Stack trace: Error at line 42')).not.toBeInTheDocument();
      });
    });
  });

  describe('Retry Functionality', () => {
    it('should not show retry button when onRetry not provided', () => {
      render(
        <ErrorDialog
          open={true}
          onOpenChange={() => {}}
          title="Error Title"
          message="An error occurred"
        />
      );

      expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
    });

    it('should show retry button when onRetry provided', () => {
      render(
        <ErrorDialog
          open={true}
          onOpenChange={() => {}}
          title="Error Title"
          message="An error occurred"
          onRetry={() => {}}
        />
      );

      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should call onRetry when retry button is clicked', async () => {
      const user = userEvent.setup();
      const handleRetry = vi.fn();

      render(
        <ErrorDialog
          open={true}
          onOpenChange={() => {}}
          title="Error Title"
          message="An error occurred"
          onRetry={handleRetry}
        />
      );

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      expect(handleRetry).toHaveBeenCalledTimes(1);
    });

    it('should close dialog after retry is clicked', async () => {
      const user = userEvent.setup();
      const handleRetry = vi.fn();
      const handleOpenChange = vi.fn();

      render(
        <ErrorDialog
          open={true}
          onOpenChange={handleOpenChange}
          title="Error Title"
          message="An error occurred"
          onRetry={handleRetry}
        />
      );

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Close Button', () => {
    it('should have close button', () => {
      render(
        <ErrorDialog
          open={true}
          onOpenChange={() => {}}
          title="Error Title"
          message="An error occurred"
        />
      );

      // Use getAllByRole since there are multiple close buttons (X icon and footer button)
      const closeButtons = screen.getAllByRole('button', { name: /close/i });
      expect(closeButtons.length).toBeGreaterThan(0);
    });

    it('should call onOpenChange with false when close is clicked', async () => {
      const user = userEvent.setup();
      const handleOpenChange = vi.fn();

      render(
        <ErrorDialog
          open={true}
          onOpenChange={handleOpenChange}
          title="Error Title"
          message="An error occurred"
        />
      );

      // Use the last close button (footer button)
      const closeButtons = screen.getAllByRole('button', { name: /close/i });
      const closeButton = closeButtons[closeButtons.length - 1];
      await user.click(closeButton);

      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Error Logging', () => {
    it('should log error to console when dialog opens', () => {
      render(
        <ErrorDialog
          open={true}
          onOpenChange={() => {}}
          title="Error Title"
          message="An error occurred"
          details="Stack trace details"
        />
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[ErrorDialog]',
        'Error Title',
        'An error occurred',
        'Stack trace details'
      );
    });

    it('should log error without details when details not provided', () => {
      render(
        <ErrorDialog
          open={true}
          onOpenChange={() => {}}
          title="Error Title"
          message="An error occurred"
        />
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[ErrorDialog]',
        'Error Title',
        'An error occurred'
      );
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <ErrorDialog
          open={true}
          onOpenChange={() => {}}
          title="Error Title"
          message="An error occurred"
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    });

    it('should have proper heading structure', () => {
      render(
        <ErrorDialog
          open={true}
          onOpenChange={() => {}}
          title="Error Title"
          message="An error occurred"
        />
      );

      const heading = screen.getByRole('heading', { name: 'Error Title' });
      expect(heading).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty details string', () => {
      render(
        <ErrorDialog
          open={true}
          onOpenChange={() => {}}
          title="Error Title"
          message="An error occurred"
          details=""
        />
      );

      expect(screen.queryByText('error.details')).not.toBeInTheDocument();
    });

    it('should handle very long error messages', () => {
      const longMessage = 'Error '.repeat(100);

      render(
        <ErrorDialog
          open={true}
          onOpenChange={() => {}}
          title="Error Title"
          message={longMessage}
        />
      );

      // Check that the message is partially present
      expect(screen.getByText(/Error Error Error/)).toBeInTheDocument();
    });

    it('should handle very long details', async () => {
      const user = userEvent.setup();
      const longDetails = 'Stack trace line '.repeat(50);

      render(
        <ErrorDialog
          open={true}
          onOpenChange={() => {}}
          title="Error Title"
          message="An error occurred"
          details={longDetails}
        />
      );

      const expandButton = screen.getByRole('button', { name: /show details/i });
      await user.click(expandButton);

      // Check that the details are partially present
      expect(screen.getByText(/Stack trace line/)).toBeInTheDocument();
    });
  });
});
