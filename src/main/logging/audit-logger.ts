/**
 * TAG-FUNC-002: Audit Logger
 *
 * Implements REQ-007 (Audit Logging) for security event tracking:
 * - Authentication attempts
 * - Configuration changes
 * - Sensitive operations
 * - Log rotation and archival
 *
 * Technical Constraints:
 * - JSON log format
 * - Automatic log rotation
 * - Size-based rotation
 * - Archive management
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as fsSync from 'fs';
import { LoggerService } from './logger.service';

/**
 * Audit log entry types
 */
export type AuditEventType =
  | 'AUTHENTICATION_ATTEMPT'
  | 'CONFIGURATION_CHANGE'
  | 'SENSITIVE_OPERATION'
  | 'PERMISSION_CHANGE'
  | 'DATA_ACCESS';

/**
 * Base audit log entry
 */
export interface BaseAuditEntry {
  eventType: AuditEventType;
  timestamp: string;
  userId?: string;
  success?: boolean;
  failureReason?: string;
}

/**
 * Authentication attempt entry
 */
export interface AuthenticationAttemptEntry extends BaseAuditEntry {
  eventType: 'AUTHENTICATION_ATTEMPT';
  userId: string;
  success: boolean;
  method: string;
  failureReason?: string;
}

/**
 * Configuration change entry
 */
export interface ConfigurationChangeEntry extends BaseAuditEntry {
  eventType: 'CONFIGURATION_CHANGE';
  userId: string;
  key: string;
  oldValue: string;
  newValue: string;
}

/**
 * Sensitive operation entry
 */
export interface SensitiveOperationEntry extends BaseAuditEntry {
  eventType: 'SENSITIVE_OPERATION';
  userId: string;
  operation: string;
  resource: string;
  success: boolean;
  failureReason?: string;
  metadata?: Record<string, any>;
}

/**
 * Audit log entry union
 */
export type AuditEntry =
  | AuthenticationAttemptEntry
  | ConfigurationChangeEntry
  | SensitiveOperationEntry;

/**
 * Query filters
 */
export interface AuditQueryFilters {
  eventType?: AuditEventType;
  userId?: string;
  startDate?: string;
  endDate?: string;
  operation?: string;
}

/**
 * Audit logger configuration
 */
export interface AuditLoggerConfig {
  logDir?: string;
  maxLogSize?: number; // bytes
  maxArchiveFiles?: number;
  bufferSize?: number;
}

/**
 * Audit Logger
 *
 * Provides secure audit logging for security-sensitive events.
 * Implements automatic log rotation and archive management.
 */
export class AuditLogger {
  private readonly logDir: string;
  private readonly logFile: string;
  private readonly maxLogSize: number;
  private readonly maxArchiveFiles: number;
  private readonly bufferSize: number;

  private writeStream: NodeJS.WritableStream | null = null;
  private buffer: AuditEntry[] = [];
  private bufferTimer: NodeJS.Timeout | null = null;
  private logger: LoggerService;
  private sensitiveKeys: Set<string>;

  constructor(config: AuditLoggerConfig = {}) {
    this.logDir = config.logDir || path.join(process.cwd(), 'logs', 'audit');
    this.logFile = path.join(this.logDir, 'audit.log');
    this.maxLogSize = config.maxLogSize || 10 * 1024 * 1024; // 10MB default
    this.maxArchiveFiles = config.maxArchiveFiles || 5;
    this.bufferSize = config.bufferSize || 100;
    this.logger = new LoggerService();

    // Keys that should be redacted in logs
    this.sensitiveKeys = new Set([
      'apiKey',
      'api-key',
      'token',
      'password',
      'secret',
      'credential',
    ]);

    this.initialize();
  }

  /**
   * Initialize audit logger
   */
  private async initialize(): Promise<void> {
    try {
      // Ensure log directory exists
      await fs.mkdir(this.logDir, { recursive: true });

      // Create write stream
      this.initializeWriteStream();

      // Setup buffer flush interval
      this.bufferTimer = setInterval(() => {
        this.flushBuffer();
      }, 5000); // Flush every 5 seconds
    } catch (error) {
      this.logger.error('Failed to initialize audit logger', error);
      throw error;
    }
  }

  /**
   * Create write stream for log file
   */
  private initializeWriteStream(): void {
    this.writeStream = fsSync.createWriteStream(this.logFile, { flags: 'a' });
  }

  /**
   * Log authentication attempt
   */
  async logAuthenticationAttempt(entry: AuthenticationAttemptEntry): Promise<void> {
    if (!entry.userId || entry.userId.trim().length === 0) {
      throw new Error('userId is required');
    }

    await this.writeLog(entry);
  }

  /**
   * Log configuration change
   */
  async logConfigurationChange(entry: ConfigurationChangeEntry): Promise<void> {
    if (!entry.userId || entry.userId.trim().length === 0) {
      throw new Error('userId is required');
    }

    // Redact sensitive values
    const processedEntry: ConfigurationChangeEntry = {
      ...entry,
      oldValue: this.redactSensitiveValue(entry.key, entry.oldValue),
      newValue: this.redactSensitiveValue(entry.key, entry.newValue),
    };

    await this.writeLog(processedEntry);
  }

  /**
   * Log sensitive operation
   */
  async logSensitiveOperation(entry: SensitiveOperationEntry): Promise<void> {
    if (!entry.userId || entry.userId.trim().length === 0) {
      throw new Error('userId is required');
    }

    await this.writeLog(entry);
  }

