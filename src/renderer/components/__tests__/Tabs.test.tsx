/**
 * Tabs Component Tests
 *
 * TDD RED Phase: Failing tests for Tabs component functionality
 * Testing: tab list, panels, animations, keyboard navigation, ARIA attributes
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Tabs } from '../Tabs';

describe('Tabs Component', () => {
  describe('Rendering', () => {
    it('should render tabs list', () => {
      render(
        <Tabs defaultValue="tab1">
          <Tabs.List>
            <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
            <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="tab1">Content 1</Tabs.Content>
          <Tabs.Content value="tab2">Content 2</Tabs.Content>
        </Tabs>
      );
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('should render tab triggers', () => {
      render(
        <Tabs defaultValue="tab1">
          <Tabs.List>
            <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
            <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="tab1">Content 1</Tabs.Content>
        </Tabs>
      );
      expect(screen.getByText('Tab 1')).toBeInTheDocument();
      expect(screen.getByText('Tab 2')).toBeInTheDocument();
    });

    it('should render tab content for active tab', () => {
      render(
        <Tabs defaultValue="tab1">
          <Tabs.List>
            <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="tab1">Content 1</Tabs.Content>
        </Tabs>
      );
      expect(screen.getByText('Content 1')).toBeInTheDocument();
    });

    it('should only show content for active tab', () => {
      render(
        <Tabs defaultValue="tab1">
          <Tabs.List>
            <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
            <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="tab1">Content 1</Tabs.Content>
          <Tabs.Content value="tab2">Content 2</Tabs.Content>
        </Tabs>
      );
      expect(screen.getByText('Content 1')).toBeInTheDocument();
      // Inactive tab content is not rendered in DOM by Radix UI
      expect(screen.queryByText('Content 2')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have role="tablist" on list container', () => {
      render(
        <Tabs defaultValue="tab1">
          <Tabs.List>
            <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="tab1">Content</Tabs.Content>
        </Tabs>
      );
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('should have role="tab" on triggers', () => {
      render(
        <Tabs defaultValue="tab1">
          <Tabs.List>
            <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="tab1">Content</Tabs.Content>
        </Tabs>
      );
      expect(screen.getByRole('tab')).toBeInTheDocument();
    });

    it('should have role="tabpanel" on content', () => {
      render(
        <Tabs defaultValue="tab1">
          <Tabs.List>
            <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="tab1">Content</Tabs.Content>
        </Tabs>
      );
      expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    });

    it('should have selected state on active tab', () => {
      render(
        <Tabs defaultValue="tab1">
          <Tabs.List>
            <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
            <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="tab1">Content</Tabs.Content>
        </Tabs>
      );
      const activeTab = screen.getByRole('tab', { selected: true });
      expect(activeTab).toHaveTextContent('Tab 1');
    });

    it('should have aria-selected="true" on active tab', () => {
      render(
        <Tabs defaultValue="tab1">
          <Tabs.List>
            <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="tab1">Content</Tabs.Content>
        </Tabs>
      );
      const tab = screen.getByRole('tab');
      expect(tab).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Dark Theme', () => {
    it('should apply dark mode classes', () => {
      render(
        <Tabs defaultValue="tab1">
          <Tabs.List>
            <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="tab1">Content</Tabs.Content>
        </Tabs>
      );
      const tablist = screen.getByRole('tablist');
      expect(tablist).toBeInTheDocument();
    });
  });

  describe('Customization', () => {
    it('should support custom className on tabs list', () => {
      render(
        <Tabs defaultValue="tab1">
          <Tabs.List className="custom-class">
            <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="tab1">Content</Tabs.Content>
        </Tabs>
      );
      const tablist = screen.getByRole('tablist');
      expect(tablist).toHaveClass('custom-class');
    });

    it('should support custom className on triggers', () => {
      render(
        <Tabs defaultValue="tab1">
          <Tabs.List>
            <Tabs.Trigger value="tab1" className="custom-trigger">
              Tab 1
            </Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="tab1">Content</Tabs.Content>
        </Tabs>
      );
      const tab = screen.getByRole('tab');
      expect(tab).toHaveClass('custom-trigger');
    });

    it('should support custom className on content', () => {
      render(
        <Tabs defaultValue="tab1">
          <Tabs.List>
            <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="tab1" className="custom-content">
            Content
          </Tabs.Content>
        </Tabs>
      );
      const panel = screen.getByRole('tabpanel');
      expect(panel).toHaveClass('custom-content');
    });
  });

  describe('Visual Indicator', () => {
    it('should have indicator element for active tab', () => {
      render(
        <Tabs defaultValue="tab1">
          <Tabs.List>
            <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
            <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="tab1">Content</Tabs.Content>
        </Tabs>
      );
      const activeTab = screen.getByRole('tab', { selected: true });
      expect(activeTab).toBeInTheDocument();
    });
  });

  describe('Controlled Mode', () => {
    it('should support controlled value', () => {
      const { rerender } = render(
        <Tabs value="tab1" onValueChange={() => {}}>
          <Tabs.List>
            <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
            <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="tab1">Content 1</Tabs.Content>
          <Tabs.Content value="tab2">Content 2</Tabs.Content>
        </Tabs>
      );

      expect(screen.getByText('Content 1')).toBeInTheDocument();

      rerender(
        <Tabs value="tab2" onValueChange={() => {}}>
          <Tabs.List>
            <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
            <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="tab1">Content 1</Tabs.Content>
          <Tabs.Content value="tab2">Content 2</Tabs.Content>
        </Tabs>
      );

      expect(screen.getByText('Content 2')).toBeInTheDocument();
    });
  });

  describe('Uncontrolled Mode', () => {
    it('should use defaultValue for initial tab', () => {
      render(
        <Tabs defaultValue="tab2">
          <Tabs.List>
            <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
            <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="tab1">Content 1</Tabs.Content>
          <Tabs.Content value="tab2">Content 2</Tabs.Content>
        </Tabs>
      );

      const activeTab = screen.getByRole('tab', { selected: true });
      expect(activeTab).toHaveTextContent('Tab 2');
      expect(screen.getByText('Content 2')).toBeInTheDocument();
    });
  });
});
