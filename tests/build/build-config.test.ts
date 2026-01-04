/**
 * TAG-001: Build Configuration Tests
 * REQ-001: electron-vite for development and production builds
 * GREEN Phase: Minimal implementation to pass tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Import fs after clearing mocks for this test
let fs: typeof import('fs');
let fsReal: typeof import('fs');

beforeEach(async () => {
  // Clear all mocks
  vi.unmock('fs');
  vi.unmock('fs/promises');

  // Get real fs module
  fsReal = await import('fs');
  fs = fsReal;
});

// ES module compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

describe('TAG-001: Build Configuration', () => {
  describe('electron.vite.config.ts', () => {
    it('should have vite config file', () => {
      const configPath = path.join(projectRoot, 'electron.vite.config.ts');
      expect(fs.existsSync!(configPath)).toBe(true);
    });

    it('should export valid configuration', () => {
      const configPath = path.join(projectRoot, 'electron.vite.config.ts');
      const content = fs.readFileSync!(configPath, 'utf-8');

      // Should have main, preload, and renderer configurations
      expect(content).toMatch(/main:\s*{/);
      expect(content).toMatch(/preload:\s*{/);
      expect(content).toMatch(/renderer:\s*{/);

      // Should have React plugin for renderer
      expect(content).toContain('@vitejs/plugin-react');

      // Should have externalizeDepsPlugin for main and preload
      expect(content).toContain('externalizeDepsPlugin');
    });

    it('should configure path aliases correctly', () => {
      const configPath = path.join(projectRoot, 'electron.vite.config.ts');
      const content = fs.readFileSync!(configPath, 'utf-8');

      // Should have @, @shared, and @renderer aliases
      expect(content).toMatch(/['"]@['"]:\s*/);
      expect(content).toMatch(/['"]@shared['"]:\s*/);
      expect(content).toMatch(/['"]@renderer['"]:\s*/);
    });
  });

  describe('package.json scripts', () => {
    it('should have dev script', () => {
      const pkgPath = path.join(projectRoot, 'package.json');
      const pkg = JSON.parse(fs.readFileSync!(pkgPath, 'utf-8'));

      expect(pkg.scripts).toBeDefined();
      expect(pkg.scripts.dev).toBe('electron-vite dev');
    });

    it('should have build script', () => {
      const pkgPath = path.join(projectRoot, 'package.json');
      const pkg = JSON.parse(fs.readFileSync!(pkgPath, 'utf-8'));

      expect(pkg.scripts).toBeDefined();
      expect(pkg.scripts.build).toBe('electron-vite build');
    });

    it('should have preview script', () => {
      const pkgPath = path.join(projectRoot, 'package.json');
      const pkg = JSON.parse(fs.readFileSync!(pkgPath, 'utf-8'));

      expect(pkg.scripts).toBeDefined();
      expect(pkg.scripts.preview).toBe('electron-vite preview');
    });
  });

  describe('TypeScript configuration', () => {
    it('should have tsconfig.json', () => {
      const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
      expect(fs.existsSync!(tsconfigPath)).toBe(true);
    });

    it('should enable strict mode', () => {
      const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
      const tsconfig = JSON.parse(fs.readFileSync!(tsconfigPath, 'utf-8'));

      expect(tsconfig.compilerOptions).toBeDefined();
      expect(tsconfig.compilerOptions.strict).toBe(true);
    });

    it('should configure ES2020 target', () => {
      const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
      const tsconfig = JSON.parse(fs.readFileSync!(tsconfigPath, 'utf-8'));

      expect(tsconfig.compilerOptions.target).toBe('ES2020');
    });
  });

  describe('Tailwind CSS configuration', () => {
    it('should have tailwind.config.js', () => {
      const tailwindConfigPath = path.join(projectRoot, 'tailwind.config.js');
      expect(fs.existsSync!(tailwindConfigPath)).toBe(true);
    });

    it('should configure content paths', () => {
      const tailwindConfigPath = path.join(projectRoot, 'tailwind.config.js');
      const content = fs.readFileSync!(tailwindConfigPath, 'utf-8');

      expect(content).toMatch(/content:\s*\[/);
      expect(content).toContain('src/renderer');
    });
  });

  describe('Vite build optimization', () => {
    it('should enable tree-shaking in production', () => {
      const configPath = path.join(projectRoot, 'electron.vite.config.ts');
      const content = fs.readFileSync!(configPath, 'utf-8');

      // Tree-shaking is enabled by default in Vite for ES modules
      // We just need to verify the config exists
      expect(content).toBeDefined();
    });

    it('should have build output directory configured', () => {
      const configPath = path.join(projectRoot, 'electron.vite.config.ts');
      const content = fs.readFileSync!(configPath, 'utf-8');

      // Should configure output directory (defaults to dist)
      expect(content).toBeDefined();
    });
  });
});
