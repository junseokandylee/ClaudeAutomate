/**
 * TAG-FUNC-003: IPC Validators
 *
 * Implements REQ-002 (IPC Security) for secure IPC communication:
 * - Validate all IPC message schemas using Zod
 * - Sanitize user input at IPC boundaries
 * - Validate all IPC channel names against whitelist
 * - Type-safe payload validation
 *
 * Technical Constraints:
 * - Zod for schema validation
 * - Input sanitization against XSS
 * - Strict validation of all payloads
 * - Type-safe validation results
 */

import { z } from 'zod';
import type { AppConfig } from '../../shared/types';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Successful validation result
 */
export interface ValidationSuccess<T> {
  success: true;
  data: T;
}

/**
 * Failed validation result
 */
export interface ValidationFailure {
  success: false;
  errors: string[];
}

/**
 * Validation result union type
 */
export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

// ============================================================================
// Zod Schemas
// ============================================================================

/**
 * Session start payload schema (strict - no extra fields allowed)
 */
const SessionStartPayloadSchema = z.strictObject({
  specId: z.string().min(1, 'specId cannot be empty').regex(/^SPEC-[\d]+|[A-Z]+-[\d]+$/, 'Invalid specId format'),
});

/**
 * Session cancel payload schema (strict)
 */
const SessionCancelPayloadSchema = z.strictObject({
  sessionId: z.string().min(1, 'sessionId cannot be empty').uuid('Invalid UUID format'),
});

/**
 * Session retry payload schema (strict)
 */
const SessionRetryPayloadSchema = z.strictObject({
  sessionId: z.string().min(1, 'sessionId cannot be empty').uuid('Invalid UUID format'),
});

/**
 * Config key schema (enum of valid AppConfig keys)
 */
const ConfigKeySchema = z.enum(['claudePath', 'projectRoot', 'maxParallelSessions', 'locale', 'autoCleanup']);

/**
 * Config set payload schema (strict)
 */
const ConfigSetPayloadSchema = z.strictObject({
  key: ConfigKeySchema,
  value: z.unknown(),
});

/**
 * Config get payload schema (strict)
 */
const ConfigGetPayloadSchema = z.strictObject({
  key: ConfigKeySchema,
});

/**
 * Plan generate payload schema (strict)
 */
const PlanGeneratePayloadSchema = z.strictObject({
  specIds: z.array(z.string().min(1, 'specId cannot be empty')).optional(),
});

/**
 * Bootstrap check payload schema (empty object, strict)
 */
const BootstrapCheckPayloadSchema = z.strictObject({});

/**
 * IPC channel schema - whitelist of allowed channels
 */
const IpcChannelSchema = z.enum([
  'session:start',
  'session:cancel',
  'session:retry',
  'plan:generate',
  'config:get',
  'config:set',
  'bootstrap:check',
  'session:created',
  'session:started',
  'session:completed',
  'session:failed',
  'session:output',
  'progress:update',
]);

// ============================================================================
// Validator Functions
// ============================================================================

/**
 * Validate session start payload
 *
 * @param payload - Payload to validate
 * @returns Validation result with typed data or errors
 */
export function validateSessionStartPayload(
  payload: unknown
): ValidationResult<z.infer<typeof SessionStartPayloadSchema>> {
  return validateSchema(SessionStartPayloadSchema, payload);
}

/**
 * Validate session cancel payload
 *
 * @param payload - Payload to validate
 * @returns Validation result with typed data or errors
 */
export function validateSessionCancelPayload(
  payload: unknown
): ValidationResult<z.infer<typeof SessionCancelPayloadSchema>> {
  return validateSchema(SessionCancelPayloadSchema, payload);
}

/**
 * Validate session retry payload
 *
 * @param payload - Payload to validate
 * @returns Validation result with typed data or errors
 */
export function validateSessionRetryPayload(
  payload: unknown
): ValidationResult<z.infer<typeof SessionRetryPayloadSchema>> {
  return validateSchema(SessionRetryPayloadSchema, payload);
}

/**
 * Validate config set payload
 *
 * @param payload - Payload to validate
 * @returns Validation result with typed data or errors
 */
export function validateConfigSetPayload(
  payload: unknown
): ValidationResult<z.infer<typeof ConfigSetPayloadSchema>> {
  return validateSchema(ConfigSetPayloadSchema, payload);
}

