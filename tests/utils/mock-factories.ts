/**
 * Mock Factories for Testing
 *
 * REQ-006: Test Utilities
 * TAG-001: Mock factories for common types
 *
 * Provides factory functions for creating mock data objects used in tests.
 * Uses faker for generating realistic test data.
 */

import { faker } from '@faker-js/faker';
import type {
  SpecInfo,
  SessionInfo,
  Wave,
  ExecutionPlan,
  DependencyStatus,
  BootstrapResult,
  AppConfig,
  SpecStatus,
  SessionStatus,
  SupportedLocale,
} from '@shared/types';

// ============================================================================
// Mock Factory Interfaces
// ============================================================================

interface MockSpecOptions {
  id?: string;
  title?: string;
  filePath?: string;
  status?: SpecStatus;
  dependencies?: string[];
}

interface MockSessionOptions {
  id?: string;
  specId?: string;
  status?: SessionStatus;
  worktreePath?: string;
  startedAt?: string;
  completedAt?: string;
  output?: string;
  error?: string | null;
}

interface MockWaveOptions {
  waveNumber?: number;
  specs?: SpecInfo[];
  specsCount?: number;
}

interface MockExecutionPlanOptions {
  waves?: Wave[];
  totalSpecs?: number;
  estimatedParallelism?: number;
  wavesCount?: number;
}

interface MockDependencyStatusOptions {
  name?: string;
  installed?: boolean;
  version?: string | null;
  path?: string | null;
}

interface MockBootstrapResultOptions {
  claude?: boolean;
  moaiAdk?: boolean;
  moaiWorktree?: boolean;
}

interface MockAppConfigOptions {
  claudePath?: string;
  projectRoot?: string;
  maxParallelSessions?: number;
  locale?: SupportedLocale;
  autoCleanup?: boolean;
}

// ============================================================================
// Mock Factory Functions
// ============================================================================

/**
 * Create mock SpecInfo for testing
 *
 * @param options - Partial override of default values
 * @returns Mock SpecInfo object
 *
 * @example
 * ```typescript
 * const spec = createMockSpec({ id: 'SPEC-001', status: 'running' });
 * ```
 */
export function createMockSpec(
  options: MockSpecOptions = {}
): SpecInfo {
  return {
    id: options.id || faker.string.uuid(),
    title: options.title || faker.lorem.sentence(),
    filePath: options.filePath || faker.system.filePath(),
    status: options.status || 'pending',
    dependencies: options.dependencies || [],
  };
}

/**
 * Create mock SessionInfo for testing
 *
 * @param options - Partial override of default values
 * @returns Mock SessionInfo object
 *
 * @example
 * ```typescript
 * const session = createMockSession({ specId: 'SPEC-001', status: 'running' });
 * ```
 */
export function createMockSession(
  options: MockSessionOptions = {}
): SessionInfo {
  const installed = options.status !== 'failed';

  return {
    id: options.id || faker.string.uuid(),
    specId: options.specId || faker.string.uuid(),
    status: options.status || 'idle',
    worktreePath:
      options.worktreePath || faker.system.filePath(),
    startedAt:
      options.startedAt || faker.date.recent().toISOString(),
    completedAt: options.completedAt,
    output: options.output || faker.lorem.paragraph(),
    error: options.error ?? (installed ? null : faker.lorem.sentence()),
  };
}

/**
 * Create mock Wave for testing
 *
 * @param options - Partial override of default values
 * @returns Mock Wave object
 *
 * @example
 * ```typescript
 * const wave = createMockWave({ waveNumber: 1, specsCount: 3 });
 * ```
 */
export function createMockWave(
  options: MockWaveOptions = {}
): Wave {
  const waveNumber = options.waveNumber || faker.number.int({ min: 1, max: 10 });
  const specsCount = options.specsCount || faker.number.int({ min: 1, max: 5 });

  const specs = options.specs || Array.from({ length: specsCount }, () =>
    createMockSpec()
  );

  return {
    waveNumber,
    specs,
  };
}

/**
 * Create mock ExecutionPlan for testing
 *
 * @param options - Partial override of default values
 * @returns Mock ExecutionPlan object
 *
 * @example
 * ```typescript
 * const plan = createMockExecutionPlan({ wavesCount: 3, totalSpecs: 10 });
 * ```
 */
