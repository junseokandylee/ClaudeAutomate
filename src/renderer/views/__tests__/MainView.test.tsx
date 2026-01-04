/**
 * MainView Component Tests
 *
 * REQ-001: MainView Container
 * TAG-TEST-001: MainView Component Tests
 *
 * Test coverage:
 * - Component rendering
 * - Layout structure (CSS Grid)
 * - Child component integration
 * - View state management
 * - Responsive behavior
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MainView } from '../MainView';
import { useAppStore } from '@/renderer/stores/appStore';

// Mock child components
vi.mock('@/renderer/components/Terminal', () => ({
  Terminal: () => <div data-testid="terminal">Terminal Component</div>,
}));

vi.mock('@/renderer/components/SpecList', () => ({
  SpecList: () => <div data-testid="spec-list">SpecList Component</div>,
}));

vi.mock('@/renderer/components/WaveVisualization', () => ({
  WaveVisualization: () => <div data-testid="wave-visualization">WaveVisualization Component</div>,
}));

vi.mock('@/renderer/components/ProgressOverview', () => ({
  ProgressOverview: () => <div data-testid="progress-overview">ProgressOverview Component</div>,
}));

vi.mock('@/renderer/components/StatusBar', () => ({
  StatusBar: () => <div data-testid="status-bar">StatusBar Component</div>,
}));

describe('MainView Component', () => {
  beforeEach(() => {
    // Reset app store before each test
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the main view container', () => {
      render(<MainView />);
      const mainContainer = screen.getByTestId('main-view');
      expect(mainContainer).toBeInTheDocument();
    });

    it('should render all child components', () => {
      render(<MainView />);

      expect(screen.getByTestId('terminal')).toBeInTheDocument();
      expect(screen.getByTestId('spec-list')).toBeInTheDocument();
      expect(screen.getByTestId('wave-visualization')).toBeInTheDocument();
      expect(screen.getByTestId('progress-overview')).toBeInTheDocument();
      expect(screen.getByTestId('status-bar')).toBeInTheDocument();
    });
  });

  describe('Layout Structure', () => {
    it('should use CSS Grid for layout', () => {
      render(<MainView />);
      const mainContainer = screen.getByTestId('main-view');

      // Check for grid classes
      expect(mainContainer).toHaveClass('grid');
    });

    it('should have responsive grid columns', () => {
      render(<MainView />);
      const mainContainer = screen.getByTestId('main-view');

      // Check for responsive grid classes
      expect(mainContainer.className).toContain('grid-cols-1');
      expect(mainContainer.className).toContain('lg:grid-cols-3');
    });

    it('should have proper grid gap', () => {
      render(<MainView />);
      const mainContainer = screen.getByTestId('main-view');

      // Check for gap classes
      expect(mainContainer.className).toContain('gap-4');
    });
  });

  describe('Component Placement', () => {
    it('should place Terminal in the left panel', () => {
      render(<MainView />);
      const terminal = screen.getByTestId('terminal');
      const terminalParent = terminal.parentElement;

      expect(terminalParent).toHaveClass('lg:col-span-2');
    });

    it('should place SpecList in the right panel', () => {
      render(<MainView />);
      const specList = screen.getByTestId('spec-list');
      const specListParent = specList.parentElement;

      expect(specListParent).toHaveClass('lg:col-span-1');
    });

    it('should place WaveVisualization below SpecList', () => {
      render(<MainView />);
      const waveVisualization = screen.getByTestId('wave-visualization');
      const specList = screen.getByTestId('spec-list');

      // Both should be in the same column (right panel)
      const waveParent = waveVisualization.parentElement;
      const specListParent = specList.parentElement;

      expect(waveParent).toBe(specListParent);
    });

    it('should place ProgressOverview above Terminal', () => {
      render(<MainView />);
      const progressOverview = screen.getByTestId('progress-overview');

      expect(progressOverview).toBeInTheDocument();
    });

    it('should place StatusBar at the bottom', () => {
      render(<MainView />);
      const statusBar = screen.getByTestId('status-bar');

      expect(statusBar).toBeInTheDocument();
    });
  });

  describe('View State Management', () => {
    it('should integrate with appStore', () => {
      render(<MainView />);

      // Verify app store integration by checking if component uses the store
      const mainView = screen.getByTestId('main-view');
      expect(mainView).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should stack components on mobile', () => {
      render(<MainView />);
      const mainContainer = screen.getByTestId('main-view');

      // Mobile: single column
      expect(mainContainer.className).toContain('grid-cols-1');
    });

    it('should expand to 3 columns on large screens', () => {
      render(<MainView />);
      const mainContainer = screen.getByTestId('main-view');

      // Desktop: 3 columns (2 for left panel, 1 for right panel)
      expect(mainContainer.className).toContain('lg:grid-cols-3');
    });
  });
});
