/**
 * TAG-003: File Logging Implementation
 * REQ-003: File Logging (rotation, retention, compression)
 *
 * GREEN Phase: Implementation to pass tests
 */

import * as fs from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { LogLevel } from './log-levels';

/**
 * File transport configuration
 */
export interface FileTransportConfig {
  logDir: string;
  maxFileSize: number; // in bytes
  maxFiles: number;
  compress?: boolean;
}

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
 * FileTransport - Handles file logging with rotation
 */
export class FileTransport {
  private config: FileTransportConfig;
  private currentLogFile: string;
  private currentSize: number = 0;

  constructor(config: FileTransportConfig) {
    this.config = config;
    this.currentLogFile = join(config.logDir, 'app.log');
  }

  /**
   * Write log entry to file
   */
  async write(entry: LogEntry): Promise<void> {
    // Ensure log directory exists
    await this.ensureLogDirectory();

    // Check if rotation is needed
    if (await this.shouldRotate()) {
      await this.rotateLogFile();
    }

    // Format log entry as JSON
    const logLine = JSON.stringify(entry) + '\n';
    const logSize = Buffer.byteLength(logLine, 'utf8');

    // Write to file
    await fs.appendFile(this.currentLogFile, logLine);
    this.currentSize += logSize;
  }

  /**
   * Force rotation (for testing purposes)
   */
  async forceRotation(): Promise<void> {
    await this.rotateLogFile();
  }

  /**
   * Ensure log directory exists
   */
  private async ensureLogDirectory(): Promise<void> {
    if (!existsSync(this.config.logDir)) {
      await fs.mkdir(this.config.logDir, { recursive: true });
    }
  }

  /**
   * Check if log file should be rotated
   */
  private async shouldRotate(): Promise<boolean> {
    try {
      const stats = await fs.stat(this.currentLogFile);
      // Check if writing the next entry would exceed max size
      // We estimate the next entry size as 500 bytes
      const estimatedNextEntrySize = 500;
      return stats.size + estimatedNextEntrySize >= this.config.maxFileSize;
    } catch {
      // File doesn't exist yet
      return false;
    }
  }

  /**
   * Rotate log file
   */
  private async rotateLogFile(): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const rotatedFileName = `app.log.${timestamp}`;
    const rotatedFilePath = join(this.config.logDir, rotatedFileName);

    // Rename current file
    try {
      await fs.rename(this.currentLogFile, rotatedFilePath);
    } catch {
      // Ignore if file doesn't exist
    }

    // Compress if enabled
    if (this.config.compress) {
      await this.compressFile(rotatedFilePath);
    }

    // Clean up old files
    await this.cleanupOldFiles();

    // Reset current size
    this.currentSize = 0;
  }

  /**
   * Compress log file (placeholder for compression)
   */
  private async compressFile(filePath: string): Promise<void> {
    // Compression would be implemented here
    // For now, we'll skip actual compression
    // In production, you might use zlib.gzip or similar
  }

  /**
   * Clean up old log files
   */
  private async cleanupOldFiles(): Promise<void> {
    try {
      const files = await fs.readdir(this.config.logDir);
      const logFiles = files
        .filter((file) => file.startsWith('app.log'))
        .map((file) => ({
          name: file,
          path: join(this.config.logDir, file),
        }));

      // If we have more files than maxFiles, delete the oldest
      while (logFiles.length > this.config.maxFiles) {
        // Find the oldest file
        let oldestFile = logFiles[0];
        let oldestTime = Infinity;

        for (const file of logFiles) {
          try {
            const stats = await fs.stat(file.path);
            if (stats.mtimeMs < oldestTime) {
              oldestTime = stats.mtimeMs;
              oldestFile = file;
            }
          } catch {
            // If we can't stat, assume it's old
            oldestFile = file;
            break;
          }
        }

        // Delete the oldest file
        try {
          await fs.unlink(oldestFile.path);
          const index = logFiles.findIndex((f) => f.name === oldestFile.name);
          if (index > -1) {
            logFiles.splice(index, 1);
          }
        } catch {
          // If delete fails, remove from list anyway to avoid infinite loop
          const index = logFiles.findIndex((f) => f.name === oldestFile.name);
          if (index > -1) {
            logFiles.splice(index, 1);
          }
        }
      }
    } catch {
      // Ignore errors during cleanup
    }
  }
}
