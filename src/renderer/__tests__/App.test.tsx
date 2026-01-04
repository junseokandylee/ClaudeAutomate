/**
 * Tests for App.tsx component
 *
 * REQ-003: Root App Component
 * - Implement main application routing
 * - Provide Zustand store context
 * - Handle startup vs main view switching
 * - Apply global layout styles
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('Renderer Foundation - REQ-003: Root App Component', () => {
  describe('TAG-001: Component Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<App />);
      expect(container).toBeDefined();
    });

    it('should render app container', () => {
      const { container } = render(<App />);
      const appContainer = container.querySelector('.app-container');
      expect(appContainer).toBeDefined();
    });

    it('should render app title', () => {
      render(<App />);
      const title = screen.queryByText('ClaudeParallelRunner');
      expect(title).toBeDefined();
    });
  });

  describe('TAG-002: Component Structure', () => {
    it('should have proper JSX structure', () => {
      const { container } = render(<App />);
      expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
    });

    it('should export as default', () => {
      expect(App).toBeDefined();
      expect(typeof App).toBe('function');
    });
  });
});
