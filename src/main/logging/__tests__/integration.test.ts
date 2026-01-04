/**
 * Integration Tests for Logging System
 * SPEC-LOGGING-001: Complete logging system integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  LoggerService,
  LogLevel,
  FileTransport,
  ConsoleTransport,
  DiagnosticService,
  DebugMode,
} from '../index';
import * as fs from 'fs/promises';
import { join } from 'path';

describe('Logging System Integration - SPEC-LOGGING-001', () => {
  const testLogDir = join(process.cwd(), 'test-integration-logs');

  beforeEach(async () => {
    // Reset singleton instances
    (LoggerService as any).instance = null;
    (DebugMode as any).instance = null;

    // Clean up test directory
    try {
      await fs.rm(testLogDir, { recursive: true, force: true });
    } catch {
      // Ignore if directory doesn't exist
    }
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testLogDir, { recursive: true, force: true });
    } catch {
      // Ignore if directory doesn't exist
    }
  });

  describe('REQ-001: Log Levels', () => {
    it('should support all required log levels', () => {
      // Given: Logger instance
      const logger = LoggerService.getInstance();
      logger.setLevel(LogLevel.DEBUG);

      // When: Logging at all levels
      const logSpy = vi.spyOn(logger as any, 'writeLog').mockImplementation(() => {});

      logger.debug('Debug');
      logger.info('Info');
      logger.warn('Warn');
      logger.error('Error');
      logger.fatal('Fatal');

      // Then: All levels should be logged
      expect(logSpy).toHaveBeenCalledTimes(5);
    });
  });

  describe('REQ-002: Centralized Logger', () => {
    it('should maintain singleton pattern', () => {
      // Given: LoggerService class
      // When: Getting instance multiple times
      const instance1 = LoggerService.getInstance();
      const instance2 = LoggerService.getInstance();

      // Then: Should return same instance
      expect(instance1).toBe(instance2);
    });

    it('should provide structured logging', () => {
      // Given: Logger instance
      const logger = LoggerService.getInstance();
      logger.setLevel(LogLevel.DEBUG);

      // When: Logging with context
      const logSpy = vi.spyOn(logger as any, 'writeLog').mockImplementation(() => {});
      const context = { userId: '123', action: 'test' };

      logger.info('Test message', context);

      // Then: Context should be included
      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          context,
        })
      );
    });
  });

  describe('REQ-003: File Logging', () => {
    it('should write logs to files', async () => {
      // Given: Logger with file transport
      const logger = LoggerService.getInstance();
      const fileTransport = new FileTransport({
        logDir: testLogDir,
        maxFileSize: 1024 * 1024,
        maxFiles: 5,
      });

      logger.addTransport((entry) => fileTransport.write(entry));

      // When: Logging a message
      logger.info('Test message');

      // Then: File should be created (wait for async write)
      await new Promise((resolve) => setTimeout(resolve, 100));
      const files = await fs.readdir(testLogDir);
      expect(files.length).toBeGreaterThan(0);
    });
  });

  describe('REQ-004: Console Logging', () => {
    it('should output to console with colors', () => {
      // Given: Console transport
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const consoleTransport = new ConsoleTransport({ colors: true });

      // When: Writing to console
      consoleTransport.write({
        level: LogLevel.INFO,
        message: 'Test message',
        timestamp: new Date().toISOString(),
      });

      // Then: Console should be called
      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls[0][0] as string;
      expect(output).toContain('Test message');
    });
  });

  describe('REQ-005: Diagnostic Bundle', () => {
    it('should generate diagnostic bundle', async () => {
      // Given: DiagnosticService
      const diagnosticService = new DiagnosticService({
        logDir: testLogDir,
        outputDir: testLogDir,
      });

      // When: Generating bundle
      const bundlePath = await diagnosticService.generateBundle();

      // Then: Bundle directory should be created
      const files = await fs.readdir(bundlePath);
      expect(files).toContain('system-info.json');
    });
  });

  describe('REQ-006: Debug Mode', () => {
    it('should enable debug mode with DEBUG level', () => {
      // Given: Logger and DebugMode
      const logger = LoggerService.getInstance();
      const debugMode = DebugMode.getInstance(logger);

      // When: Enabling debug mode
      debugMode.enable();

      // Then: Log level should be DEBUG
      expect(logger.getLevel()).toBe(LogLevel.DEBUG);
      expect(debugMode.isEnabled()).toBe(true);
    });

    it('should record performance metrics when enabled', () => {
      // Given: DebugMode with performance metrics
      const logger = LoggerService.getInstance();
      const debugMode = DebugMode.getInstance(logger);
      debugMode.enable({ performanceMetrics: true });

      // When: Recording metrics
      debugMode.recordMetric('test-operation', 100);
      debugMode.recordMetric('test-operation', 200);
      debugMode.recordMetric('test-operation', 150);

      // Then: Metrics should be recorded
      const metrics = debugMode.getMetrics('test-operation');
      expect(metrics).toBeTruthy();
      expect(metrics?.avg).toBe(150);
      expect(metrics?.count).toBe(3);
    });

    it('should trace IPC messages when enabled', () => {
      // Given: DebugMode with IPC tracing
      const logger = LoggerService.getInstance();
      logger.setLevel(LogLevel.DEBUG);
      const debugMode = DebugMode.getInstance(logger);
      const logSpy = vi.spyOn(logger as any, 'writeLog').mockImplementation(() => {});

      debugMode.enable({ ipcTracing: true });

      // Clear previous calls (like "Debug mode enabled")
      logSpy.mockClear();

      // When: Logging IPC message
      debugMode.logIpc('test-channel', { data: 'test' });

      // Then: IPC should be logged
      expect(logSpy).toHaveBeenCalled();
      const call = logSpy.mock.calls[0][0];
      expect(call.message).toContain('IPC: test-channel');
    });
  });

  describe('End-to-End Integration', () => {
    it('should work with all components together', () => {
      // Given: All logging components
      const logger = LoggerService.getInstance();
      logger.setLevel(LogLevel.DEBUG);

      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const logSpy = vi.spyOn(logger as any, 'writeLog').mockImplementation(() => {});

      const debugMode = DebugMode.getInstance(logger);
      debugMode.enable({
        ipcTracing: true,
        performanceMetrics: true,
        verboseOutput: true,
      });

      // When: Using various features
      logger.info('Application started');
      debugMode.logIpc('init', { version: '1.0.0' });
      debugMode.recordMetric('startup', 250);
      logger.warn('Warning message');
      logger.error('Error message', { error: new Error('Test error') });

      // Then: All should work together
      expect(logSpy).toHaveBeenCalledTimes(5);
      expect(debugMode.isEnabled()).toBe(true);
      const metrics = debugMode.getMetrics('startup');
      expect(metrics?.count).toBe(1);
    });
  });
});
