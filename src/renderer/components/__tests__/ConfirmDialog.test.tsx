/**
 * ConfirmDialog Component Tests
 *
 * TDD RED Phase: Failing tests for ConfirmDialog component functionality
 * Testing: confirmation message display, confirm/cancel buttons, customizable labels
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog } from '../ConfirmDialog';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('ConfirmDialog Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should not render when open is false', () => {
      render(
        <ConfirmDialog
          open={false}
          onOpenChange={() => {}}
          title="Confirm"
          message="Are you sure?"
          onConfirm={() => {}}
        />
      );

      expect(screen.queryByRole('dialog')).toHaveAttribute('data-state', 'closed');
    });

    it('should render dialog when open is true', () => {
      render(
        <ConfirmDialog
          open={true}
          onOpenChange={() => {}}
          title="Confirm"
          message="Are you sure?"
          onConfirm={() => {}}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should display title', () => {
      render(
        <ConfirmDialog
          open={true}
          onOpenChange={() => {}}
          title="Delete File"
          message="Are you sure you want to delete?"
          onConfirm={() => {}}
        />
      );

      expect(screen.getByText('Delete File')).toBeInTheDocument();
    });

    it('should display confirmation message', () => {
      render(
        <ConfirmDialog
          open={true}
          onOpenChange={() => {}}
          title="Confirm"
          message="Are you sure you want to proceed?"
          onConfirm={() => {}}
        />
      );

      expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
    });
  });

  describe('Buttons', () => {
    it('should have confirm and cancel buttons', () => {
      render(
        <ConfirmDialog
          open={true}
          onOpenChange={() => {}}
          title="Confirm"
          message="Are you sure?"
          onConfirm={() => {}}
        />
      );

      expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should use default button labels', () => {
      render(
        <ConfirmDialog
          open={true}
          onOpenChange={() => {}}
          title="Confirm"
          message="Are you sure?"
          onConfirm={() => {}}
        />
      );

      expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should support custom button labels', () => {
      render(
        <ConfirmDialog
          open={true}
          onOpenChange={() => {}}
          title="Confirm"
          message="Are you sure?"
          onConfirm={() => {}}
          confirmLabel="Delete"
          cancelLabel="Keep"
        />
      );

      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Keep' })).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onConfirm when confirm button is clicked', async () => {
      const user = userEvent.setup();
      const handleConfirm = vi.fn();

      render(
        <ConfirmDialog
          open={true}
          onOpenChange={() => {}}
          title="Confirm"
          message="Are you sure?"
          onConfirm={handleConfirm}
        />
      );

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);

      expect(handleConfirm).toHaveBeenCalledTimes(1);
    });

    it('should call onOpenChange with false when confirm button is clicked', async () => {
      const user = userEvent.setup();
      const handleOpenChange = vi.fn();

      render(
        <ConfirmDialog
          open={true}
          onOpenChange={handleOpenChange}
          title="Confirm"
          message="Are you sure?"
          onConfirm={() => {}}
        />
      );

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);

      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });

    it('should call onOpenChange with false when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const handleOpenChange = vi.fn();

      render(
        <ConfirmDialog
          open={true}
          onOpenChange={handleOpenChange}
          title="Confirm"
          message="Are you sure?"
          onConfirm={() => {}}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });

    it('should NOT call onConfirm when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const handleConfirm = vi.fn();

      render(
        <ConfirmDialog
          open={true}
          onOpenChange={() => {}}
          title="Confirm"
          message="Are you sure?"
          onConfirm={handleConfirm}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(handleConfirm).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <ConfirmDialog
          open={true}
          onOpenChange={() => {}}
          title="Confirm"
          message="Are you sure?"
          onConfirm={() => {}}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    });
  });

  describe('Variants', () => {
    it('should support destructive variant for dangerous actions', () => {
      render(
        <ConfirmDialog
          open={true}
          onOpenChange={() => {}}
          title="Delete"
          message="This cannot be undone"
          onConfirm={() => {}}
          variant="destructive"
        />
      );

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      expect(confirmButton).toHaveClass('bg-destructive');
    });
  });
});
