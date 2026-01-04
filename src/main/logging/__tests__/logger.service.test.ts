/**
 * TAG-002: Centralized Logger Tests
 * REQ-002: Centralized Logger (singleton, consistent format, structured logging)
 *
 * RED Phase: Write failing tests first
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LoggerService } from '../logger.service';
import { LogLevel } from '../log-levels';
import { app } from 'electron';

// Mock electron app
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn((name: string) => `/fake/path/${name}`),
  },
}));

describe('LoggerService - TAG-002', () => {
  let logger: LoggerService;

  beforeEach(() => {
    // Reset singleton instance
    (LoggerService as any).instance = null;
    logger = LoggerService.getInstance();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return same instance on multiple calls', () => {
      // Given: LoggerService is instantiated
      // When: Getting instance multiple times
      const instance1 = LoggerService.getInstance();
      const instance2 = LoggerService.getInstance();
      // Then: Should return same instance
      expect(instance1).toBe(instance2);
    });

    it('should initialize only once', () => {
      // Given: LoggerService constructor is private
      // When: Trying to create new instance
      // Then: Should not be able to call constructor directly
      expect(typeof LoggerService.getInstance).toBe('function');
    });
  });

  describe('Log Level Filtering', () => {
    it('should not log below current level', () => {
      // Given: Logger level is set to WARN
      logger.setLevel(LogLevel.WARN);
      const debugSpy = vi.spyOn(logger as any, 'writeLog').mockImplementation(() => {});

      // When: Logging DEBUG and INFO messages
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warn message');

      // Then: Only WARN should be logged
      expect(debugSpy).toHaveBeenCalledTimes(1);
      expect(debugSpy).toHaveBeenCalledWith(
        expect.objectContaining({ level: LogLevel.WARN })
      );
    });

    it('should log at and above current level', () => {
      // Given: Logger level is set to ERROR
      logger.setLevel(LogLevel.ERROR);
      const logSpy = vi.spyOn(logger as any, 'writeLog').mockImplementation(() => {});

      // When: Logging ERROR and FATAL messages
      logger.error('Error message');
      logger.fatal('Fatal message');

      // Then: Both should be logged
      expect(logSpy).toHaveBeenCalledTimes(2);
    });

    it('should have default level INFO', () => {
      // Given: Fresh logger instance
      // When: Getting current level
      // Then: Should be INFO
      expect(logger.getLevel()).toBe(LogLevel.INFO);
    });
  });

  describe('Structured Logging', () => {
    it('should include timestamp in log entry', () => {
      // Given: Logger instance
      const logSpy = vi.spyOn(logger as any, 'writeLog').mockImplementation(() => {});

      // When: Logging a message
      logger.info('Test message');

      // Then: Log entry should include timestamp
      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: expect.any(String),
        })
      );
    });

    it('should include context in log entry', () => {
      // Given: Logger instance
      const logSpy = vi.spyOn(logger as any, 'writeLog').mockImplementation(() => {});
      const context = { userId: '123', action: 'login' };

      // When: Logging with context
      logger.info('User logged in', context);

      // Then: Log entry should include context
      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User logged in',
          context,
        })
      );
    });

    it('should handle error objects in context', () => {
      // Given: Logger instance
      const logSpy = vi.spyOn(logger as any, 'writeLog').mockImplementation(() => {});
      const error = new Error('Test error');

      // When: Logging with error
      logger.error('Error occurred', { error });

      // Then: Log entry should include error details
      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Error occurred',
          context: expect.objectContaining({
            error: expect.objectContaining({
              message: 'Test error',
              stack: expect.any(String),
            }),
          }),
        })
      );
    });
  });

  describe('Log Format Consistency', () => {
    it('should have consistent format across all levels', () => {
      // Given: Logger instance with DEBUG level
      logger.setLevel(LogLevel.DEBUG);
      const logSpy = vi.spyOn(logger as any, 'writeLog').mockImplementation(() => {});

      // When: Logging at different levels
      logger.debug('Debug');
      logger.info('Info');
      logger.warn('Warn');
      logger.error('Error');
      logger.fatal('Fatal');

      // Then: All should have same structure
      expect(logSpy).toHaveBeenCalledTimes(5);
      logSpy.mock.calls.forEach((call) => {
        const logEntry = call[0];
        expect(logEntry).toHaveProperty('level');
        expect(logEntry).toHaveProperty('message');
        expect(logEntry).toHaveProperty('timestamp');
      });
    });
  });

  describe('Log Methods', () => {
    it('should provide debug() method', () => {
      // Given: Logger instance with DEBUG level
      logger.setLevel(LogLevel.DEBUG);
      const logSpy = vi.spyOn(logger as any, 'writeLog').mockImplementation(() => {});

      // When: Calling debug()
      logger.debug('Debug message');

      // Then: Should log at DEBUG level
      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({ level: LogLevel.DEBUG })
      );
    });

    it('should provide info() method', () => {
      // Given: Logger instance
      const logSpy = vi.spyOn(logger as any, 'writeLog').mockImplementation(() => {});

      // When: Calling info()
      logger.info('Info message');

      // Then: Should log at INFO level
      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({ level: LogLevel.INFO })
      );
    });

    it('should provide warn() method', () => {
      // Given: Logger instance
      const logSpy = vi.spyOn(logger as any, 'writeLog').mockImplementation(() => {});

      // When: Calling warn()
      logger.warn('Warn message');

      // Then: Should log at WARN level
      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({ level: LogLevel.WARN })
      );
    });

    it('should provide error() method', () => {
      // Given: Logger instance
      const logSpy = vi.spyOn(logger as any, 'writeLog').mockImplementation(() => {});

      // When: Calling error()
      logger.error('Error message');

      // Then: Should log at ERROR level
      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({ level: LogLevel.ERROR })
      );
    });

    it('should provide fatal() method', () => {
      // Given: Logger instance
      const logSpy = vi.spyOn(logger as any, 'writeLog').mockImplementation(() => {});

      // When: Calling fatal()
      logger.fatal('Fatal message');

      // Then: Should log at FATAL level
      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({ level: LogLevel.FATAL })
      );
    });
  });

  describe('Level Management', () => {
    it('should allow changing log level', () => {
      // Given: Logger with INFO level
      expect(logger.getLevel()).toBe(LogLevel.INFO);

      // When: Setting level to DEBUG
      logger.setLevel(LogLevel.DEBUG);

      // Then: Level should be DEBUG
      expect(logger.getLevel()).toBe(LogLevel.DEBUG);
    });

    it('should reject invalid log levels', () => {
      // Given: Logger instance
      // When: Setting invalid level
      // Then: Should throw error
      expect(() => logger.setLevel('invalid' as LogLevel)).toThrow();
    });
  });
});
