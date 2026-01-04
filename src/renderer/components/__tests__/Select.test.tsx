/**
 * Select Component Tests
 *
 * TDD RED Phase: Failing tests for Select component functionality
 * Testing: dropdown, search/filter, single/multi-select, keyboard navigation, ARIA attributes
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Select } from '../Select';

describe('Select Component', () => {
  describe('Rendering', () => {
    it('should render select trigger', () => {
      render(
        <Select value="option1" onValueChange={() => {}}>
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="option1">Option 1</Select.Item>
            <Select.Item value="option2">Option 2</Select.Item>
          </Select.Content>
        </Select>
      );
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should render select value placeholder when no value', () => {
      render(
        <Select value={undefined} onValueChange={() => {}}>
          <Select.Trigger>
            <Select.Value placeholder="Select an option" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="option1">Option 1</Select.Item>
          </Select.Content>
        </Select>
      );
      expect(screen.getByText('Select an option')).toBeInTheDocument();
    });

    it('should render selected value', () => {
      render(
        <Select value="option1" onValueChange={() => {}}>
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="option1">Option 1</Select.Item>
          </Select.Content>
        </Select>
      );
      expect(screen.getByText('Option 1')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have role="combobox" on trigger', () => {
      render(
        <Select value={undefined} onValueChange={() => {}}>
          <Select.Trigger>
            <Select.Value placeholder="Select" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="option1">Option 1</Select.Item>
          </Select.Content>
        </Select>
      );
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should have proper ARIA attributes', () => {
      render(
        <Select value="option1" onValueChange={() => {}}>
          <Select.Trigger aria-label="Select option">
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="option1">Option 1</Select.Item>
          </Select.Content>
        </Select>
      );
      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveAttribute('aria-label', 'Select option');
    });
  });

  describe('Dark Theme', () => {
    it('should apply dark mode classes', () => {
      render(
        <Select value="option1" onValueChange={() => {}}>
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="option1">Option 1</Select.Item>
          </Select.Content>
        </Select>
      );
      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveClass('dark:border-zinc-800');
    });
  });

  describe('Customization', () => {
    it('should support custom className on trigger', () => {
      render(
        <Select value="option1" onValueChange={() => {}}>
          <Select.Trigger className="custom-class">
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="option1">Option 1</Select.Item>
          </Select.Content>
        </Select>
      );
      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveClass('custom-class');
    });

    it('should support disabled state', () => {
      render(
        <Select value="option1" onValueChange={() => {}} disabled>
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="option1">Option 1</Select.Item>
          </Select.Content>
        </Select>
      );
      const trigger = screen.getByRole('combobox');
      expect(trigger).toBeDisabled();
    });
  });

  describe('Select Items', () => {
    it('should render selected item text', () => {
      render(
        <Select value="option1" onValueChange={() => {}}>
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="option1">Option 1</Select.Item>
          </Select.Content>
        </Select>
      );
      expect(screen.getByText('Option 1')).toBeInTheDocument();
    });
  });

  describe('Trigger Icon', () => {
    it('should render dropdown icon in trigger', () => {
      render(
        <Select value="option1" onValueChange={() => {}}>
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="option1">Option 1</Select.Item>
          </Select.Content>
        </Select>
      );
      const trigger = screen.getByRole('combobox');
      const icon = trigger.querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('fill', 'none');
    });
  });
});

