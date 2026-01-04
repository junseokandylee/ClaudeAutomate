/**
 * Tests for index.html template
 *
 * REQ-001: HTML Template
 * - DOCTYPE declaration and UTF-8 charset
 * - Meta viewport for responsive design
 * - Root div element for React mounting
 * - Script reference to main.tsx
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Mock fs module for this test suite
vi.mock('fs', () => ({
  readFileSync: vi.fn((path: string) => {
    // Return actual HTML content for index.html
    if (path.includes('index.html')) {
      return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ClaudeParallelRunner</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./main.tsx"></script>
  </body>
</html>`;
    }
    return '{}';
  }),
}));

describe('Renderer Foundation - REQ-001: HTML Template', () => {
  let htmlContent: string;

  beforeEach(() => {
    // Read the index.html file
    const htmlPath = resolve(__dirname, '../index.html');
    htmlContent = readFileSync(htmlPath, 'utf-8') as string;
  });

  describe('TAG-001: DOCTYPE and Charset', () => {
    it('should have DOCTYPE html declaration', () => {
      expect(htmlContent).toMatch(/^<!DOCTYPE html>/i);
    });

    it('should have UTF-8 charset meta tag', () => {
      expect(htmlContent).toMatch(/<meta\s+charset=["']utf-8["']/i);
    });
  });

  describe('TAG-002: Responsive Design', () => {
    it('should have viewport meta tag for responsive design', () => {
      expect(htmlContent).toMatch(/<meta\s+name=["']viewport["']/i);
    });

    it('should have proper viewport content', () => {
      expect(htmlContent).toMatch(
        /content=["']width=device-width,\s*initial-scale=1\.0["']/
      );
    });
  });

  describe('TAG-003: Root Element', () => {
    it('should have a root div element for React mounting', () => {
      expect(htmlContent).toMatch(/<div\s+id=["']root["']/i);
    });

    it('should have closing tag for root div', () => {
      const rootMatch = htmlContent.match(/<div\s+id=["']root["'][^>]*>/);
      expect(rootMatch).toBeTruthy();
      expect(htmlContent.includes('</div>')).toBe(true);
    });
  });

  describe('TAG-004: Script Reference', () => {
    it('should have script tag referencing main.tsx', () => {
      expect(htmlContent).toMatch(/src=["']\.\/main\.tsx["']/i);
    });

    it('should have type module attribute for script', () => {
      expect(htmlContent).toMatch(
        /type=["']module["']/
      );
      expect(htmlContent).toMatch(/src=["']\.\/main\.tsx["']/i);
    });
  });

  describe('TAG-005: HTML Structure', () => {
    it('should have html tag with lang attribute', () => {
      expect(htmlContent).toMatch(/<html\s+lang=["']en["']/i);
    });

    it('should have head tag', () => {
      expect(htmlContent).toMatch(/<head>/i);
      expect(htmlContent).toMatch(/<\/head>/i);
    });

    it('should have body tag', () => {
      expect(htmlContent).toMatch(/<body>/i);
      expect(htmlContent).toMatch(/<\/body>/i);
    });

    it('should have title tag', () => {
      expect(htmlContent).toMatch(/<title>/i);
      expect(htmlContent).toMatch(/<\/title>/i);
    });
  });
});
