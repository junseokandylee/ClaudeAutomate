/**
 * TAG-001: Log Levels Implementation
 * REQ-001: Log Levels (DEBUG, INFO, WARN, ERROR, FATAL)
 *
 * GREEN Phase: Minimal implementation to pass tests
 */

/**
 * Log level enum representing all required log levels
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

/**
 * LogLevels utility class for log level operations
 */
export class LogLevels {
  private static readonly PRIORITIES: Record<LogLevel, number> = {
    [LogLevel.DEBUG]: 10,
    [LogLevel.INFO]: 20,
    [LogLevel.WARN]: 30,
    [LogLevel.ERROR]: 40,
    [LogLevel.FATAL]: 50,
  };

  private static readonly COLORS: Record<LogLevel, string> = {
    [LogLevel.DEBUG]: '\x1b[36m', // Cyan
    [LogLevel.INFO]: '\x1b[32m',  // Green
    [LogLevel.WARN]: '\x1b[33m',  // Yellow
    [LogLevel.ERROR]: '\x1b[31m', // Red
    [LogLevel.FATAL]: '\x1b[35m', // Magenta
  };

  private static readonly RESET_COLOR = '\x1b[0m';

  /**
   * Check if a string is a valid log level
   */
  static isValid(level: string): boolean {
    return Object.values(LogLevel).includes(level as LogLevel);
  }

  /**
   * Get priorities mapping for log levels
   */
  static getPriorities(): Record<LogLevel, number> {
    return { ...this.PRIORITIES };
  }

  /**
   * Compare two log levels
   * Returns negative if level1 < level2, positive if level1 > level2, 0 if equal
   */
  static compare(level1: LogLevel, level2: LogLevel): number {
    return this.PRIORITIES[level1] - this.PRIORITIES[level2];
  }

  /**
   * Convert string to LogLevel
   * Throws error if invalid
   */
  static fromString(level: string): LogLevel {
    if (!this.isValid(level)) {
      throw new Error(`Invalid log level: ${level}`);
    }
    return level as LogLevel;
  }

  /**
   * Get all log levels in priority order
   */
  static getAllLevels(): LogLevel[] {
    return [
      LogLevel.DEBUG,
      LogLevel.INFO,
      LogLevel.WARN,
      LogLevel.ERROR,
      LogLevel.FATAL,
    ];
  }

  /**
   * Get human-readable label for log level
   */
  static getLabel(level: LogLevel): string {
    return level.toUpperCase();
  }

  /**
   * Get color code for log level
   */
  static getColor(level: LogLevel): string {
    return this.COLORS[level];
  }

  /**
   * Reset color to default
   */
  static resetColor(): string {
    return this.RESET_COLOR;
  }
}
