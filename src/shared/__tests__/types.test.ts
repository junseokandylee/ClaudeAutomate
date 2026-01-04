/**
 * Cross-process compatibility tests for shared module
 *
 * This test suite validates that all shared types, constants, and errors
 * work correctly in both Main (Node.js) and Renderer (browser) contexts.
 */

import { describe, it, expect } from 'vitest';

// Test imports work in both contexts
import type {
  SpecStatus,
  SessionStatus,
  ProgressEventType,
  SupportedLocale,
  I18nNamespace,
  SpecInfo,
  Wave,
  ExecutionPlan,
  SessionInfo,
  BootstrapResult,
  DependencyStatus,
  AppConfig,
} from '../types';

import {
  IPC_CHANNELS,
  DEFAULT_CONFIG,
  MAX_PARALLEL_SESSIONS,
  SUPPORTED_LOCALES,
  COLORS,
  ERROR_CODES,
  ERROR_MESSAGES,
} from '../constants';

import {
  AppError,
  BootstrapError,
  SessionError,
  WorktreeError,
  ConfigError,
  AnalysisError,
  isAppError,
  isBootstrapError,
  isSessionError,
  isWorktreeError,
  isConfigError,
  isAnalysisError,
} from '../errors';

// ============================================================================
// Type Import Tests
// ============================================================================

describe('Type Imports', () => {
  it('should import SpecStatus type', () => {
    const status: SpecStatus = 'pending';
    expect(status).toBe('pending');
  });

  it('should accept all SpecStatus values', () => {
    const validStatuses: SpecStatus[] = ['pending', 'running', 'completed', 'failed'];
    validStatuses.forEach((status) => {
      expect(['pending', 'running', 'completed', 'failed']).toContain(status);
    });
  });

  it('should import SessionStatus type', () => {
    const status: SessionStatus = 'idle';
    expect(status).toBe('idle');
  });

  it('should accept all SessionStatus values', () => {
    const validStatuses: SessionStatus[] = [
      'idle',
      'running',
      'completed',
      'failed',
      'cancelled',
    ];
    validStatuses.forEach((status) => {
      expect(['idle', 'running', 'completed', 'failed', 'cancelled']).toContain(
        status
      );
    });
  });

  it('should import ProgressEventType type', () => {
    const eventType: ProgressEventType = 'session:created';
    expect(eventType).toBe('session:created');
  });

  it('should accept all ProgressEventType values', () => {
    const validTypes: ProgressEventType[] = [
      'session:created',
      'session:started',
      'session:completed',
      'session:failed',
      'spec:started',
      'spec:completed',
      'spec:failed',
    ];
    validTypes.forEach((type) => {
      expect([
        'session:created',
        'session:started',
        'session:completed',
        'session:failed',
        'spec:started',
        'spec:completed',
        'spec:failed',
      ]).toContain(type);
    });
  });

  it('should import SupportedLocale type', () => {
    const locale: SupportedLocale = 'en';
    expect(locale).toBe('en');
  });

  it('should accept all SupportedLocale values', () => {
    const validLocales: SupportedLocale[] = ['ko', 'en', 'ja', 'zh'];
    validLocales.forEach((locale) => {
      expect(['ko', 'en', 'ja', 'zh']).toContain(locale);
    });
  });

  it('should import I18nNamespace type', () => {
    const namespace: I18nNamespace = 'common';
    expect(namespace).toBe('common');
  });

  it('should accept all I18nNamespace values', () => {
    const validNamespaces: I18nNamespace[] = [
      'common',
      'main',
      'renderer',
      'errors',
      'validation',
      'status',
    ];
    validNamespaces.forEach((namespace) => {
      expect([
        'common',
        'main',
        'renderer',
        'errors',
        'validation',
        'status',
      ]).toContain(namespace);
    });
  });
});

// ============================================================================
// Interface Tests
// ============================================================================

