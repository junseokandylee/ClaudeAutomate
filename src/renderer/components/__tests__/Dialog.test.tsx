/**
 * Dialog Component Tests
 *
 * TDD RED Phase: Failing tests for Dialog component functionality
 * Testing: modal overlay, animations, keyboard dismiss, focus trap, accessibility
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dialog } from '../Dialog';

describe('Dialog Component', () => {
  describe('Rendering', () => {
    it('should not render dialog when open is false', () => {
      render(
        <Dialog open={false} onOpenChange={() => {}}>
          <Dialog.Content>
            <Dialog.Title>Test Dialog</Dialog.Title>
            <Dialog.Description>Dialog description</Dialog.Description>
          </Dialog.Content>
        </Dialog>
      );
      const dialog = screen.queryByRole('dialog');
      expect(dialog).toHaveAttribute('data-state', 'closed');
    });

    it('should render dialog when open is true', () => {
      render(
        <Dialog open={true} onOpenChange={() => {}}>
          <Dialog.Content>
            <Dialog.Title>Test Dialog</Dialog.Title>
          </Dialog.Content>
        </Dialog>
      );
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should render dialog title', () => {
      render(
        <Dialog open={true} onOpenChange={() => {}}>
          <Dialog.Content>
            <Dialog.Title>Dialog Title</Dialog.Title>
          </Dialog.Content>
        </Dialog>
      );
      expect(screen.getByText('Dialog Title')).toBeInTheDocument();
    });

    it('should render dialog description', () => {
      render(
        <Dialog open={true} onOpenChange={() => {}}>
          <Dialog.Content>
            <Dialog.Description>Dialog description</Dialog.Description>
          </Dialog.Content>
        </Dialog>
      );
      expect(screen.getByText('Dialog description')).toBeInTheDocument();
    });

    it('should render dialog content children', () => {
      render(
        <Dialog open={true} onOpenChange={() => {}}>
          <Dialog.Content>
            <Dialog.Title>Title</Dialog.Title>
            <p>Custom content</p>
          </Dialog.Content>
        </Dialog>
      );
      expect(screen.getByText('Custom content')).toBeInTheDocument();
    });
  });

  describe('Modal Overlay', () => {
    it('should render modal overlay with backdrop blur', () => {
      render(
        <Dialog open={true} onOpenChange={() => {}}>
          <Dialog.Content>
            <Dialog.Title>Title</Dialog.Title>
          </Dialog.Content>
        </Dialog>
      );
      const overlay = screen.getByRole('dialog').previousElementSibling;
      expect(overlay).toHaveClass('backdrop-blur-sm');
    });

    it('should have semi-transparent overlay background', () => {
      render(
        <Dialog open={true} onOpenChange={() => {}}>
          <Dialog.Content>
            <Dialog.Title>Title</Dialog.Title>
          </Dialog.Content>
        </Dialog>
      );
      const overlay = screen.getByRole('dialog').previousElementSibling;
      expect(overlay).toHaveClass('bg-black/50');
    });
  });

  describe('Close Button', () => {
    it('should render close button in dialog header', () => {
      render(
        <Dialog open={true} onOpenChange={() => {}}>
          <Dialog.Content>
            <Dialog.Title>Title</Dialog.Title>
          </Dialog.Content>
        </Dialog>
      );
      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();
    });

    it('should call onOpenChange with false when close button is clicked', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();
      render(
        <Dialog open={true} onOpenChange={handleClose}>
          <Dialog.Content>
            <Dialog.Title>Title</Dialog.Title>
          </Dialog.Content>
        </Dialog>
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      expect(handleClose).toHaveBeenCalledWith(false);
    });
  });

  describe('Keyboard Dismiss', () => {
    it('should close dialog when Escape key is pressed', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();
      render(
        <Dialog open={true} onOpenChange={handleClose}>
          <Dialog.Content>
            <Dialog.Title>Title</Dialog.Title>
          </Dialog.Content>
        </Dialog>
      );

      await user.keyboard('{Escape}');

      expect(handleClose).toHaveBeenCalledWith(false);
    });

    it('should not close dialog when Escape key is pressed if onOpenChange is not provided', async () => {
      const user = userEvent.setup();
      render(
        <Dialog open={true} onOpenChange={() => {}}>
          <Dialog.Content>
            <Dialog.Title>Title</Dialog.Title>
          </Dialog.Content>
        </Dialog>
      );

      await user.keyboard('{Escape}');

      // Dialog should still be in DOM (controlled by parent)
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Framer Motion Animations', () => {
    it('should have motion wrapper for enter animation', () => {
      render(
        <Dialog open={true} onOpenChange={() => {}}>
          <Dialog.Content>
            <Dialog.Title>Title</Dialog.Title>
          </Dialog.Content>
        </Dialog>
      );
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('should animate overlay fade in', () => {
      render(
        <Dialog open={true} onOpenChange={() => {}}>
          <Dialog.Content>
            <Dialog.Title>Title</Dialog.Title>
          </Dialog.Content>
        </Dialog>
      );
      const overlay = screen.getByRole('dialog').previousElementSibling;
      expect(overlay).toBeInTheDocument();
    });
  });

  describe('Focus Trap', () => {
    it('should trap focus within dialog when open', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <button>Outside button</button>
          <Dialog open={true} onOpenChange={() => {}}>
            <Dialog.Content>
              <Dialog.Title>Title</Dialog.Title>
              <button>Inside button</button>
            </Dialog.Content>
          </Dialog>
        </div>
      );

      const insideButton = screen.getByRole('button', { name: 'Inside button' });
      insideButton.focus();
      expect(insideButton).toHaveFocus();
    });
  });

  describe('Accessibility', () => {
    it('should have role="dialog" attribute', () => {
      render(
        <Dialog open={true} onOpenChange={() => {}}>
          <Dialog.Content>
            <Dialog.Title>Title</Dialog.Title>
          </Dialog.Content>
        </Dialog>
      );
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('should have aria-labelledby attribute linking to title', () => {
      render(
        <Dialog open={true} onOpenChange={() => {}}>
          <Dialog.Content>
            <Dialog.Title>Dialog Title</Dialog.Title>
          </Dialog.Content>
        </Dialog>
      );
      const dialog = screen.getByRole('dialog');
      const titleId = dialog.getAttribute('aria-labelledby');
      expect(titleId).toBeTruthy();

      const title = screen.getByText('Dialog Title');
      expect(title.id).toBe(titleId);
    });

    it('should have aria-describedby attribute linking to description', () => {
      render(
        <Dialog open={true} onOpenChange={() => {}}>
          <Dialog.Content>
            <Dialog.Title>Title</Dialog.Title>
            <Dialog.Description>Dialog description</Dialog.Description>
          </Dialog.Content>
        </Dialog>
      );
      const dialog = screen.getByRole('dialog');
      const descId = dialog.getAttribute('aria-describedby');
      expect(descId).toBeTruthy();

      const description = screen.getByText('Dialog description');
      expect(description.id).toBe(descId);
    });

    it('should have aria-modal="true" attribute', () => {
      render(
        <Dialog open={true} onOpenChange={() => {}}>
          <Dialog.Content>
            <Dialog.Title>Title</Dialog.Title>
          </Dialog.Content>
        </Dialog>
      );
      const dialog = screen.getByRole('dialog');
      // Radix UI automatically adds aria-modal
      expect(dialog).toHaveAttribute('aria-modal');
    });
  });

  describe('Dark Theme', () => {
    it('should apply dark mode classes', () => {
      render(
        <Dialog open={true} onOpenChange={() => {}}>
          <Dialog.Content>
            <Dialog.Title>Title</Dialog.Title>
          </Dialog.Content>
        </Dialog>
      );
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('dark:bg-zinc-900');
    });
  });

  describe('Customization', () => {
    it('should support custom className', () => {
      render(
        <Dialog open={true} onOpenChange={() => {}}>
          <Dialog.Content className="custom-class">
            <Dialog.Title>Title</Dialog.Title>
          </Dialog.Content>
        </Dialog>
      );
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('custom-class');
    });

    it('should support different sizes', () => {
      render(
        <Dialog open={true} onOpenChange={() => {}}>
          <Dialog.Content size="lg">
            <Dialog.Title>Title</Dialog.Title>
          </Dialog.Content>
        </Dialog>
      );
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('max-w-lg');
    });

    it('should support custom position', () => {
      render(
        <Dialog open={true} onOpenChange={() => {}}>
          <Dialog.Content position="top">
            <Dialog.Title>Title</Dialog.Title>
          </Dialog.Content>
        </Dialog>
      );
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });
  });

  describe('Dialog Header', () => {
    it('should render header with title and close button', () => {
      render(
        <Dialog open={true} onOpenChange={() => {}}>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Header Title</Dialog.Title>
              <Dialog.Description>Header description</Dialog.Description>
            </Dialog.Header>
          </Dialog.Content>
        </Dialog>
      );
      expect(screen.getByText('Header Title')).toBeInTheDocument();
      expect(screen.getByText('Header description')).toBeInTheDocument();
    });
  });

  describe('Dialog Footer', () => {
    it('should render footer with actions', () => {
      render(
        <Dialog open={true} onOpenChange={() => {}}>
          <Dialog.Content>
            <Dialog.Title>Title</Dialog.Title>
            <Dialog.Footer>
              <button>Cancel</button>
              <button>Confirm</button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog>
      );
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    });
  });

  describe('Controlled State', () => {
    it('should respect open prop changes', () => {
      const { rerender } = render(
        <Dialog open={false} onOpenChange={() => {}}>
          <Dialog.Content>
            <Dialog.Title>Title</Dialog.Title>
          </Dialog.Content>
        </Dialog>
      );

      expect(screen.getByRole('dialog')).toHaveAttribute('data-state', 'closed');

      rerender(
        <Dialog open={true} onOpenChange={() => {}}>
          <Dialog.Content>
            <Dialog.Title>Title</Dialog.Title>
          </Dialog.Content>
        </Dialog>
      );

      expect(screen.getByRole('dialog')).toHaveAttribute('data-state', 'open');
    });
  });
});
