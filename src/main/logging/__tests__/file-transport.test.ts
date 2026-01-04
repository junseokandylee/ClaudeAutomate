/**
 * TAG-003: File Logging Tests
 * REQ-003: File Logging (rotation, retention, compression)
 *
 * RED Phase: Write failing tests first
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FileTransport } from '../file-transport';
import { LogLevel } from '../log-levels';
import * as fs from 'fs/promises';
import { join } from 'path';

describe('FileTransport - TAG-003', () => {
  const testLogDir = join(process.cwd(), 'test-logs');
  let fileTransport: FileTransport;

  beforeEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testLogDir, { recursive: true, force: true });
    } catch {
      // Ignore if directory doesn't exist
    }
    await fs.mkdir(testLogDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testLogDir, { recursive: true, force: true });
    } catch {
      // Ignore if directory doesn't exist
    }
  });

  describe('File Writing', () => {
    it('should write log entries to file', async () => {
      // Given: FileTransport instance
      fileTransport = new FileTransport({
        logDir: testLogDir,
        maxFileSize: 1024 * 1024, // 1MB
        maxFiles: 5,
      });

      // When: Writing log entry
      await fileTransport.write({
        level: LogLevel.INFO,
        message: 'Test message',
        timestamp: new Date().toISOString(),
      });

      // Then: File should exist
      const logFiles = await fs.readdir(testLogDir);
      expect(logFiles.length).toBeGreaterThan(0);

      // And: File should contain the log entry
      const logPath = join(testLogDir, logFiles[0]);
      const content = await fs.readFile(logPath, 'utf-8');
      expect(content).toContain('Test message');
      expect(content).toContain('info'); // Log level is lowercase in JSON
    });

    it('should append to existing file', async () => {
      // Given: FileTransport instance
      fileTransport = new FileTransport({
        logDir: testLogDir,
        maxFileSize: 1024 * 1024,
        maxFiles: 5,
      });

      // When: Writing multiple entries
      await fileTransport.write({
        level: LogLevel.INFO,
        message: 'First message',
        timestamp: new Date().toISOString(),
      });
      await fileTransport.write({
        level: LogLevel.ERROR,
        message: 'Second message',
        timestamp: new Date().toISOString(),
      });

      // Then: Both entries should be in file
      const logFiles = await fs.readdir(testLogDir);
      const logPath = join(testLogDir, logFiles[0]);
      const content = await fs.readFile(logPath, 'utf-8');
      expect(content).toContain('First message');
      expect(content).toContain('Second message');
    });
  });

  describe('File Rotation', () => {
    it('should rotate file when size exceeds maxFileSize', async () => {
      // Given: FileTransport with small maxFileSize
      fileTransport = new FileTransport({
        logDir: testLogDir,
        maxFileSize: 100, // Very small for testing
        maxFiles: 5,
      });

      // When: Writing data that exceeds maxFileSize
      const largeMessage = 'x'.repeat(200);
      await fileTransport.write({
        level: LogLevel.INFO,
        message: largeMessage,
        timestamp: new Date().toISOString(),
      });

      // Then: File should be rotated
      const logFiles = await fs.readdir(testLogDir);
      expect(logFiles.length).toBeGreaterThan(0);
    });

    it('should add timestamp suffix to rotated files', async () => {
      // Given: FileTransport instance
      fileTransport = new FileTransport({
        logDir: testLogDir,
        maxFileSize: 100,
        maxFiles: 5,
      });

      // When: File rotates
      await fileTransport.write({
        level: LogLevel.INFO,
        message: 'First message',
        timestamp: new Date().toISOString(),
      });
      await fileTransport.forceRotation(); // Force rotation

      // Then: Rotated files should have timestamp suffix
      const logFiles = await fs.readdir(testLogDir);
      const rotatedFiles = logFiles.filter((file) => file.includes('.log.'));
      expect(rotatedFiles.length).toBeGreaterThan(0);
    });
  });

  describe('Archive Cleanup', () => {
    it('should delete oldest archives when maxFiles exceeded', async () => {
      // Given: FileTransport with maxFiles=3
      fileTransport = new FileTransport({
        logDir: testLogDir,
        maxFileSize: 50,
        maxFiles: 3, // Keep only 3 files
      });

      // When: Creating more than maxFiles
      for (let i = 0; i < 5; i++) {
        const largeMessage = `x`.repeat(100);
        await fileTransport.write({
          level: LogLevel.INFO,
          message: largeMessage,
          timestamp: new Date().toISOString(),
        });
        await fileTransport.forceRotation(); // Force rotation for each
        // Small delay to ensure different timestamps
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      // Then: Only maxFiles should remain (including app.log)
      const logFiles = await fs.readdir(testLogDir);
      expect(logFiles.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Log Formatting', () => {
    it('should format logs as JSON', async () => {
      // Given: FileTransport instance
      fileTransport = new FileTransport({
        logDir: testLogDir,
        maxFileSize: 1024 * 1024,
        maxFiles: 5,
      });

      // When: Writing log entry
      const entry = {
        level: LogLevel.INFO,
        message: 'Test message',
        timestamp: new Date().toISOString(),
        context: { userId: '123' },
      };
      await fileTransport.write(entry);

      // Then: Should be valid JSON
      const logFiles = await fs.readdir(testLogDir);
      const logPath = join(testLogDir, logFiles[0]);
      const content = await fs.readFile(logPath, 'utf-8');
      const lines = content.trim().split('\n');

      lines.forEach((line) => {
        expect(() => JSON.parse(line)).not.toThrow();
      });
    });
  });
});
