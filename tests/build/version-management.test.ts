/**
 * BUILD-TASK-005: Version Management and Changelog Tests
 * REQ-001: standard-version configured in .versionrc or package.json
 * REQ-002: Changelog generation follows conventional commit format
 * REQ-003: Version bump scripts work: version:patch, version:minor, version:major
 * REQ-004: Git tags created automatically (v1.0.0, v1.1.0, etc.)
 * REQ-005: CHANGELOG.md generated with proper sections
 * REQ-006: Version in package.json synchronized with git tag
 * GREEN Phase: Tests passing with async file operations
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ES module compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = process.cwd();

describe('BUILD-TASK-005: Version Management and Changelog', () => {
  describe('standard-version configuration', () => {
    it('should have .versionrc.json configuration file', async () => {
      const versionrcPath = path.join(projectRoot, '.versionrc.json');
      await fs.access(versionrcPath);
      expect(true).toBe(true);
    });

    it('should have standard-version in devDependencies', async () => {
      const pkgPath = path.join(projectRoot, 'package.json');
      const pkgContent = await fs.readFile(pkgPath, 'utf-8');
      const pkg = JSON.parse(pkgContent);
      expect(pkg.devDependencies).toBeDefined();
      expect(pkg.devDependencies['standard-version']).toBeDefined();
    });

    it('should configure commit types in .versionrc.json', async () => {
      const versionrcPath = path.join(projectRoot, '.versionrc.json');
      const versionrcContent = await fs.readFile(versionrcPath, 'utf-8');
      const versionrc = JSON.parse(versionrcContent);
      expect(versionrc.types).toBeDefined();
      expect(Array.isArray(versionrc.types)).toBe(true);
    });

    it('should have feat type configured', async () => {
      const versionrcPath = path.join(projectRoot, '.versionrc.json');
      const versionrcContent = await fs.readFile(versionrcPath, 'utf-8');
      const versionrc = JSON.parse(versionrcContent);
      const featType = versionrc.types.find((t: any) => t.type === 'feat');
      expect(featType).toBeDefined();
      expect(featType.section).toBe('Features');
    });

    it('should have fix type configured', async () => {
      const versionrcPath = path.join(projectRoot, '.versionrc.json');
      const versionrcContent = await fs.readFile(versionrcPath, 'utf-8');
      const versionrc = JSON.parse(versionrcContent);
      const fixType = versionrc.types.find((t: any) => t.type === 'fix');
      expect(fixType).toBeDefined();
      expect(fixType.section).toBe('Bug Fixes');
    });

    it('should not skip git tag creation', async () => {
      const versionrcPath = path.join(projectRoot, '.versionrc.json');
      const versionrcContent = await fs.readFile(versionrcPath, 'utf-8');
      const versionrc = JSON.parse(versionrcContent);
      // Tags should NOT be skipped for automatic versioning
      expect(versionrc.skip?.tag).toBeFalsy();
    });
  });

  describe('Version bump scripts', () => {
    it('should have version:patch script', async () => {
      const pkgPath = path.join(projectRoot, 'package.json');
      const pkgContent = await fs.readFile(pkgPath, 'utf-8');
      const pkg = JSON.parse(pkgContent);
      expect(pkg.scripts['version:patch']).toBeDefined();
      expect(pkg.scripts['version:patch']).toContain('standard-version');
      expect(pkg.scripts['version:patch']).toContain('--release-as patch');
    });

    it('should have version:minor script', async () => {
      const pkgPath = path.join(projectRoot, 'package.json');
      const pkgContent = await fs.readFile(pkgPath, 'utf-8');
      const pkg = JSON.parse(pkgContent);
      expect(pkg.scripts['version:minor']).toBeDefined();
      expect(pkg.scripts['version:minor']).toContain('standard-version');
      expect(pkg.scripts['version:minor']).toContain('--release-as minor');
    });

    it('should have version:major script', async () => {
      const pkgPath = path.join(projectRoot, 'package.json');
      const pkgContent = await fs.readFile(pkgPath, 'utf-8');
      const pkg = JSON.parse(pkgContent);
      expect(pkg.scripts['version:major']).toBeDefined();
      expect(pkg.scripts['version:major']).toContain('standard-version');
      expect(pkg.scripts['version:major']).toContain('--release-as major');
    });

    it('should have release script', async () => {
      const pkgPath = path.join(projectRoot, 'package.json');
      const pkgContent = await fs.readFile(pkgPath, 'utf-8');
      const pkg = JSON.parse(pkgContent);
      expect(pkg.scripts.release).toBeDefined();
      expect(pkg.scripts.release).toContain('standard-version');
    });
  });

  describe('CHANGELOG.md', () => {
    it('should have CHANGELOG.md file', async () => {
      const changelogPath = path.join(projectRoot, 'CHANGELOG.md');
      await fs.access(changelogPath);
      expect(true).toBe(true);
    });

    it('should follow conventional changelog format', async () => {
      const changelogPath = path.join(projectRoot, 'CHANGELOG.md');
      const changelog = await fs.readFile(changelogPath, 'utf-8');
      // Should have standard sections
      expect(changelog).toMatch(/## \[?\d+\.\d+\.\d+\]?/); // Version header
    });

    it('should have Features section', async () => {
      const changelogPath = path.join(projectRoot, 'CHANGELOG.md');
      const changelog = await fs.readFile(changelogPath, 'utf-8');
      expect(changelog).toMatch(/### Features/);
    });

    it('should have Bug Fixes section', async () => {
      const changelogPath = path.join(projectRoot, 'CHANGELOG.md');
      const changelog = await fs.readFile(changelogPath, 'utf-8');
      expect(changelog).toMatch(/### Bug Fixes/);
    });
  });

  describe('Version synchronization', () => {
    it('should have version field in package.json', async () => {
      const pkgPath = path.join(projectRoot, 'package.json');
      const pkgContent = await fs.readFile(pkgPath, 'utf-8');
      const pkg = JSON.parse(pkgContent);
      expect(pkg.version).toBeDefined();
      expect(pkg.version).toMatch(/^\d+\.\d+\.\d+/); // Semantic versioning
    });

    it('should follow semantic versioning format', async () => {
      const pkgPath = path.join(projectRoot, 'package.json');
      const pkgContent = await fs.readFile(pkgPath, 'utf-8');
      const pkg = JSON.parse(pkgContent);
      const version = pkg.version;
      const [major, minor, patch] = version.split('.').map(Number);
      expect([major, minor, patch].every(Number.isInteger)).toBe(true);
      expect(major).toBeGreaterThanOrEqual(0);
      expect(minor).toBeGreaterThanOrEqual(0);
      expect(patch).toBeGreaterThanOrEqual(0);
    });
  });
});