describe('Interface Types', () => {
  it('should create SpecInfo object', () => {
    const spec: SpecInfo = {
      id: 'SPEC-001',
      title: 'Test SPEC',
      filePath: '/specs/SPEC-001.md',
      status: 'pending',
      dependencies: [],
    };
    expect(spec.id).toBe('SPEC-001');
    expect(spec.status).toBe('pending');
  });

  it('should create Wave object', () => {
    const wave: Wave = {
      waveNumber: 1,
      specs: [
        {
          id: 'SPEC-001',
          title: 'Test SPEC',
          filePath: '/specs/SPEC-001.md',
          status: 'pending',
          dependencies: [],
        },
      ],
    };
    expect(wave.waveNumber).toBe(1);
    expect(wave.specs).toHaveLength(1);
  });

  it('should create ExecutionPlan object', () => {
    const plan: ExecutionPlan = {
      waves: [
        {
          waveNumber: 1,
          specs: [],
        },
      ],
      totalSpecs: 0,
      estimatedParallelism: 1,
    };
    expect(plan.waves).toHaveLength(1);
    expect(plan.totalSpecs).toBe(0);
  });

  it('should create SessionInfo object', () => {
    const session: SessionInfo = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      specId: 'SPEC-001',
      status: 'idle',
      worktreePath: '/worktrees/SPEC-001',
      startedAt: '2025-01-04T10:00:00Z',
      output: '',
      error: null,
    };
    expect(session.specId).toBe('SPEC-001');
    expect(session.status).toBe('idle');
  });

  it('should create BootstrapResult object', () => {
    const bootstrap: BootstrapResult = {
      claude: true,
      moaiAdk: true,
      moaiWorktree: true,
    };
    expect(bootstrap.claude).toBe(true);
    expect(bootstrap.moaiAdk).toBe(true);
  });

  it('should create DependencyStatus object', () => {
    const dep: DependencyStatus = {
      name: 'Claude Code CLI',
      installed: true,
      version: '1.0.0',
      path: '/usr/local/bin/claude',
    };
    expect(dep.installed).toBe(true);
    expect(dep.version).toBe('1.0.0');
  });

  it('should create AppConfig object', () => {
    const config: AppConfig = {
      claudePath: '/usr/local/bin/claude',
      projectRoot: '/home/user/project',
      maxParallelSessions: 5,
      locale: 'en',
      autoCleanup: true,
    };
    expect(config.maxParallelSessions).toBe(5);
    expect(config.locale).toBe('en');
  });
});

// ============================================================================
// Constants Tests
// ============================================================================

describe('Constants', () => {
  it('should export IPC_CHANNELS constant', () => {
    expect(IPC_CHANNELS).toBeDefined();
    expect(IPC_CHANNELS.SESSION_START).toBe('session:start');
    expect(IPC_CHANNELS.SESSION_CANCEL).toBe('session:cancel');
    expect(IPC_CHANNELS.PROGRESS_UPDATE).toBe('progress:update');
  });

  it('should export DEFAULT_CONFIG constant', () => {
    expect(DEFAULT_CONFIG).toBeDefined();
    expect(DEFAULT_CONFIG.maxParallelSessions).toBe(10);
    expect(DEFAULT_CONFIG.locale).toBe('en');
    expect(DEFAULT_CONFIG.autoCleanup).toBe(true);
  });

  it('should export MAX_PARALLEL_SESSIONS constant', () => {
    expect(MAX_PARALLEL_SESSIONS).toBe(10);
  });

  it('should export SUPPORTED_LOCALES constant', () => {
    expect(SUPPORTED_LOCALES).toEqual(['ko', 'en', 'ja', 'zh']);
  });

  it('should export COLORS constant', () => {
    expect(COLORS).toBeDefined();
    expect(COLORS.ANTHROPIC).toBe('#D97757');
    expect(COLORS.SLATE).toBeDefined();
    expect(COLORS.BLUE).toBeDefined();
    expect(COLORS.EMERALD).toBeDefined();
    expect(COLORS.AMBER).toBeDefined();
    expect(COLORS.RED).toBeDefined();
  });

  it('should export ERROR_CODES constant', () => {
    expect(ERROR_CODES).toBeDefined();
    expect(ERROR_CODES.BOOTSTRAP_CLAUDE_NOT_FOUND).toBe('E0001');
    expect(ERROR_CODES.SESSION_CREATE_FAILED).toBe('E0011');
    expect(ERROR_CODES.WORKTREE_CREATE_FAILED).toBe('E0021');
    expect(ERROR_CODES.CONFIG_INVALID_PATH).toBe('E0031');
    expect(ERROR_CODES.ANALYSIS_PARSE_FAILED).toBe('E0041');
  });

  it('should export ERROR_MESSAGES constant', () => {
    expect(ERROR_MESSAGES).toBeDefined();
    expect(typeof ERROR_MESSAGES[ERROR_CODES.BOOTSTRAP_CLAUDE_NOT_FOUND]).toBe(
      'string'
    );
  });
});

