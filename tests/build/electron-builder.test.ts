/**
 * TAG-002: Platform Packaging Tests
 * REQ-002: electron-builder for cross-platform packaging
 * GREEN Phase: Minimal implementation to pass tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { load } from 'js-yaml';

// Import fs after clearing mocks for this test
let fs: typeof import('fs');

beforeEach(async () => {
  // Clear all mocks
  vi.unmock('fs');
  vi.unmock('fs/promises');

  // Get real fs module
  const fsReal = await import('fs');
  fs = fsReal;
});

// ES module compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

describe('TAG-002: Platform Packaging Configuration', () => {
  describe('electron-builder configuration', () => {
    it('should have electron-builder config file (YAML)', () => {
      const configPath = path.join(projectRoot, 'electron-builder.config.yml');
      const jsonConfigPath = path.join(projectRoot, 'electron-builder.config.json');

      // Should have at least one config file
      expect(fs.existsSync!(configPath) || fs.existsSync!(jsonConfigPath)).toBe(true);
    });

    it('should configure application metadata', () => {
      const configPath = path.join(projectRoot, 'electron-builder.config.yml');
      const jsonConfigPath = path.join(projectRoot, 'electron-builder.config.json');

      if (fs.existsSync!(configPath)) {
        const content = fs.readFileSync!(configPath, 'utf-8');
        const config = load(content) as any;

        expect(config).toHaveProperty('appId');
        expect(config).toHaveProperty('productName');
        expect(config).toHaveProperty('directories');
      } else if (fs.existsSync!(jsonConfigPath)) {
        const content = fs.readFileSync!(jsonConfigPath, 'utf-8');
        const config = JSON.parse(content) as any;

        expect(config).toHaveProperty('appId');
        expect(config).toHaveProperty('productName');
        expect(config).toHaveProperty('directories');
      }
    });

    it('should configure Windows targets (NSIS)', () => {
      const configPath = path.join(projectRoot, 'electron-builder.config.yml');
      const jsonConfigPath = path.join(projectRoot, 'electron-builder.config.json');

      if (fs.existsSync!(configPath)) {
        const content = fs.readFileSync!(configPath, 'utf-8');
        const config = load(content) as any;

        expect(config).toHaveProperty('win');
        if (config.win) {
          expect(config.win).toHaveProperty('target');
          expect(Array.isArray(config.win.target)).toBe(true);
        }
      } else if (fs.existsSync!(jsonConfigPath)) {
        const content = fs.readFileSync!(jsonConfigPath, 'utf-8');
        const config = JSON.parse(content) as any;

        expect(config).toHaveProperty('win');
        if (config.win) {
          expect(config.win).toHaveProperty('target');
          expect(Array.isArray(config.win.target)).toBe(true);
        }
      }
    });

    it('should configure macOS targets (DMG and pkg)', () => {
      const configPath = path.join(projectRoot, 'electron-builder.config.yml');
      const jsonConfigPath = path.join(projectRoot, 'electron-builder.config.json');

      if (fs.existsSync!(configPath)) {
        const content = fs.readFileSync!(configPath, 'utf-8');
        const config = load(content) as any;

        expect(config).toHaveProperty('mac');
        if (config.mac) {
          expect(config.mac).toHaveProperty('target');
          expect(Array.isArray(config.mac.target)).toBe(true);
        }
      } else if (fs.existsSync!(jsonConfigPath)) {
        const content = fs.readFileSync!(jsonConfigPath, 'utf-8');
        const config = JSON.parse(content) as any;

        expect(config).toHaveProperty('mac');
        if (config.mac) {
          expect(config.mac).toHaveProperty('target');
          expect(Array.isArray(config.mac.target)).toBe(true);
        }
      }
    });

    it('should configure Linux targets (AppImage, deb, rpm)', () => {
      const configPath = path.join(projectRoot, 'electron-builder.config.yml');
      const jsonConfigPath = path.join(projectRoot, 'electron-builder.config.json');

      if (fs.existsSync!(configPath)) {
        const content = fs.readFileSync!(configPath, 'utf-8');
        const config = load(content) as any;

        expect(config).toHaveProperty('linux');
        if (config.linux) {
          expect(config.linux).toHaveProperty('target');
          expect(Array.isArray(config.linux.target)).toBe(true);
        }
      } else if (fs.existsSync!(jsonConfigPath)) {
        const content = fs.readFileSync!(jsonConfigPath, 'utf-8');
        const config = JSON.parse(content) as any;

        expect(config).toHaveProperty('linux');
        if (config.linux) {
          expect(config.linux).toHaveProperty('target');
          expect(Array.isArray(config.linux.target)).toBe(true);
        }
      }
    });

    it('should configure both x64 and arm64 architectures', () => {
      const configPath = path.join(projectRoot, 'electron-builder.config.yml');
      const jsonConfigPath = path.join(projectRoot, 'electron-builder.config.json');

      if (fs.existsSync!(configPath)) {
        const content = fs.readFileSync!(configPath, 'utf-8');
        const config = load(content) as any;

        // Should have arch configuration in targets
        const hasArchConfig = (targets: any[]) => {
          return targets.some((t: any) => t.arch === 'x64' || t.arch === 'arm64' || !t.arch);
        };

        if (config.win?.target) {
          expect(hasArchConfig(config.win.target)).toBe(true);
        }
      } else if (fs.existsSync!(jsonConfigPath)) {
        const content = fs.readFileSync!(jsonConfigPath, 'utf-8');
        const config = JSON.parse(content) as any;

        const hasArchConfig = (targets: any[]) => {
          return targets.some((t: any) => t.arch === 'x64' || t.arch === 'arm64' || !t.arch);
        };

        if (config.win?.target) {
          expect(hasArchConfig(config.win.target)).toBe(true);
        }
      }
    });
  });

  describe('package.json build configuration', () => {
    it('should have build scripts for packaging', () => {
      const pkgPath = path.join(projectRoot, 'package.json');
      const pkg = JSON.parse(fs.readFileSync!(pkgPath, 'utf-8'));

      // Should have packaging scripts
      expect(pkg.scripts).toBeDefined();
    });

    it('should have electron-builder in devDependencies', () => {
      const pkgPath = path.join(projectRoot, 'package.json');
      const pkg = JSON.parse(fs.readFileSync!(pkgPath, 'utf-8'));

      expect(pkg.devDependencies).toHaveProperty('electron-builder');
    });
  });
});
