/**
 * TAG-001: Log Levels Tests
 * REQ-001: Log Levels (DEBUG, INFO, WARN, ERROR, FATAL)
 *
 * RED Phase: Write failing tests first
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LogLevel, LogLevels } from '../log-levels';

describe('LogLevel - TAG-001', () => {
  describe('LogLevel enum', () => {
    it('should define all required log levels', () => {
      // Given: LogLevel enum is defined
      // Then: All required levels should exist
      expect(LogLevel.DEBUG).toBeDefined();
      expect(LogLevel.INFO).toBeDefined();
      expect(LogLevel.WARN).toBeDefined();
      expect(LogLevel.ERROR).toBeDefined();
      expect(LogLevel.FATAL).toBeDefined();
    });

    it('should have correct string values', () => {
      // Given: LogLevel enum
      // Then: Values should match specification
      expect(LogLevel.DEBUG).toBe('debug');
      expect(LogLevel.INFO).toBe('info');
      expect(LogLevel.WARN).toBe('warn');
      expect(LogLevel.ERROR).toBe('error');
      expect(LogLevel.FATAL).toBe('fatal');
    });

    it('should have numeric priorities in correct order', () => {
      // Given: LogLevel priorities
      // When: Comparing priorities
      // Then: DEBUG < INFO < WARN < ERROR < FATAL
      const priorities = LogLevels.getPriorities();
      expect(priorities[LogLevel.DEBUG]).toBeLessThan(priorities[LogLevel.INFO]);
      expect(priorities[LogLevel.INFO]).toBeLessThan(priorities[LogLevel.WARN]);
      expect(priorities[LogLevel.WARN]).toBeLessThan(priorities[LogLevel.ERROR]);
      expect(priorities[LogLevel.ERROR]).toBeLessThan(priorities[LogLevel.FATAL]);
    });
  });

  describe('isValidLogLevel', () => {
    it('should return true for valid log levels', () => {
      // Given: Valid log level strings
      // When: Checking validity
      // Then: Should return true
      expect(LogLevels.isValid('debug')).toBe(true);
      expect(LogLevels.isValid('info')).toBe(true);
      expect(LogLevels.isValid('warn')).toBe(true);
      expect(LogLevels.isValid('error')).toBe(true);
      expect(LogLevels.isValid('fatal')).toBe(true);
    });

    it('should return false for invalid log levels', () => {
      // Given: Invalid log level strings
      // When: Checking validity
      // Then: Should return false
      expect(LogLevels.isValid('invalid')).toBe(false);
      expect(LogLevels.isValid('')).toBe(false);
      expect(LogLevels.isValid('TRACE')).toBe(false);
      expect(LogLevels.isValid('test')).toBe(false);
    });

    it('should be case-sensitive', () => {
      // Given: Uppercase log level strings
      // When: Checking validity
      // Then: Should return false (case-sensitive)
      expect(LogLevels.isValid('DEBUG')).toBe(false);
      expect(LogLevels.isValid('INFO')).toBe(false);
    });
  });

  describe('compareLevels', () => {
    it('should return negative when first level is lower priority', () => {
      // Given: DEBUG and INFO levels
      // When: Comparing DEBUG to INFO
      // Then: Should return negative number
      const result = LogLevels.compare(LogLevel.DEBUG, LogLevel.INFO);
      expect(result).toBeLessThan(0);
    });

    it('should return positive when first level is higher priority', () => {
      // Given: ERROR and WARN levels
      // When: Comparing ERROR to WARN
      // Then: Should return positive number
      const result = LogLevels.compare(LogLevel.ERROR, LogLevel.WARN);
      expect(result).toBeGreaterThan(0);
    });

    it('should return zero when levels are equal', () => {
      // Given: Two INFO levels
      // When: Comparing INFO to INFO
      // Then: Should return zero
      const result = LogLevels.compare(LogLevel.INFO, LogLevel.INFO);
      expect(result).toBe(0);
    });
  });

  describe('fromString', () => {
    it('should convert valid string to LogLevel', () => {
      // Given: Valid log level strings
      // When: Converting to LogLevel
      // Then: Should return corresponding LogLevel
      expect(LogLevels.fromString('debug')).toBe(LogLevel.DEBUG);
      expect(LogLevels.fromString('info')).toBe(LogLevel.INFO);
      expect(LogLevels.fromString('warn')).toBe(LogLevel.WARN);
      expect(LogLevels.fromString('error')).toBe(LogLevel.ERROR);
      expect(LogLevels.fromString('fatal')).toBe(LogLevel.FATAL);
    });

    it('should throw error for invalid string', () => {
      // Given: Invalid log level string
      // When: Converting to LogLevel
      // Then: Should throw error
      expect(() => LogLevels.fromString('invalid')).toThrow();
      expect(() => LogLevels.fromString('')).toThrow();
    });

    it('should be case-sensitive', () => {
      // Given: Uppercase string
      // When: Converting to LogLevel
      // Then: Should throw error
      expect(() => LogLevels.fromString('DEBUG')).toThrow();
    });
  });

  describe('getAllLevels', () => {
    it('should return all log levels in priority order', () => {
      // Given: LogLevel enum
      // When: Getting all levels
      // Then: Should return array in priority order
      const levels = LogLevels.getAllLevels();
      expect(levels).toEqual([
        LogLevel.DEBUG,
        LogLevel.INFO,
        LogLevel.WARN,
        LogLevel.ERROR,
        LogLevel.FATAL,
      ]);
    });
  });

  describe('getLabel', () => {
    it('should return human-readable label for each level', () => {
      // Given: LogLevel enum
      // When: Getting labels
      // Then: Should return capitalized labels
      expect(LogLevels.getLabel(LogLevel.DEBUG)).toBe('DEBUG');
      expect(LogLevels.getLabel(LogLevel.INFO)).toBe('INFO');
      expect(LogLevels.getLabel(LogLevel.WARN)).toBe('WARN');
      expect(LogLevels.getLabel(LogLevel.ERROR)).toBe('ERROR');
      expect(LogLevels.getLabel(LogLevel.FATAL)).toBe('FATAL');
    });
  });

  describe('getColor', () => {
    it('should return appropriate color for each level', () => {
      // Given: LogLevel enum
      // When: Getting colors
      // Then: Should return color codes
      expect(LogLevels.getColor(LogLevel.DEBUG)).toBeDefined();
      expect(LogLevels.getColor(LogLevel.INFO)).toBeDefined();
      expect(LogLevels.getColor(LogLevel.WARN)).toBeDefined();
      expect(LogLevels.getColor(LogLevel.ERROR)).toBeDefined();
      expect(LogLevels.getColor(LogLevel.FATAL)).toBeDefined();
    });

    it('should return different colors for different levels', () => {
      // Given: Different log levels
      // When: Getting colors
      // Then: Colors should differ
      const debugColor = LogLevels.getColor(LogLevel.DEBUG);
      const errorColor = LogLevels.getColor(LogLevel.ERROR);
      expect(debugColor).not.toBe(errorColor);
    });
  });
});
