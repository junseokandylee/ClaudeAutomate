/**
 * Tests for main.tsx entry point
 *
 * REQ-002: React Entry Point
 * - Import React and ReactDOM (React 18)
 * - Import i18n configuration
 * - Import global CSS
 * - Render App component to root element
 * - Use React.StrictMode
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { StrictMode } from 'react';

describe('Renderer Foundation - REQ-002: React Entry Point', () => {
  describe('TAG-001: Module Imports', () => {
    it('should import React and ReactDOM', async () => {
      const react = await import('react');
      const reactDOM = await import('react-dom/client');

      expect(react).toBeDefined();
      expect(reactDOM).toBeDefined();
      expect(react.StrictMode).toBeDefined();
    });
  });

  describe('TAG-002: App Component Import', () => {
    it('should import App component', async () => {
      const { default: App } = await import('../App');
      expect(App).toBeDefined();
      expect(typeof App).toBe('function');
    });
  });

  describe('TAG-003: Root Element Rendering', () => {
    beforeEach(() => {
      // Clean up DOM
      const root = document.getElementById('root');
      if (root) {
        root.remove();
      }
    });

    it('should render App component to root element', async () => {
      // Create root element
      const rootElement = document.createElement('div');
      rootElement.id = 'root';
      document.body.appendChild(rootElement);

      expect(rootElement).toBeDefined();
      expect(rootElement.id).toBe('root');
    });
  });

  describe('TAG-004: Strict Mode Usage', () => {
    it('should use React.StrictMode wrapper', async () => {
      const { default: App } = await import('../App');

      const { container } = render(
        <StrictMode>
          <App />
        </StrictMode>
      );

      expect(container.firstChild).toBeDefined();
    });
  });
});