/**
 * Validate config get payload
 *
 * @param payload - Payload to validate
 * @returns Validation result with typed data or errors
 */
export function validateConfigGetPayload(
  payload: unknown
): ValidationResult<z.infer<typeof ConfigGetPayloadSchema>> {
  return validateSchema(ConfigGetPayloadSchema, payload);
}

/**
 * Validate plan generate payload
 *
 * @param payload - Payload to validate
 * @returns Validation result with typed data or errors
 */
export function validatePlanGeneratePayload(
  payload: unknown
): ValidationResult<z.infer<typeof PlanGeneratePayloadSchema>> {
  return validateSchema(PlanGeneratePayloadSchema, payload);
}

/**
 * Validate bootstrap check payload
 *
 * @param payload - Payload to validate
 * @returns Validation result with typed data or errors
 */
export function validateBootstrapCheckPayload(
  payload: unknown
): ValidationResult<z.infer<typeof BootstrapCheckPayloadSchema>> {
  return validateSchema(BootstrapCheckPayloadSchema, payload);
}

/**
 * Validate IPC channel name against whitelist
 *
 * @param channel - Channel name to validate
 * @returns Validation result with channel name or errors
 */
export function validateIpcChannel(channel: unknown): ValidationResult<string> {
  return validateSchema(IpcChannelSchema, channel);
}

// ============================================================================
// Input Sanitization
// ============================================================================

/**
 * Sanitize string input to prevent XSS attacks
 *
 * Removes dangerous content including:
 * - Script tags
 * - JavaScript: protocol
 * - Inline event handlers (onclick, onerror, etc.)
 * - Data URLs with JavaScript
 *
 * @param input - String to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let sanitized = input;

  // Remove script tags and content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove JavaScript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');

  // Remove common inline event handlers
  const eventHandlers = [
    'onerror',
    'onload',
    'onclick',
    'onmouseover',
    'onmouseout',
    'onfocus',
    'onblur',
    'onkeydown',
    'onkeyup',
    'onsubmit',
    'onreset',
  ];

  for (const handler of eventHandlers) {
    const regex = new RegExp(handler, 'gi');
    sanitized = sanitized.replace(regex, '');
  }

  // Remove data: URLs with JavaScript
  sanitized = sanitized.replace(/data:text\/javascript/gi, '');

  // Decode HTML entities then re-sanitize
  try {
    sanitized = sanitized
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&');

    // Run sanitization again after decoding
    sanitized = sanitizeString(sanitized);
  } catch {
    // If decoding fails, return what we have
  }

  return sanitized.trim();
}

/**
 * Sanitize object keys and string values recursively
 *
 * @param obj - Object to sanitize
 * @returns Sanitized object
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = {} as T;

  for (const [key, value] of Object.entries(obj)) {
    // Sanitize key
    const safeKey = sanitizeString(key);

    if (typeof value === 'string') {
      // Sanitize string values
      sanitized[safeKey as keyof T] = sanitizeString(value) as T[keyof T];
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Recursively sanitize nested objects
      sanitized[safeKey as keyof T] = sanitizeObject(value as Record<string, unknown>) as T[keyof T];
    } else {
      // Keep other values as-is
      sanitized[safeKey as keyof T] = value;
    }
  }

  return sanitized;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validate data against a Zod schema
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validation result with typed data or errors
 */
function validateSchema<T extends z.ZodType>(schema: T, data: unknown): ValidationResult<z.infer<T>> {
  // Sanitize input if it's an object
  let sanitizedData = data;

  if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    sanitizedData = sanitizeObject(data as Record<string, unknown>);
  }

  // Validate against schema
  const result = schema.safeParse(sanitizedData);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  // Format errors
  const errors = result.error.errors.map((error) => {
    const path = error.path.length > 0 ? error.path.join('.') : 'root';
    return `${path}: ${error.message}`;
  });

  return {
    success: false,
    errors,
  };
}

/**
 * Create validation error for logging
 *
 * @param result - Failed validation result
 * @returns Formatted error message
 */
export function formatValidationError(result: ValidationFailure): string {
  return `Validation failed:\n${result.errors.join('\n')}`;
}
