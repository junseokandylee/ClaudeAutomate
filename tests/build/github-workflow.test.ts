/**
 * BUILD-TASK-003: GitHub Actions CI/CD Workflow Tests
 * REQ-001: Automated testing and building across all platforms
 * REQ-002: Triggers on push to tags (v*) and pull requests to main
 * REQ-003: Test job with npm ci, npm test, npm run test:coverage
 * REQ-004: Build job with matrix strategy for all platforms
 * REQ-005: Release job for tag-based releases
 * GREEN Phase: Tests passing with async file operations
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import yaml from 'js-yaml';

// ES module compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Use process.cwd() to get project root in test environment
const projectRoot = process.cwd();

// Helper function to read workflow
async function readWorkflow() {
  const workflowPath = path.resolve(projectRoot, '.github', 'workflows', 'build.yml');
  const content = await fs.readFile(workflowPath, 'utf-8');
  return yaml.load(content);
}

describe('BUILD-TASK-003: GitHub Actions CI/CD Workflow', () => {
  const workflowPath = path.resolve(projectRoot, '.github', 'workflows', 'build.yml');

  describe('Workflow file existence', () => {
    it('should have build.yml workflow file', async () => {
      await fs.access(workflowPath);
      expect(true).toBe(true);
    });

    it('should be valid YAML syntax', async () => {
      const content = await fs.readFile(workflowPath, 'utf-8');
      expect(() => yaml.load(content)).not.toThrow();
    });
  });

  describe('Workflow triggers', () => {
    it('should trigger on push to tags (v*)', async () => {
      const workflow = await readWorkflow();
      expect(workflow.on).toBeDefined();
      expect(workflow.on.push).toBeDefined();
      expect(workflow.on.push.tags).toContain('v*');
    });

    it('should trigger on pull requests to main branch', async () => {
      const workflow = await readWorkflow();
      expect(workflow.on).toBeDefined();
      expect(workflow.on.pull_request).toBeDefined();
      expect(workflow.on.pull_request.branches).toContain('main');
    });
  });

  describe('Test job configuration', () => {
    it('should have test job', async () => {
      const workflow = await readWorkflow();
      expect(workflow.jobs).toBeDefined();
      expect(workflow.jobs.test).toBeDefined();
    });

    it('should run test job on ubuntu-latest', async () => {
      const workflow = await readWorkflow();
      expect(workflow.jobs.test['runs-on']).toBe('ubuntu-latest');
    });

    it('should install dependencies with npm ci', async () => {
      const workflow = await readWorkflow();
      const installStep = workflow.jobs.test.steps.find(
        (step: any) => step.run === 'npm ci'
      );
      expect(installStep).toBeDefined();
    });

    it('should run tests with npm test', async () => {
      const workflow = await readWorkflow();
      const testStep = workflow.jobs.test.steps.find(
        (step: any) => step.run === 'npm test'
      );
      expect(testStep).toBeDefined();
    });

    it('should generate coverage with npm run test:coverage', async () => {
      const workflow = await readWorkflow();
      const coverageStep = workflow.jobs.test.steps.find(
        (step: any) => step.run === 'npm run test:coverage'
      );
      expect(coverageStep).toBeDefined();
    });
  });

  describe('Build job configuration', () => {
    it('should have build job', async () => {
      const workflow = await readWorkflow();
      expect(workflow.jobs).toBeDefined();
      expect(workflow.jobs.build).toBeDefined();
    });

    it('should use matrix strategy for platforms', async () => {
      const workflow = await readWorkflow();
      expect(workflow.jobs.build.strategy).toBeDefined();
      expect(workflow.jobs.build.strategy.matrix).toBeDefined();
      expect(workflow.jobs.build.strategy.matrix.os).toBeDefined();
    });

    it('should include all platforms in matrix', async () => {
      const workflow = await readWorkflow();
      const platforms = workflow.jobs.build.strategy.matrix.os;
      expect(platforms).toContain('macos-latest');
      expect(platforms).toContain('windows-latest');
      expect(platforms).toContain('ubuntu-latest');
    });

    it('should depend on test job', async () => {
      const workflow = await readWorkflow();
      expect(workflow.jobs.build.needs).toBeDefined();
      expect(workflow.jobs.build.needs).toContain('test');
    });

    it('should install dependencies with npm ci', async () => {
      const workflow = await readWorkflow();
      const installStep = workflow.jobs.build.steps.find(
        (step: any) => step.run === 'npm ci'
      );
      expect(installStep).toBeDefined();
    });

    it('should build with npm run build', async () => {
      const workflow = await readWorkflow();
      const buildStep = workflow.jobs.build.steps.find(
        (step: any) => step.run === 'npm run build'
      );
      expect(buildStep).toBeDefined();
    });
  });

  describe('Platform-specific packaging', () => {
    it('should package for macOS', async () => {
      const workflow = await readWorkflow();
      const packageStep = workflow.jobs.build.steps.find(
        (step: any) => step.run && step.run.includes('npm run package:mac')
      );
      expect(packageStep).toBeDefined();
    });

    it('should package for Windows', async () => {
      const workflow = await readWorkflow();
      const packageStep = workflow.jobs.build.steps.find(
        (step: any) => step.run && step.run.includes('npm run package:win')
      );
      expect(packageStep).toBeDefined();
    });

    it('should package for Linux', async () => {
      const workflow = await readWorkflow();
      const packageStep = workflow.jobs.build.steps.find(
        (step: any) => step.run && step.run.includes('npm run package:linux')
      );
      expect(packageStep).toBeDefined();
    });
  });

  describe('Build artifacts', () => {
    it('should upload build artifacts', async () => {
      const workflow = await readWorkflow();
      const uploadStep = workflow.jobs.build.steps.find(
        (step: any) => step.uses && step.uses.includes('upload-artifact')
      );
      expect(uploadStep).toBeDefined();
    });

    it('should use platform-specific artifact naming', async () => {
      const workflow = await readWorkflow();
      const uploadStep = workflow.jobs.build.steps.find(
        (step: any) => step.uses && step.uses.includes('upload-artifact')
      );
      expect(uploadStep).toBeDefined();
      expect(uploadStep.with.name).toBeDefined();
    });
  });

  describe('Release job configuration', () => {
    it('should have release job', async () => {
      const workflow = await readWorkflow();
      expect(workflow.jobs).toBeDefined();
      expect(workflow.jobs.release).toBeDefined();
    });

    it('should trigger only on tags', async () => {
      const workflow = await readWorkflow();
      expect(workflow.jobs.release['if']).toBeDefined();
      expect(workflow.jobs.release['if']).toContain('startsWith(github.ref, \'refs/tags/\')');
    });

    it('should download all artifacts', async () => {
      const workflow = await readWorkflow();
      const downloadStep = workflow.jobs.release.steps.find(
        (step: any) => step.uses && step.uses.includes('download-artifact')
      );
      expect(downloadStep).toBeDefined();
    });

    it('should create GitHub release', async () => {
      const workflow = await readWorkflow();
      const releaseStep = workflow.jobs.release.steps.find(
        (step: any) => step.uses && step.uses.includes('action-gh-release')
      );
      expect(releaseStep).toBeDefined();
    });
  });

  describe('Node.js setup', () => {
    it('should setup Node.js in test job', async () => {
      const workflow = await readWorkflow();
      const setupStep = workflow.jobs.test.steps.find(
        (step: any) => step.uses && step.uses.includes('setup-node')
      );
      expect(setupStep).toBeDefined();
    });

    it('should setup Node.js in build job', async () => {
      const workflow = await readWorkflow();
      const setupStep = workflow.jobs.build.steps.find(
        (step: any) => step.uses && step.uses.includes('setup-node')
      );
      expect(setupStep).toBeDefined();
    });

    it('should use npm cache in test job', async () => {
      const workflow = await readWorkflow();
      const setupStep = workflow.jobs.test.steps.find(
        (step: any) => step.uses && step.uses.includes('setup-node')
      );
      expect(setupStep.with.cache).toBe('npm');
    });

    it('should use npm cache in build job', async () => {
      const workflow = await readWorkflow();
      const setupStep = workflow.jobs.build.steps.find(
        (step: any) => step.uses && step.uses.includes('setup-node')
      );
      expect(setupStep.with.cache).toBe('npm');
    });
  });
});
