/**
 * TAG-FUNC-001: Configuration Schema with Zod Validation
 *
 * REQ-001: Configuration Schema
 * - Defines typed configuration interfaces
 * - Zod schemas for validation
 * - Default values for all fields
 * - Documentation for each option
 *
 * Technical Constraints:
 * - Schema versioning required
 * - Zod for runtime validation
 * - Type-safe configuration
 */

import { z } from 'zod';
import type { SupportedLocale } from '@shared/types';

/**
 * Configuration Schema Version
 *
 * Current schema version for migration support.
 * Format: Semantic Versioning (semver)
 *
 * @example
 * ```typescript
 * const version: ConfigVersion = '1.0.0';
 * ```
 */
export type ConfigVersion = string;

/**
 * Schema version validation
 *
 * Ensures version string follows semantic versioning format.
 *
 * @example
 * ```typescript
 * ConfigVersionSchema.parse('1.0.0'); // Valid
 * ConfigVersionSchema.parse('invalid'); // Throws ZodError
 * ```
 */
export const ConfigVersionSchema: z.ZodSchema<ConfigVersion> = z.string().regex(
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/,
  {
    message: 'Invalid semantic version format. Expected format: X.Y.Z',
  }
);

/**
 * Application Configuration Schema
 *
 * Complete configuration schema with Zod validation for all application settings.
 *
 * Field Descriptions:
 * - schemaVersion: Config schema version for migration support
 * - claudePath: Path to Claude Code CLI executable (empty = auto-detect)
 * - projectRoot: Root directory of the project (empty = current directory)
 * - maxParallelSessions: Maximum concurrent SPEC execution sessions (1-10)
 * - locale: User interface language (ko, en, ja, zh)
 * - autoCleanup: Whether to automatically clean up worktrees after completion
 *
 * Validation Rules:
 * - schemaVersion: Must be valid semver string
 * - maxParallelSessions: Must be between 1 and 10 inclusive
 * - locale: Must be one of the supported locales
 * - Paths: Can be empty strings or valid paths
 * - Booleans: Must be true or false
 *
 * @example
 * ```typescript
 * const config = AppConfigSchema.parse({
 *   schemaVersion: '1.0.0',
 *   claudePath: '/usr/local/bin/claude',
 *   projectRoot: '/home/user/project',
 *   maxParallelSessions: 5,
 *   locale: 'en',
 *   autoCleanup: true
 * });
 * ```
 */
export const AppConfigSchema = z.object({
  /**
   * Schema version for migration support
   *
   * Used to detect and apply configuration migrations when the schema changes.
   * Follows semantic versioning format.
   */
  schemaVersion: ConfigVersionSchema,

  /**
   * Path to Claude Code CLI executable
   *
   * If empty string, the system will attempt to auto-detect the Claude CLI path.
   * Should be an absolute path to the executable.
   */
  claudePath: z.string().describe('Path to Claude Code CLI executable'),

  /**
   * Root directory of the project
   *
   * If empty string, defaults to the current working directory.
   * Should be an absolute path to the project root.
   */
  projectRoot: z.string().describe('Root directory of the project'),

  /**
   * Maximum parallel SPEC execution sessions
   *
   * Limits the number of concurrent SPEC executions to prevent system overload.
   * Valid range: 1 to 10 inclusive.
   */
  maxParallelSessions: z
    .number({
      required_error: 'maxParallelSessions is required',
      invalid_type_error: 'maxParallelSessions must be a number',
    })
    .int('maxParallelSessions must be an integer')
    .min(1, 'maxParallelSessions must be at least 1')
    .max(10, 'maxParallelSessions cannot exceed 10')
    .describe('Maximum parallel SPEC execution sessions'),

  /**
   * User interface language
   *
   * Determines the language used for the application interface.
   * Supported values: ko (Korean), en (English), ja (Japanese), zh (Chinese)
   */
  locale: z.enum(['ko', 'en', 'ja', 'zh'], {
    required_error: 'locale is required',
    invalid_type_error: 'locale must be a string',
  }).describe('User interface language'),

  /**
   * Automatic worktree cleanup
   *
   * If true, automatically removes git worktrees after SPEC completion.
   * If false, preserves worktrees for manual inspection.
   */
  autoCleanup: z
    .boolean({
      required_error: 'autoCleanup is required',
      invalid_type_error: 'autoCleanup must be a boolean',
    })
    .describe('Automatic worktree cleanup after SPEC completion'),
}).strict();

/**
 * Inferred type from AppConfigSchema
 *
 * Use this type for type-safe configuration objects.
 *
 * @example
 * ```typescript
 * const config: AppConfig = {
 *   schemaVersion: '1.0.0',
 *   claudePath: '',
 *   projectRoot: '',
 *   maxParallelSessions: 10,
 *   locale: 'en',
 *   autoCleanup: true
 * };
 * ```
 */
export type AppConfig = z.infer<typeof AppConfigSchema>;

/**
 * Default configuration values
 *
 * Provides sensible defaults for all configuration fields.
 * Used when initializing configuration or resetting to defaults.
 *
 * @example
 * ```typescript
 * const config: AppConfig = { ...DEFAULT_CONFIG };
 * ```
 */
export const DEFAULT_CONFIG: AppConfig = {
  schemaVersion: '1.0.0',
  claudePath: '',
  projectRoot: '',
  maxParallelSessions: 10,
  locale: 'en',
  autoCleanup: true,
} as const;

/**
 * Validate configuration against schema
 *
 * Performs full validation and returns either the validated config or validation errors.
 *
 * @param config - Configuration object to validate
 * @returns Validation result with success flag and data or error
 *
 * @example
 * ```typescript
 * const result = validateConfig(inputConfig);
 * if (result.success) {
 *   console.log('Valid config:', result.data);
 * } else {
 *   console.error('Validation errors:', result.error);
 * }
 * ```
 */
export function validateConfig(
  config: unknown
): z.SafeParseReturnType<unknown, AppConfig> {
  return AppConfigSchema.safeParse(config);
}

/**
 * Partial configuration schema for updates
 *
 * Allows validation of partial configuration updates.
 * Used when setting individual configuration values.
 *
 * @example
 * ```typescript
 * const update: PartialAppConfig = {
 *   maxParallelSessions: 5
 * };
 * ```
 */
export const PartialAppConfigSchema: z.ZodSchema<Partial<AppConfig>> =
  AppConfigSchema.partial();

/**
 * Partial configuration type
 *
 * Use for updates that don't require all fields.
 */
export type PartialAppConfig = z.infer<typeof PartialAppConfigSchema>;

/**
 * Validate partial configuration
 *
 * Validates configuration updates without requiring all fields.
 *
 * @param config - Partial configuration object to validate
 * @returns Validation result with success flag and data or error
 *
 * @example
 * ```typescript
 * const update = { maxParallelSessions: 5 };
 * const result = validatePartialConfig(update);
 * if (result.success) {
 *   configService.setMany(result.data);
 * }
 * ```
 */
export function validatePartialConfig(
  config: unknown
): z.SafeParseReturnValue<Partial<AppConfig>> {
  return PartialAppConfigSchema.safeParse(config);
}
