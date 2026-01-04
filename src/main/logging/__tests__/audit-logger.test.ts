/**
 * TAG-TEST-002: Audit Logger Tests
 *
 * Test suite for AuditLogger implementing REQ-007 (Audit Logging):
 * - Log authentication attempts
 * - Record configuration changes
 * - Track sensitive operations
 * - Rotate audit logs securely
 *
 * Technical Constraints:
 * - JSON log format
 * - Secure log rotation
 * - Log file size limits
 * - Archive management
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuditLogger } from '../audit-logger';
import { mkdir, readFile, unlink, stat } from 'fs/promises';
import { existsSync } from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('AuditLogger', () => {
  let logger: AuditLogger;
  let tempDir: string;

  beforeEach(async () => {
    // Create temporary directory for test logs
    tempDir = path.join(os.tmpdir(), `audit-test-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });

    logger = new AuditLogger({
      logDir: tempDir,
      maxLogSize: 1024, // 1KB for testing
      maxArchiveFiles: 3,
    });
  });

  afterEach(async () => {
    await logger.close();
    // Cleanup temp directory
    try {
      const files = await import('fs/promises').then((fs) => fs.readdir(tempDir));
      await Promise.all(
        files.map((file) => unlink(path.join(tempDir, file)))
      );
      await unlink(tempDir).catch(() => {});
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('logAuthenticationAttempt', () => {
    it('should log successful authentication', async () => {
      await logger.logAuthenticationAttempt({
        userId: 'user-123',
        success: true,
        method: 'api-key',
        timestamp: new Date().toISOString(),
      });

      await logger.flush();

      const logs = await readAuditLog(tempDir);
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        eventType: 'AUTHENTICATION_ATTEMPT',
        userId: 'user-123',
        success: true,
        method: 'api-key',
      });
    });

    it('should log failed authentication', async () => {
      await logger.logAuthenticationAttempt({
        userId: 'user-456',
        success: false,
        method: 'password',
        failureReason: 'Invalid credentials',
        timestamp: new Date().toISOString(),
      });

      await logger.flush();

      const logs = await readAuditLog(tempDir);
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        eventType: 'AUTHENTICATION_ATTEMPT',
        userId: 'user-456',
        success: false,
        failureReason: 'Invalid credentials',
      });
    });

    it('should validate required fields', async () => {
      await expect(
        logger.logAuthenticationAttempt({
          userId: '',
          success: true,
          method: 'api-key',
          timestamp: new Date().toISOString(),
        })
      ).rejects.toThrow('userId is required');
    });
  });

  describe('logConfigurationChange', () => {
    it('should log configuration changes', async () => {
      await logger.logConfigurationChange({
        key: 'claudePath',
        oldValue: '/old/path',
        newValue: '/new/path',
        userId: 'user-123',
        timestamp: new Date().toISOString(),
      });

      await logger.flush();

      const logs = await readAuditLog(tempDir);
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        eventType: 'CONFIGURATION_CHANGE',
        key: 'claudePath',
        oldValue: '/old/path',
        newValue: '/new/path',
        userId: 'user-123',
      });
    });

    it('should handle sensitive value redaction', async () => {
      await logger.logConfigurationChange({
        key: 'apiKey',
        oldValue: 'sk-ant-api03-secret',
        newValue: 'sk-ant-api03-new-secret',
        userId: 'user-123',
        timestamp: new Date().toISOString(),
      });

      await logger.flush();

      const logs = await readAuditLog(tempDir);
      expect(logs).toHaveLength(1);
      expect(logs[0].oldValue).toBe('[REDACTED]');
      expect(logs[0].newValue).toBe('[REDACTED]');
    });
  });

  describe('logSensitiveOperation', () => {
    it('should log sensitive operations', async () => {
      await logger.logSensitiveOperation({
        operation: 'CREDENTIAL_ACCESS',
        resource: 'api-key',
        userId: 'user-123',
        success: true,
        timestamp: new Date().toISOString(),
      });

      await logger.flush();

      const logs = await readAuditLog(tempDir);
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        eventType: 'SENSITIVE_OPERATION',
        operation: 'CREDENTIAL_ACCESS',
        resource: 'api-key',
        userId: 'user-123',
        success: true,
      });
    });

    it('should include metadata if provided', async () => {
      await logger.logSensitiveOperation({
        operation: 'FILE_ACCESS',
        resource: '/etc/passwd',
        userId: 'user-123',
        success: false,
        failureReason: 'Access denied',
        metadata: { attempt: 1, ip: '192.168.1.1' },
        timestamp: new Date().toISOString(),
      });

      await logger.flush();

      const logs = await readAuditLog(tempDir);
      expect(logs).toHaveLength(1);
      expect(logs[0].metadata).toMatchObject({
        attempt: 1,
        ip: '192.168.1.1',
      });
    });
  });

  describe('log rotation', () => {
    it('should rotate log when size exceeds limit', async () => {
      // Write large log entries to trigger rotation
      const largeData = 'x'.repeat(500);

      for (let i = 0; i < 5; i++) {
        await logger.logAuthenticationAttempt({
          userId: `user-${i}`,
          success: true,
          method: 'api-key',
          timestamp: new Date().toISOString(),
          metadata: { data: largeData },
        });
      }

      await logger.flush();

      const logFile = path.join(tempDir, 'audit.log');
      const stats = await stat(logFile);
      expect(stats.size).toBeLessThanOrEqual(1024);
    });

    it('should maintain archive files', async () => {
      const largeData = 'x'.repeat(500);

      for (let i = 0; i < 10; i++) {
        await logger.logSensitiveOperation({
          operation: 'TEST',
          resource: `resource-${i}`,
          userId: 'user-123',
          success: true,
          timestamp: new Date().toISOString(),
          metadata: { data: largeData },
        });
      }

      await logger.flush();

      const files = await import('fs/promises').then((fs) => fs.readdir(tempDir));
      const archiveFiles = files.filter((f) => f.startsWith('audit.log.') || f === 'audit.log');

      expect(archiveFiles.length).toBeGreaterThan(1);
    });

    it('should limit number of archive files', async () => {
      const largeData = 'x'.repeat(300);

      // Write enough to create multiple rotations
      for (let i = 0; i < 20; i++) {
        await logger.logAuthenticationAttempt({
          userId: `user-${i}`,
          success: true,
          method: 'api-key',
          timestamp: new Date().toISOString(),
          metadata: { data: largeData },
        });
      }

      await logger.flush();

      const files = await import('fs/promises').then((fs) => fs.readdir(tempDir));
      const archiveFiles = files.filter((f) => f.startsWith('audit.log'));

      // Should not exceed maxArchiveFiles + current log
      expect(archiveFiles.length).toBeLessThanOrEqual(4); // 3 archives + 1 current
    });
  });

  describe('queryLogs', () => {
    beforeEach(async () => {
      // Seed test data
      await logger.logAuthenticationAttempt({
        userId: 'user-123',
        success: true,
        method: 'api-key',
        timestamp: new Date().toISOString(),
      });

      await logger.logConfigurationChange({
        key: 'locale',
        oldValue: 'en',
        newValue: 'ko',
        userId: 'user-123',
        timestamp: new Date().toISOString(),
      });

      await logger.flush();
    });

    it('should query all logs', async () => {
      const logs = await logger.queryLogs({});

      expect(logs).toHaveLength(2);
    });

    it('should filter by event type', async () => {
      const logs = await logger.queryLogs({
        eventType: 'AUTHENTICATION_ATTEMPT',
      });

      expect(logs).toHaveLength(1);
      expect(logs[0].eventType).toBe('AUTHENTICATION_ATTEMPT');
    });

    it('should filter by user ID', async () => {
      const logs = await logger.queryLogs({
        userId: 'user-123',
      });

      expect(logs).toHaveLength(2);
    });

    it('should filter by date range', async () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const logs = await logger.queryLogs({
        startDate: oneHourAgo.toISOString(),
        endDate: now.toISOString(),
      });

      expect(logs.length).toBeGreaterThan(0);
    });
  });

  describe('flush', () => {
    it('should flush buffered logs to disk', async () => {
      await logger.logAuthenticationAttempt({
        userId: 'user-123',
        success: true,
        method: 'api-key',
        timestamp: new Date().toISOString(),
      });

      // Before flush, file might not exist or be empty
      const logFile = path.join(tempDir, 'audit.log');
      const existsBefore = existsSync(logFile);

      await logger.flush();

      const existsAfter = existsSync(logFile);

      if (existsBefore) {
        const logs = await readAuditLog(tempDir);
        expect(logs.length).toBeGreaterThan(0);
      } else {
        expect(existsAfter).toBe(true);
      }
    });
  });

  describe('close', () => {
    it('should close logger and flush remaining logs', async () => {
      await logger.logAuthenticationAttempt({
        userId: 'user-123',
        success: true,
        method: 'api-key',
        timestamp: new Date().toISOString(),
      });

      await logger.close();

      const logs = await readAuditLog(tempDir);
      expect(logs).toHaveLength(1);
    });
  });
});

/**
 * Helper function to read audit log entries
 */
async function readAuditLog(logDir: string): Promise<any[]> {
  const logFile = path.join(logDir, 'audit.log');

  if (!existsSync(logFile)) {
    return [];
  }

  const content = await readFile(logFile, 'utf-8');
  const lines = content.trim().split('\n').filter(Boolean);

  return lines.map((line) => {
    try {
      return JSON.parse(line);
    } catch (error) {
      return null;
    }
  }).filter(Boolean);
}