  /**
   * Redact sensitive values
   */
  private redactSensitiveValue(key: string, value: string): string {
    const lowerKey = key.toLowerCase();

    for (const sensitiveKey of this.sensitiveKeys) {
      if (lowerKey.includes(sensitiveKey)) {
        return '[REDACTED]';
      }
    }

    return value;
  }

  /**
   * Write log entry
   */
  private async writeLog(entry: AuditEntry): Promise<void> {
    // Add to buffer
    this.buffer.push(entry);

    // Flush if buffer is full
    if (this.buffer.length >= this.bufferSize) {
      await this.flushBuffer();
    }
  }

  /**
   * Flush buffer to disk
   */
  private async flushBuffer(): Promise<void> {
    if (this.buffer.length === 0) {
      return;
    }

    const entriesToWrite = [...this.buffer];
    this.buffer = [];

    try {
      // Check if rotation is needed
      await this.checkRotation();

      // Write entries
      for (const entry of entriesToWrite) {
        const logLine = JSON.stringify(entry) + '\n';
        if (this.writeStream) {
          this.writeStream.write(logLine);
        }
      }
    } catch (error) {
      this.logger.error('Failed to flush audit log buffer', error);
      // Re-add entries to buffer on failure
      this.buffer.unshift(...entriesToWrite);
    }
  }

  /**
   * Check if log rotation is needed
   */
  private async checkRotation(): Promise<void> {
    try {
      const stats = await fs.stat(this.logFile);

      if (stats.size >= this.maxLogSize) {
        await this.rotateLog();
      }
    } catch (error) {
      // File doesn't exist yet, no rotation needed
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * Rotate log file
   */
  private async rotateLog(): Promise<void> {
    try {
      // Close current stream
      if (this.writeStream) {
        this.writeStream.end();
        this.writeStream = null;
      }

      // Rotate existing archives
      for (let i = this.maxArchiveFiles - 1; i >= 1; i--) {
        const currentArchive = path.join(this.logDir, `audit.log.${i}`);
        const nextArchive = path.join(this.logDir, `audit.log.${i + 1}`);

        if (fsSync.existsSync(currentArchive)) {
          if (i === this.maxArchiveFiles - 1) {
            // Delete oldest archive
            await fs.unlink(nextArchive).catch(() => {});
          }
          await fs.rename(currentArchive, nextArchive).catch(() => {});
        }
      }

      // Move current log to archive 1
      if (fsSync.existsSync(this.logFile)) {
        await fs.rename(
          this.logFile,
          path.join(this.logDir, 'audit.log.1')
        ).catch(() => {});
      }

      // Create new write stream
      this.initializeWriteStream();
    } catch (error) {
      this.logger.error('Failed to rotate audit log', error);
      throw error;
    }
  }

  /**
   * Query logs
   */
  async queryLogs(filters: AuditQueryFilters = {}): Promise<AuditEntry[]> {
    const logs: AuditEntry[] = [];

    try {
      // Read current log file
      if (fsSync.existsSync(this.logFile)) {
        const content = await fs.readFile(this.logFile, 'utf-8');
        const lines = content.trim().split('\n').filter(Boolean);

        for (const line of lines) {
          try {
            const entry = JSON.parse(line) as AuditEntry;
            if (this.matchesFilters(entry, filters)) {
              logs.push(entry);
            }
          } catch (error) {
            // Skip malformed entries
          }
        }
      }

      // Read archives if needed
      for (let i = 1; i <= this.maxArchiveFiles; i++) {
        const archiveFile = path.join(this.logDir, `audit.log.${i}`);
        if (fsSync.existsSync(archiveFile)) {
          const content = await fs.readFile(archiveFile, 'utf-8');
          const lines = content.trim().split('\n').filter(Boolean);

          for (const line of lines) {
            try {
              const entry = JSON.parse(line) as AuditEntry;
              if (this.matchesFilters(entry, filters)) {
                logs.push(entry);
              }
            } catch (error) {
              // Skip malformed entries
            }
          }
        }
      }
    } catch (error) {
      this.logger.error('Failed to query audit logs', error);
    }

    return logs;
  }

  /**
   * Check if entry matches filters
   */
  private matchesFilters(entry: AuditEntry, filters: AuditQueryFilters): boolean {
    if (filters.eventType && entry.eventType !== filters.eventType) {
      return false;
    }

    if (filters.userId && entry.userId !== filters.userId) {
      return false;
    }

    if (filters.operation) {
      const opEntry = entry as SensitiveOperationEntry;
      if (opEntry.operation !== filters.operation) {
        return false;
      }
    }

    if (filters.startDate || filters.endDate) {
      const entryTime = new Date(entry.timestamp).getTime();

      if (filters.startDate) {
        const startTime = new Date(filters.startDate).getTime();
        if (entryTime < startTime) {
          return false;
        }
      }

      if (filters.endDate) {
        const endTime = new Date(filters.endDate).getTime();
        if (entryTime > endTime) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Flush any remaining buffered logs
   */
  async flush(): Promise<void> {
    await this.flushBuffer();
  }

  /**
   * Close audit logger
   */
  async close(): Promise<void> {
    // Flush remaining logs
    await this.flush();

    // Clear buffer timer
    if (this.bufferTimer) {
      clearInterval(this.bufferTimer);
      this.bufferTimer = null;
    }

    // Close write stream
    if (this.writeStream) {
      this.writeStream.end();
      this.writeStream = null;
    }
  }
}