// ============================================================================
// Error Class Tests
// ============================================================================

describe('Error Classes', () => {
  it('should create AppError instance', () => {
    const error = new AppError('E0001', 'Test error');
    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe('E0001');
    expect(error.message).toBe('Test error');
  });

  it('should create AppError with details', () => {
    const details = { specId: 'SPEC-001', reason: 'Test failure' };
    const error = new AppError('E0001', 'Test error', details);
    expect(error.details).toEqual(details);
  });

  it('should format AppError correctly', () => {
    const error = new AppError('E0001', 'Test error', { key: 'value' });
    const formatted = error.format();
    expect(formatted).toContain('[E0001]');
    expect(formatted).toContain('Test error');
  });

  it('should serialize AppError to JSON', () => {
    const error = new AppError('E0001', 'Test error', { key: 'value' });
    const json = error.toJSON();
    expect(json).toEqual({
      code: 'E0001',
      message: 'Test error',
      details: { key: 'value' },
    });
  });

  it('should deserialize AppError from JSON', () => {
    const json = {
      code: 'E0001',
      message: 'Test error',
      details: { key: 'value' },
    };
    const error = AppError.fromJSON(json);
    expect(error.code).toBe('E0001');
    expect(error.message).toBe('Test error');
    expect(error.details).toEqual({ key: 'value' });
  });

  it('should create BootstrapError instance', () => {
    const error = new BootstrapError(
      'BOOTSTRAP_CLAUDE_NOT_FOUND',
      'Claude not found',
      { path: '/usr/local/bin/claude' }
    );
    expect(error).toBeInstanceOf(BootstrapError);
    expect(error).toBeInstanceOf(AppError);
    expect(error.code).toBe('E0001');
  });

  it('should create SessionError instance', () => {
    const error = new SessionError(
      'SESSION_CREATE_FAILED',
      'Session creation failed',
      { specId: 'SPEC-001' }
    );
    expect(error).toBeInstanceOf(SessionError);
    expect(error).toBeInstanceOf(AppError);
    expect(error.code).toBe('E0011');
  });

  it('should create WorktreeError instance', () => {
    const error = new WorktreeError(
      'WORKTREE_CREATE_FAILED',
      'Worktree creation failed',
      { path: '/worktrees/SPEC-001' }
    );
    expect(error).toBeInstanceOf(WorktreeError);
    expect(error).toBeInstanceOf(AppError);
    expect(error.code).toBe('E0021');
  });

  it('should create ConfigError instance', () => {
    const error = new ConfigError(
      'CONFIG_INVALID_VALUE',
      'Invalid config value',
      { key: 'maxSessions', value: -1 }
    );
    expect(error).toBeInstanceOf(ConfigError);
    expect(error).toBeInstanceOf(AppError);
    expect(error.code).toBe('E0032');
  });

  it('should create AnalysisError instance', () => {
    const error = new AnalysisError(
      'ANALYSIS_DEPENDENCY_CYCLE',
      'Circular dependency',
      { cycle: 'SPEC-001 -> SPEC-002 -> SPEC-001' }
    );
    expect(error).toBeInstanceOf(AnalysisError);
    expect(error).toBeInstanceOf(AppError);
    expect(error.code).toBe('E0042');
  });
});

// ============================================================================
// Error Type Guard Tests
// ============================================================================

describe('Error Type Guards', () => {
  it('should identify AppError instances', () => {
    const error = new AppError('E0001', 'Test error');
    expect(isAppError(error)).toBe(true);
    expect(isAppError(new Error('plain error'))).toBe(false);
    expect(isAppError(null)).toBe(false);
    expect(isAppError(undefined)).toBe(false);
  });

  it('should identify BootstrapError instances', () => {
    const error = new BootstrapError('BOOTSTRAP_CLAUDE_NOT_FOUND');
    expect(isBootstrapError(error)).toBe(true);
    expect(isBootstrapError(new AppError('E0001', 'Test'))).toBe(false);
  });

  it('should identify SessionError instances', () => {
    const error = new SessionError('SESSION_CREATE_FAILED');
    expect(isSessionError(error)).toBe(true);
    expect(isSessionError(new AppError('E0001', 'Test'))).toBe(false);
  });

  it('should identify WorktreeError instances', () => {
    const error = new WorktreeError('WORKTREE_CREATE_FAILED');
    expect(isWorktreeError(error)).toBe(true);
    expect(isWorktreeError(new AppError('E0001', 'Test'))).toBe(false);
  });

  it('should identify ConfigError instances', () => {
    const error = new ConfigError('CONFIG_INVALID_VALUE');
    expect(isConfigError(error)).toBe(true);
    expect(isConfigError(new AppError('E0001', 'Test'))).toBe(false);
  });

  it('should identify AnalysisError instances', () => {
    const error = new AnalysisError('ANALYSIS_DEPENDENCY_CYCLE');
    expect(isAnalysisError(error)).toBe(true);
    expect(isAnalysisError(new AppError('E0001', 'Test'))).toBe(false);
  });

  it('should maintain instanceof chain', () => {
    const sessionError = new SessionError('SESSION_CREATE_FAILED');
    expect(sessionError instanceof SessionError).toBe(true);
    expect(sessionError instanceof AppError).toBe(true);
    expect(sessionError instanceof Error).toBe(true);

    const worktreeError = new WorktreeError('WORKTREE_CREATE_FAILED');
    expect(worktreeError instanceof WorktreeError).toBe(true);
    expect(worktreeError instanceof AppError).toBe(true);
    expect(worktreeError instanceof Error).toBe(true);
  });
});

