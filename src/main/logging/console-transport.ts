/**
 * TAG-004: Console Logging Implementation
 * REQ-004: Console Logging (colors, filtering, source location)
 *
 * GREEN Phase: Implementation
 */

import { LogLevel, LogLevels } from './log-levels';

/**
 * Log entry interface
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

/**
 * Console transport configuration
 */
export interface ConsoleTransportConfig {
  colors?: boolean;
  showSource?: boolean;
}

/**
 * ConsoleTransport - Handles console logging with colors
 */
export class ConsoleTransport {
  private config: ConsoleTransportConfig;

  constructor(config: ConsoleTransportConfig = {}) {
    this.config = {
      colors: config.colors !== false, // Default to true
      showSource: config.showSource || false,
    };
  }

  /**
   * Write log entry to console
   */
  write(entry: LogEntry): void {
    const formattedMessage = this.formatMessage(entry);
    const color = this.config.colors ? LogLevels.getColor(entry.level) : '';
    const reset = this.config.colors ? LogLevels.resetColor() : '';

    // Output to appropriate console method
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(`${color}${formattedMessage}${reset}`);
        break;
      case LogLevel.INFO:
        console.info(`${color}${formattedMessage}${reset}`);
        break;
      case LogLevel.WARN:
        console.warn(`${color}${formattedMessage}${reset}`);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(`${color}${formattedMessage}${reset}`);
        break;
    }
  }

  /**
   * Format log message
   */
  private formatMessage(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const level = LogLevels.getLabel(entry.level);
    const context = entry.context ? ` ${JSON.stringify(entry.context)}` : '';

    return `[${timestamp}] [${level}] ${entry.message}${context}`;
  }
}