export function createMockExecutionPlan(
  options: MockExecutionPlanOptions = {}
): ExecutionPlan {
  const wavesCount = options.wavesCount || faker.number.int({ min: 1, max: 5 });
  const totalSpecs = options.totalSpecs || faker.number.int({ min: 5, max: 50 });
  const estimatedParallelism =
    options.estimatedParallelism ||
    faker.number.int({ min: 2, max: 10 });

  const waves =
    options.waves ||
    Array.from({ length: wavesCount }, (_, i) =>
      createMockWave({ waveNumber: i + 1 })
    );

  return {
    waves,
    totalSpecs,
    estimatedParallelism,
  };
}

/**
 * Create mock DependencyStatus for testing
 *
 * @param options - Partial override of default values
 * @returns Mock DependencyStatus object
 *
 * @example
 * ```typescript
 * const dep = createMockDependencyStatus({ name: 'Node.js', installed: true });
 * ```
 */
export function createMockDependencyStatus(
  options: MockDependencyStatusOptions = {}
): DependencyStatus {
  const installed = options.installed ?? faker.datatype.boolean();

  return {
    name: options.name || faker.helpers.arrayElement([
      'Claude Code CLI',
      'Node.js',
      'Git',
      'Python',
    ]),
    installed,
    version: options.version ?? (installed ? faker.system.semver() : null),
    path: options.path ?? (installed ? faker.system.filePath() : null),
  };
}

/**
 * Create mock BootstrapResult for testing
 *
 * @param options - Partial override of default values
 * @returns Mock BootstrapResult object
 *
 * @example
 * ```typescript
 * const result = createMockBootstrapResult({ claude: true, moaiAdk: true });
 * ```
 */
export function createMockBootstrapResult(
  options: MockBootstrapResultOptions = {}
): BootstrapResult {
  return {
    claude: options.claude ?? faker.datatype.boolean(),
    moaiAdk: options.moaiAdk ?? faker.datatype.boolean(),
    moaiWorktree: options.moaiWorktree ?? faker.datatype.boolean(),
  };
}

/**
 * Create mock AppConfig for testing
 *
 * @param options - Partial override of default values
 * @returns Mock AppConfig object
 *
 * @example
 * ```typescript
 * const config = createMockAppConfig({ locale: 'ko', maxParallelSessions: 5 });
 * ```
 */
export function createMockAppConfig(
  options: MockAppConfigOptions = {}
): AppConfig {
  const locales: SupportedLocale[] = ['ko', 'en', 'ja', 'zh'];

  return {
    claudePath:
      options.claudePath || faker.system.filePath(),
    projectRoot:
      options.projectRoot || faker.system.filePath(),
    maxParallelSessions:
      options.maxParallelSessions ||
      faker.number.int({ min: 1, max: 20 }),
    locale: options.locale || faker.helpers.arrayElement(locales),
    autoCleanup: options.autoCleanup ?? faker.datatype.boolean(),
  };
}

// ============================================================================
// Batch Creation Helpers
// ============================================================================

/**
 * Create multiple mock specs
 *
 * @param count - Number of specs to create
 * @param options - Options to apply to all specs
 * @returns Array of mock SpecInfo objects
 *
 * @example
 * ```typescript
 * const specs = createMockSpecs(5, { status: 'pending' });
 * ```
 */
export function createMockSpecs(
  count: number,
  options: Omit<MockSpecOptions, 'id'> = {}
): SpecInfo[] {
  return Array.from({ length: count }, (_, i) =>
    createMockSpec({
      ...options,
      id: options.id || `SPEC-${String(i + 1).padStart(3, '0')}`,
    })
  );
}

/**
 * Create multiple mock sessions
 *
 * @param count - Number of sessions to create
 * @param options - Options to apply to all sessions
 * @returns Array of mock SessionInfo objects
 *
 * @example
 * ```typescript
 * const sessions = createMockSessions(3, { status: 'running' });
 * ```
 */
export function createMockSessions(
  count: number,
  options: MockSessionOptions = {}
): SessionInfo[] {
  return Array.from({ length: count }, () =>
    createMockSession(options)
  );
}