// ============================================================================
// Cross-Process Compatibility Tests
// ============================================================================

describe('Cross-Process Compatibility', () => {
  it('should serialize and deserialize errors via JSON', () => {
    const originalError = new SessionError(
      'SESSION_CREATE_FAILED',
      'Session failed',
      { sessionId: '123', specId: 'SPEC-001' }
    );

    // Simulate IPC transport
    const json = JSON.stringify(originalError.toJSON());
    const parsed = JSON.parse(json);
    const reconstructedError = AppError.fromJSON(parsed);

    expect(reconstructedError.code).toBe(originalError.code);
    expect(reconstructedError.message).toBe(originalError.message);
    expect(reconstructedError.details).toEqual(originalError.details);
  });

  it('should handle complex objects in error details', () => {
    const complexDetails = {
      sessionId: '123',
      spec: {
        id: 'SPEC-001',
        title: 'Test SPEC',
        dependencies: ['SPEC-000'],
      },
      timestamps: {
        started: '2025-01-04T10:00:00Z',
        failed: '2025-01-04T10:05:00Z',
      },
    };

    const error = new AppError('E0011', 'Complex error', complexDetails);
    const json = error.toJSON();
    const reconstructed = AppError.fromJSON(json);

    expect(reconstructed.details).toEqual(complexDetails);
  });

  it('should maintain type safety across process boundary', () => {
    const config: AppConfig = {
      claudePath: '/usr/local/bin/claude',
      projectRoot: '/project',
      maxParallelSessions: 5,
      locale: 'en',
      autoCleanup: true,
    };

    // Simulate IPC transport
    const json = JSON.stringify(config);
    const parsed = JSON.parse(json);

    // Type checking would fail if types don't match
    expect(parsed.claudePath).toBe(config.claudePath);
    expect(parsed.maxParallelSessions).toBeTypeOf('number');
    expect(parsed.locale).toBeTypeOf('string');
  });
});

// ============================================================================
// Constants Type Safety Tests
// ============================================================================

describe('Constants Type Safety', () => {
  it('should enforce IPC_CHANNELS value types', () => {
    Object.values(IPC_CHANNELS).forEach((channel) => {
      expect(channel).toBeTypeOf('string');
      expect(channel).toMatch(/^[a-z]+:[a-z]+$/);
    });
  });

  it('should enforce ERROR_CODES format', () => {
    Object.values(ERROR_CODES).forEach((code) => {
      expect(code).toMatch(/^E\d{4}$/);
    });
  });

  it('should have ERROR_MESSAGES for all ERROR_CODES', () => {
    Object.values(ERROR_CODES).forEach((code) => {
      expect(ERROR_MESSAGES[code]).toBeDefined();
      expect(ERROR_MESSAGES[code]).toBeTypeOf('string');
    });
  });

  it('should enforce SUPPORTED_LOCALES type', () => {
    SUPPORTED_LOCALES.forEach((locale) => {
      expect(['ko', 'en', 'ja', 'zh']).toContain(locale);
    });
  });

  it('should enforce color hex format', () => {
    expect(COLORS.ANTHROPIC).toMatch(/^#[0-9A-F]{6}$/);

    // Check palette colors
    Object.values(COLORS.SLATE).forEach((color) => {
      expect(color).toMatch(/^#[0-9A-F]{6}$/);
    });
  });
});
