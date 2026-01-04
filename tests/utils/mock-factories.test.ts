/**
 * Tests for Mock Factories
 *
 * REQ-006: Test Utilities
 * TAG-001: Mock factories for common types
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createMockSpec,
  createMockSession,
  createMockWave,
  createMockExecutionPlan,
  createMockDependencyStatus,
  createMockBootstrapResult,
  createMockAppConfig,
} from './mock-factories';

describe('Mock Factories - REQ-006, TAG-001', () => {
  describe('createMockSpec', () => {
    it('should create valid SpecInfo with defaults', () => {
      const spec = createMockSpec();

      expect(spec).toMatchObject({
        id: expect.any(String),
        title: expect.any(String),
        filePath: expect.any(String),
        status: 'pending',
        dependencies: expect.any(Array),
      });
    });

    it('should allow overriding id', () => {
      const spec = createMockSpec({ id: 'SPEC-CUSTOM' });
      expect(spec.id).toBe('SPEC-CUSTOM');
    });

    it('should allow overriding title', () => {
      const spec = createMockSpec({ title: 'Custom Title' });
      expect(spec.title).toBe('Custom Title');
    });

    it('should allow overriding status', () => {
      const spec = createMockSpec({ status: 'running' });
      expect(spec.status).toBe('running');
    });

    it('should allow overriding dependencies', () => {
      const spec = createMockSpec({
        dependencies: ['SPEC-001', 'SPEC-002'],
      });
      expect(spec.dependencies).toEqual(['SPEC-001', 'SPEC-002']);
    });

    it('should generate unique IDs with faker', () => {
      const spec1 = createMockSpec();
      const spec2 = createMockSpec();
      expect(spec1.id).not.toBe(spec2.id);
    });

    it('should generate realistic titles with faker', () => {
      const spec = createMockSpec();
      expect(spec.title.length).toBeGreaterThan(0);
      expect(spec.title).toBeTruthy();
    });
  });

  describe('createMockSession', () => {
    it('should create valid SessionInfo with defaults', () => {
      const session = createMockSession();

      expect(session).toMatchObject({
        id: expect.any(String),
        specId: expect.any(String),
        status: 'idle',
        worktreePath: expect.any(String),
        startedAt: expect.any(String),
        output: expect.any(String),
        error: null,
      });
    });

    it('should allow overriding specId', () => {
      const session = createMockSession({ specId: 'SPEC-001' });
      expect(session.specId).toBe('SPEC-001');
    });

    it('should allow overriding status', () => {
      const session = createMockSession({ status: 'running' });
      expect(session.status).toBe('running');
    });

    it('should allow overriding worktreePath', () => {
      const session = createMockSession({
        worktreePath: '/custom/path',
      });
      expect(session.worktreePath).toBe('/custom/path');
    });

    it('should allow setting error', () => {
      const session = createMockSession({
        status: 'failed',
        error: 'Test error',
      });
      expect(session.error).toBe('Test error');
    });

    it('should generate UUID for id', () => {
      const session = createMockSession();
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(session.id).toMatch(uuidRegex);
    });

    it('should generate ISO timestamp for startedAt', () => {
      const session = createMockSession();
      const date = new Date(session.startedAt);
      expect(date.toISOString()).toBe(session.startedAt);
    });

    it('should allow setting completedAt', () => {
      const completedAt = new Date().toISOString();
      const session = createMockSession({ completedAt });
      expect(session.completedAt).toBe(completedAt);
    });
  });

  describe('createMockWave', () => {
    it('should create valid Wave with defaults', () => {
      const wave = createMockWave();

      expect(wave).toMatchObject({
        waveNumber: expect.any(Number),
        specs: expect.any(Array),
      });
    });

    it('should allow overriding waveNumber', () => {
      const wave = createMockWave({ waveNumber: 5 });
      expect(wave.waveNumber).toBe(5);
    });

    it('should allow overriding specs array', () => {
      const specs = [createMockSpec(), createMockSpec()];
      const wave = createMockWave({ specs });
      expect(wave.specs).toHaveLength(2);
      expect(wave.specs).toEqual(specs);
    });

    it('should generate specs with default count', () => {
      const wave = createMockWave();
      expect(wave.specs.length).toBeGreaterThan(0);
      expect(wave.specs.length).toBeLessThanOrEqual(5);
    });
  });

  describe('createMockExecutionPlan', () => {
    it('should create valid ExecutionPlan with defaults', () => {
      const plan = createMockExecutionPlan();

      expect(plan).toMatchObject({
        waves: expect.any(Array),
        totalSpecs: expect.any(Number),
        estimatedParallelism: expect.any(Number),
      });
    });

    it('should allow overriding totalSpecs', () => {
      const plan = createMockExecutionPlan({ totalSpecs: 10 });
      expect(plan.totalSpecs).toBe(10);
    });

    it('should allow overriding estimatedParallelism', () => {
      const plan = createMockExecutionPlan({
        estimatedParallelism: 8,
      });
      expect(plan.estimatedParallelism).toBe(8);
    });

    it('should allow overriding waves array', () => {
      const waves = [createMockWave(), createMockWave()];
      const plan = createMockExecutionPlan({ waves });
      expect(plan.waves).toHaveLength(2);
      expect(plan.waves).toEqual(waves);
    });

    it('should generate waves with sequential waveNumbers', () => {
      const plan = createMockExecutionPlan({ wavesCount: 3 });
      expect(plan.waves).toHaveLength(3);
      expect(plan.waves[0].waveNumber).toBe(1);
      expect(plan.waves[1].waveNumber).toBe(2);
      expect(plan.waves[2].waveNumber).toBe(3);
    });
  });

  describe('createMockDependencyStatus', () => {
    it('should create valid DependencyStatus with defaults', () => {
      const dep = createMockDependencyStatus();

      expect(dep.name).toEqual(expect.any(String));
      expect(dep.installed).toEqual(expect.any(Boolean));
      expect(typeof dep.version === 'string' || dep.version === null).toBe(true);
      expect(typeof dep.path === 'string' || dep.path === null).toBe(true);
    });

    it('should allow overriding name', () => {
      const dep = createMockDependencyStatus({ name: 'Custom Tool' });
      expect(dep.name).toBe('Custom Tool');
    });

    it('should allow overriding installed status', () => {
      const dep = createMockDependencyStatus({ installed: true });
      expect(dep.installed).toBe(true);
    });

    it('should set version to null when not installed', () => {
      const dep = createMockDependencyStatus({ installed: false });
      expect(dep.version).toBeNull();
    });

    it('should set path to null when not installed', () => {
      const dep = createMockDependencyStatus({ installed: false });
      expect(dep.path).toBeNull();
    });

    it('should generate version when installed', () => {
      const dep = createMockDependencyStatus({ installed: true });
      expect(dep.version).toBeTruthy();
      expect(dep.path).toBeTruthy();
    });
  });

  describe('createMockBootstrapResult', () => {
    it('should create valid BootstrapResult with defaults', () => {
      const result = createMockBootstrapResult();

      expect(result).toMatchObject({
        claude: expect.any(Boolean),
        moaiAdk: expect.any(Boolean),
        moaiWorktree: expect.any(Boolean),
      });
    });

    it('should allow overriding claude status', () => {
      const result = createMockBootstrapResult({ claude: true });
      expect(result.claude).toBe(true);
    });

    it('should allow overriding moaiAdk status', () => {
      const result = createMockBootstrapResult({ moaiAdk: false });
      expect(result.moaiAdk).toBe(false);
    });

    it('should allow overriding moaiWorktree status', () => {
      const result = createMockBootstrapResult({ moaiWorktree: true });
      expect(result.moaiWorktree).toBe(true);
    });

    it('should support all true scenario', () => {
      const result = createMockBootstrapResult({
        claude: true,
        moaiAdk: true,
        moaiWorktree: true,
      });
      expect(result).toEqual({
        claude: true,
        moaiAdk: true,
        moaiWorktree: true,
      });
    });
  });

  describe('createMockAppConfig', () => {
    it('should create valid AppConfig with defaults', () => {
      const config = createMockAppConfig();

      expect(config).toMatchObject({
        claudePath: expect.any(String),
        projectRoot: expect.any(String),
        maxParallelSessions: expect.any(Number),
        locale: expect.any(String),
        autoCleanup: expect.any(Boolean),
      });
    });

    it('should allow overriding claudePath', () => {
      const config = createMockAppConfig({
        claudePath: '/custom/claude',
      });
      expect(config.claudePath).toBe('/custom/claude');
    });

    it('should allow overriding projectRoot', () => {
      const config = createMockAppConfig({
        projectRoot: '/custom/project',
      });
      expect(config.projectRoot).toBe('/custom/project');
    });

    it('should allow overriding maxParallelSessions', () => {
      const config = createMockAppConfig({
        maxParallelSessions: 20,
      });
      expect(config.maxParallelSessions).toBe(20);
    });

    it('should allow overriding locale', () => {
      const config = createMockAppConfig({ locale: 'ko' });
      expect(config.locale).toBe('ko');
    });

    it('should allow overriding autoCleanup', () => {
      const config = createMockAppConfig({ autoCleanup: false });
      expect(config.autoCleanup).toBe(false);
    });

    it('should validate locale is supported', () => {
      const config = createMockAppConfig({ locale: 'en' });
      expect(['ko', 'en', 'ja', 'zh']).toContain(config.locale);
    });
  });

  describe('Integration Tests', () => {
    it('should create complex test scenario with multiple mocks', () => {
      const specs = [
        createMockSpec({ id: 'SPEC-001', dependencies: [] }),
        createMockSpec({ id: 'SPEC-002', dependencies: ['SPEC-001'] }),
      ];

      const wave = createMockWave({
        waveNumber: 1,
        specs,
      });

      const plan = createMockExecutionPlan({
        waves: [wave],
        totalSpecs: 2,
      });

      expect(plan.waves).toHaveLength(1);
      expect(plan.waves[0].specs).toHaveLength(2);
      expect(plan.totalSpecs).toBe(2);
    });

    it('should create session linked to spec', () => {
      const spec = createMockSpec({ id: 'SPEC-001' });
      const session = createMockSession({
        specId: spec.id,
        status: 'running',
      });

      expect(session.specId).toBe(spec.id);
      expect(session.status).toBe('running');
    });

    it('should create bootstrap result with dependency details', () => {
      const result = createMockBootstrapResult({
        claude: true,
        moaiAdk: true,
        moaiWorktree: false,
      });

      const claudeDep = createMockDependencyStatus({
        name: 'Claude Code CLI',
        installed: result.claude,
      });

      expect(claudeDep.installed).toBe(true);
      expect(result.moaiWorktree).toBe(false);
    });
  });
});
