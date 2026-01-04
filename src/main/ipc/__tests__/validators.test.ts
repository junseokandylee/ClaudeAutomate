/**
 * TAG-TEST-003: IPC Validators Tests
 *
 * Test suite for IPC validators implementing REQ-002 (IPC Security):
 * - Validate all IPC message schemas
 * - Sanitize user input
 * - Use contextBridge for isolation
 * - No nodeIntegration in renderer
 *
 * Technical Constraints:
 * - Zod schema validation
 * - Input sanitization
 * - Type safety
 * - Security validation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateSessionStartPayload,
  validateSessionCancelPayload,
  validateSessionRetryPayload,
  validateConfigSetPayload,
  validatePlanGeneratePayload,
  validateBootstrapCheckPayload,
  validateConfigGetPayload,
  sanitizeString,
  validateIpcChannel,
  type ValidationError,
} from '../validators';

describe('IPC Validators', () => {
  describe('validateSessionStartPayload', () => {
    it('should validate valid session start payload', () => {
      const payload = { specId: 'SPEC-001' };
      const result = validateSessionStartPayload(payload);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(payload);
      }
    });

    it('should reject payload with missing specId', () => {
      const payload = {} as { specId: string };
      const result = validateSessionStartPayload(payload);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toBeDefined();
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });

    it('should reject payload with empty specId', () => {
      const payload = { specId: '' };
      const result = validateSessionStartPayload(payload);

      expect(result.success).toBe(false);
    });

    it('should reject payload with non-string specId', () => {
      const payload = { specId: 123 as unknown as string };
      const result = validateSessionStartPayload(payload);

      expect(result.success).toBe(false);
    });

    it('should reject payload with extra fields', () => {
      const payload = { specId: 'SPEC-001', extra: 'field' };
      const result = validateSessionStartPayload(payload);

      expect(result.success).toBe(false);
    });
  });

  describe('validateSessionCancelPayload', () => {
    it('should validate valid session cancel payload', () => {
      const payload = { sessionId: '550e8400-e29b-41d4-a716-446655440000' };
      const result = validateSessionCancelPayload(payload);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(payload);
      }
    });

    it('should reject payload with missing sessionId', () => {
      const payload = {} as { sessionId: string };
      const result = validateSessionCancelPayload(payload);

      expect(result.success).toBe(false);
    });

    it('should reject payload with empty sessionId', () => {
      const payload = { sessionId: '' };
      const result = validateSessionCancelPayload(payload);

      expect(result.success).toBe(false);
    });

    it('should reject payload with invalid UUID format', () => {
      const payload = { sessionId: 'not-a-uuid' };
      const result = validateSessionCancelPayload(payload);

      expect(result.success).toBe(false);
    });
  });

  describe('validateSessionRetryPayload', () => {
    it('should validate valid session retry payload', () => {
      const payload = { sessionId: '550e8400-e29b-41d4-a716-446655440000' };
      const result = validateSessionRetryPayload(payload);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(payload);
      }
    });

    it('should reject payload with missing sessionId', () => {
      const payload = {} as { sessionId: string };
      const result = validateSessionRetryPayload(payload);

      expect(result.success).toBe(false);
    });
  });

  describe('validateConfigSetPayload', () => {
    it('should validate valid config set payload', () => {
      const payload = { key: 'claudePath', value: '/usr/local/bin/claude' };
      const result = validateConfigSetPayload(payload);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(payload);
      }
    });

    it('should reject payload with invalid key', () => {
      const payload = { key: 'invalidKey', value: 'test' };
      const result = validateConfigSetPayload(payload);

      expect(result.success).toBe(false);
    });

    it('should reject payload with missing key', () => {
      const payload = {} as { key: string; value: unknown };
      const result = validateConfigSetPayload(payload);

      expect(result.success).toBe(false);
    });

    it('should accept payload with value field present (even if undefined)', () => {
      const payload = { key: 'claudePath', value: undefined };
      const result = validateConfigSetPayload(payload);

      // Zod allows value to be undefined since we use z.unknown()
      expect(result.success).toBe(true);
    });

    it('should accept all valid config keys', () => {
      const validKeys = ['claudePath', 'projectRoot', 'maxParallelSessions', 'locale', 'autoCleanup'];

      for (const key of validKeys) {
        const payload = { key: key as any, value: 'test' };
        const result = validateConfigSetPayload(payload);

        expect(result.success).toBe(true);
      }
    });
  });

  describe('validatePlanGeneratePayload', () => {
    it('should validate valid plan generate payload with specIds', () => {
      const payload = { specIds: ['SPEC-001', 'SPEC-002'] };
      const result = validatePlanGeneratePayload(payload);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(payload);
      }
    });

    it('should validate valid plan generate payload without specIds', () => {
      const payload = {};
      const result = validatePlanGeneratePayload(payload);

      expect(result.success).toBe(true);
    });

    it('should reject payload with non-array specIds', () => {
      const payload = { specIds: 'SPEC-001' as unknown as string[] };
      const result = validatePlanGeneratePayload(payload);

      expect(result.success).toBe(false);
    });

    it('should reject payload with empty string in specIds', () => {
      const payload = { specIds: ['SPEC-001', ''] };
      const result = validatePlanGeneratePayload(payload);

      expect(result.success).toBe(false);
    });
  });

  describe('validateBootstrapCheckPayload', () => {
    it('should validate valid bootstrap check payload', () => {
      const payload = {};
      const result = validateBootstrapCheckPayload(payload);

      expect(result.success).toBe(true);
    });
  });

  describe('validateConfigGetPayload', () => {
    it('should validate valid config get payload', () => {
      const payload = { key: 'claudePath' };
      const result = validateConfigGetPayload(payload);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(payload);
      }
    });

    it('should reject payload with invalid key', () => {
      const payload = { key: 'invalidKey' };
      const result = validateConfigGetPayload(payload);

      expect(result.success).toBe(false);
    });

    it('should reject payload with empty key', () => {
      const payload = { key: '' };
      const result = validateConfigGetPayload(payload);

      expect(result.success).toBe(false);
    });

    it('should reject payload with missing key', () => {
      const payload = {} as { key: string };
      const result = validateConfigGetPayload(payload);

      expect(result.success).toBe(false);
    });
  });

  describe('sanitizeString', () => {
    it('should remove script tags', () => {
      const input = '<script>alert("xss")</script>test';
      const result = sanitizeString(input);

      expect(result).not.toContain('<script>');
      expect(result).not.toContain('</script>');
      expect(result).toContain('test');
    });

    it('should remove javascript: protocol', () => {
      const input = 'javascript:alert("xss")';
      const result = sanitizeString(input);

      expect(result).not.toContain('javascript:');
    });

    it('should remove onerror attributes', () => {
      const input = '<img onerror="alert(1)">';
      const result = sanitizeString(input);

      expect(result).not.toContain('onerror');
    });

    it('should remove onclick attributes', () => {
      const input = '<div onclick="alert(1)">click</div>';
      const result = sanitizeString(input);

      expect(result).not.toContain('onclick');
    });

    it('should preserve safe text', () => {
      const input = 'Hello, World!';
      const result = sanitizeString(input);

      expect(result).toBe(input);
    });

    it('should handle empty string', () => {
      const input = '';
      const result = sanitizeString(input);

      expect(result).toBe('');
    });

    it('should remove multiple script tags', () => {
      const input = '<script>alert(1)</script>text<script>alert(2)</script>';
      const result = sanitizeString(input);

      expect(result).not.toContain('<script>');
      expect(result).not.toContain('</script>');
    });

    it('should remove data URLs with javascript', () => {
      const input = 'data:text/javascript,<script>alert(1)</script>';
      const result = sanitizeString(input);

      expect(result).not.toContain('javascript:');
    });

    it('should decode HTML entities', () => {
      const input = '&lt;script&gt;alert(1)&lt;/script&gt;';
      const result = sanitizeString(input);

      // Should be decoded then sanitized
      expect(result).not.toContain('<script>');
    });
  });

  describe('validateIpcChannel', () => {
    it('should validate known IPC channels', () => {
      const validChannels = [
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
      ];

      for (const channel of validChannels) {
        const result = validateIpcChannel(channel);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(channel);
        }
      }
    });

    it('should reject unknown IPC channels', () => {
      const result = validateIpcChannel('unknown:channel');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toBeDefined();
      }
    });

    it('should reject empty channel', () => {
      const result = validateIpcChannel('');

      expect(result.success).toBe(false);
    });

    it('should reject channel without colon separator', () => {
      const result = validateIpcChannel('invalidchannel');

      expect(result.success).toBe(false);
    });

    it('should reject channel with multiple colons', () => {
      const result = validateIpcChannel('invalid:channel:name');

      expect(result.success).toBe(false);
    });
  });

  describe('input sanitization integration', () => {
    it('should sanitize string inputs in payloads', () => {
      const payload = {
        specId: '<script>alert("xss")</script>SPEC-001',
      };

      const result = validateSessionStartPayload(payload);

      // Sanitization removes script tags, leaving "SPEC-001" which is valid
      // But the sanitization happens in validateSchema, so it should pass
      expect(result.success).toBe(true);
      if (result.success) {
        // After sanitization, script tags should be removed
        expect(result.data.specId).not.toContain('<script>');
      }
    });

    it('should handle sanitized but valid inputs', () => {
      const payload = {
        specId: 'SPEC-001<script></script>',
      };

      const result = validateSessionStartPayload(payload);

      // After sanitization, script tags are removed, leaving "SPEC-001" which is valid
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.specId).not.toContain('<script>');
        expect(result.data.specId).toBe('SPEC-001');
      }
    });
  });
});
