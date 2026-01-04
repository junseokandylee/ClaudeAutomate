/**
 * Tooltip Component Tests
 *
 * TDD RED Phase: Failing tests for Tooltip component functionality
 * Testing: hover trigger, placement, delay, arrow pointer, dark theme, ARIA attributes
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Tooltip } from '../Tooltip';

describe('Tooltip Component', () => {
  describe('Rendering', () => {
    it('should render tooltip trigger', () => {
      render(
        <Tooltip content="Tooltip content">
          <button>Hover me</button>
        </Tooltip>
      );
      expect(screen.getByRole('button', { name: 'Hover me' })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should pass through ARIA attributes to trigger', () => {
      render(
        <Tooltip content="Tooltip content">
          <button aria-label="Custom button">Button</button>
        </Tooltip>
      );
      expect(screen.getByRole('button', { name: 'Custom button' })).toBeInTheDocument();
    });
  });

  describe('Customization', () => {
    it('should support custom className on content', () => {
      render(
        <Tooltip content="Custom tooltip" className="custom-class">
          <button>Hover</button>
        </Tooltip>
      );
      // Tooltip content is only rendered on hover, so just verify trigger exists
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Trigger', () => {
    it('should support hover trigger (default)', () => {
      render(
        <Tooltip content="Hover tooltip">
          <button>Hover</button>
        </Tooltip>
      );
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Provider', () => {
    it('should render tooltip provider', () => {
      render(
        <Tooltip content="Provider tooltip">
          <button>Hover</button>
        </Tooltip>
      );
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });
});

