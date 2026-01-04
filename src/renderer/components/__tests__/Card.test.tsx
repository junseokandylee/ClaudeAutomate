/**
 * Card Component Tests
 *
 * TDD RED Phase: Failing tests for Card component functionality
 * Testing: glassmorphism styling, slots, hover effects, customization
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from '../Card';

describe('Card Component', () => {
  describe('Rendering', () => {
    it('should render card container', () => {
      render(<Card>Card content</Card>);
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('should render card with header', () => {
      render(
        <Card>
          <Card.Header>Card Title</Card.Header>
        </Card>
      );
      expect(screen.getByText('Card Title')).toBeInTheDocument();
    });

    it('should render card with content', () => {
      render(
        <Card>
          <Card.Content>Card content here</Card.Content>
        </Card>
      );
      expect(screen.getByText('Card content here')).toBeInTheDocument();
    });

    it('should render card with footer', () => {
      render(
        <Card>
          <Card.Footer>Card footer</Card.Footer>
        </Card>
      );
      expect(screen.getByText('Card footer')).toBeInTheDocument();
    });

    it('should render complete card with all slots', () => {
      render(
        <Card>
          <Card.Header>Title</Card.Header>
          <Card.Content>Content</Card.Content>
          <Card.Footer>Footer</Card.Footer>
        </Card>
      );
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
      expect(screen.getByText('Footer')).toBeInTheDocument();
    });
  });

  describe('Glassmorphism Styling', () => {
    it('should apply glassmorphism background with backdrop blur', () => {
      render(<Card>Glass card</Card>);
      const card = screen.getByText('Glass card').closest('div');
      expect(card).toHaveClass('bg-white/10');
      expect(card).toHaveClass('backdrop-blur-lg');
    });

    it('should apply border with transparency', () => {
      render(<Card>Bordered card</Card>);
      const card = screen.getByText('Bordered card').closest('div');
      expect(card).toHaveClass('border');
      expect(card).toHaveClass('border-white/20');
    });
  });

  describe('Dark Theme', () => {
    it('should apply dark mode classes', () => {
      render(<Card>Dark themed</Card>);
      const card = screen.getByText('Dark themed').closest('div');
      expect(card).toHaveClass('dark:bg-black/40');
    });
  });

  describe('Hover Effects', () => {
    it('should have hover effect classes', () => {
      render(<Card>Hoverable</Card>);
      const card = screen.getByText('Hoverable').closest('div');
      expect(card).toHaveClass('hover:bg-white/15');
    });
  });

  describe('Customization', () => {
    it('should support custom className', () => {
      render(<Card className="custom-class">Custom</Card>);
      const card = screen.getByText('Custom').closest('div');
      expect(card).toHaveClass('custom-class');
    });

    it('should support different padding variants', () => {
      render(<Card padding="lg">Large padding</Card>);
      const card = screen.getByText('Large padding').closest('div');
      expect(card).toHaveClass('p-8');
    });

    it('should support different border radius variants', () => {
      render(<Card radius="lg">Large radius</Card>);
      const card = screen.getByText('Large radius').closest('div');
      expect(card).toHaveClass('rounded-lg');
    });
  });

  describe('Framer Motion Animations', () => {
    it('should have motion wrapper for animations', () => {
      render(<Card>Animated card</Card>);
      const card = screen.getByText('Animated card').closest('div');
      expect(card).toBeInTheDocument();
    });

    it('should support hover animation scale effect', () => {
      render(<Card hover="lift">Scale on hover</Card>);
      const card = screen.getByText('Scale on hover').closest('div');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should support semantic HTML elements', () => {
      render(
        <Card>
          <Card.Header as="h2">Heading</Card.Header>
        </Card>
      );
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Heading');
    });

    it('should pass through ARIA attributes', () => {
      render(<Card aria-label="Card content">Content</Card>);
      const card = screen.getByLabelText('Card content');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Header Component', () => {
    it('should render header with proper spacing', () => {
      render(
        <Card>
          <Card.Header>Header text</Card.Header>
        </Card>
      );
      const header = screen.getByText('Header text');
      expect(header).toHaveClass('p-6');
      expect(header).toHaveClass('pb-4');
    });

    it('should support header description', () => {
      render(
        <Card>
          <Card.Header title="Title" description="Description" />
        </Card>
      );
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
    });
  });

  describe('Content Component', () => {
    it('should render content with proper padding', () => {
      render(
        <Card>
          <Card.Content>Content text</Card.Content>
        </Card>
      );
      const content = screen.getByText('Content text');
      expect(content).toHaveClass('p-6');
      expect(content).toHaveClass('pt-0');
    });
  });

  describe('Footer Component', () => {
    it('should render footer with proper spacing', () => {
      render(
        <Card>
          <Card.Footer>Footer text</Card.Footer>
        </Card>
      );
      const footer = screen.getByText('Footer text');
      expect(footer).toHaveClass('p-6');
      expect(footer).toHaveClass('pt-4');
    });

    it('should align footer items flexibly', () => {
      render(
        <Card>
          <Card.Footer>Footer actions</Card.Footer>
        </Card>
      );
      const footer = screen.getByText('Footer actions');
      expect(footer).toHaveClass('flex');
      expect(footer).toHaveClass('items-center');
    });
  });
});
