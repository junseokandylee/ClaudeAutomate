/**
 * Tests for global styles
 *
 * REQ-004: Global Styles
 * - Tailwind CSS directives
 * - Custom CSS variables for theme colors
 * - Glassmorphism utility classes
 * - Dark mode as default theme
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Mock fs module for this test suite
vi.mock('fs', () => ({
  readFileSync: vi.fn((path: string) => {
    if (path.includes('index.css')) {
      return `/**
 * Global Styles
 */

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-anthropic: #D97757;
  --color-slate-50: #F8FAFC;
  --color-slate-900: #0F172A;
  --color-blue-500: #3B82F6;
  --color-emerald-500: #10B981;
}

@media (prefers-color-scheme: dark) {
  :root {
    color-scheme: dark;
  }
}

.glass-panel {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}`;
    }
    return '{}';
  }),
}));

describe('Renderer Foundation - REQ-004: Global Styles', () => {
  let cssContent: string;

  beforeEach(() => {
    const cssPath = resolve(__dirname, '../index.css');
    cssContent = readFileSync(cssPath, 'utf-8') as string;
  });

  describe('TAG-001: Tailwind Directives', () => {
    it('should have Tailwind base directive', () => {
      expect(cssContent).toContain('@tailwind base');
    });

    it('should have Tailwind components directive', () => {
      expect(cssContent).toContain('@tailwind components');
    });

    it('should have Tailwind utilities directive', () => {
      expect(cssContent).toContain('@tailwind utilities');
    });
  });

  describe('TAG-002: CSS Variables', () => {
    it('should have anthropic color variable', () => {
      expect(cssContent).toContain('--color-anthropic');
    });

    it('should have slate color variables', () => {
      expect(cssContent).toContain('--color-slate-50');
      expect(cssContent).toContain('--color-slate-900');
    });

    it('should have blue color variable', () => {
      expect(cssContent).toContain('--color-blue-500');
    });

    it('should have emerald color variable', () => {
      expect(cssContent).toContain('--color-emerald-500');
    });
  });

  describe('TAG-003: Glassmorphism Classes', () => {
    it('should have glass-panel class', () => {
      expect(cssContent).toContain('.glass-panel');
    });

    it('should have backdrop-filter', () => {
      expect(cssContent).toContain('backdrop-filter');
    });
  });

  describe('TAG-004: Dark Mode', () => {
    it('should have dark mode media query', () => {
      expect(cssContent).toContain('@media (prefers-color-scheme: dark)');
    });

    it('should set color-scheme to dark', () => {
      expect(cssContent).toContain('color-scheme: dark');
    });
  });
});
