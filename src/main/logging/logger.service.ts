/**
 * TAG-002: Centralized Logger Implementation
 * REQ-002: Centralized Logger (singleton, consistent format, structured logging)
 *
 * GREEN Phase: Minimal implementation to pass tests
 */

import { LogLevel, LogLevels } from './log-levels';
import { app } from 'electron';

/**
 * Log entry interface
 */
interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

/**
 * LoggerService - Singleton centralized logging service
 */
export class LoggerService {
  private static instance: LoggerService | null = null;
  private currentLevel: LogLevel = LogLevel.INFO;
  private transports: Array<(entry: LogEntry) => void> = [];

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  /**
   * Set log level
   */
  setLevel(level: LogLevel): void {
    if (!LogLevels.isValid(level)) {
      throw new Error(`Invalid log level: ${level}`);
    }
    this.currentLevel = level;
  }

  /**
   * Get current log level
   */
  getLevel(): LogLevel {
    return this.currentLevel;
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log info message
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log error message
   */
  error(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, context);
  }

  /**
   * Log fatal message
   */
  fatal(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.FATAL, message, context);
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    // Filter based on level
    if (LogLevels.compare(level, this.currentLevel) < 0) {
      return;
    }

    // Create log entry
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: this.normalizeContext(context),
    };

    // Write log
    this.writeLog(entry);
  }

  /**
   * Write log entry to transports
   */
  private writeLog(entry: LogEntry): void {
    this.transports.forEach((transport) => {
      try {
        transport(entry);
      } catch (error) {
        // Fail silently to prevent infinite loops
        console.error('Transport error:', error);
      }
    });
  }

  /**
   * Normalize context for serialization
   */
  private normalizeContext(context?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!context) {
      return undefined;
    }

    const normalized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(context)) {
      if (value instanceof Error) {
        normalized[key] = {
          message: value.message,
          stack: value.stack,
          name: value.name,
        };
      } else {
        normalized[key] = value;
      }
    }

    return normalized;
  }

  /**
   * Add transport (for testing purposes)
   */
  addTransport(transport: (entry: LogEntry) => void): void {
    this.transports.push(transport);
  }

  /**
   * Clear all transports (for testing purposes)
   */
  clearTransports(): void {
    this.transports = [];
  }
}
