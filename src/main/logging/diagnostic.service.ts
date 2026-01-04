/**
 * TAG-005: Diagnostic Bundle Implementation
 * REQ-005: Diagnostic Bundle (system info, logs, config, stack traces)
 *
 * GREEN Phase: Implementation
 */

import * as fs from 'fs/promises';
import { join } from 'path';
import { arch, platform, release, version } from 'os';

/**
 * Diagnostic service configuration
 */
export interface DiagnosticServiceConfig {
  logDir: string;
  outputDir: string;
}

/**
 * System information interface
 */
interface SystemInfo {
  platform: string;
  arch: string;
  osRelease: string;
  nodeVersion: string;
  appVersion: string;
  timestamp: string;
}

/**
 * DiagnosticService - Generates diagnostic bundles
 */
export class DiagnosticService {
  private config: DiagnosticServiceConfig;

  constructor(config: DiagnosticServiceConfig) {
    this.config = config;
  }

  /**
   * Generate diagnostic bundle
   */
  async generateBundle(): Promise<string> {
    // Ensure output directory exists
    await fs.mkdir(this.config.outputDir, { recursive: true });

    // Create bundle directory
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const bundleDir = join(this.config.outputDir, `diagnostic-${timestamp}`);
    await fs.mkdir(bundleDir, { recursive: true });

    // Collect system information
    const systemInfo = await this.collectSystemInfo();
    await fs.writeFile(
      join(bundleDir, 'system-info.json'),
      JSON.stringify(systemInfo, null, 2)
    );

    // Copy log files
    await this.copyLogFiles(bundleDir);

    // Copy configuration (sanitized)
    await this.copyConfiguration(bundleDir);

    return bundleDir;
  }

  /**
   * Collect system information
   */
  private async collectSystemInfo(): Promise<SystemInfo> {
    return {
      platform: platform(),
      arch: arch(),
      osRelease: release(),
      nodeVersion: version(),
      appVersion: process.env.npm_package_version || 'unknown',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Copy log files to bundle
   */
  private async copyLogFiles(bundleDir: string): Promise<void> {
    try {
      const logDir = this.config.logDir;
      const files = await fs.readdir(logDir);
      const logsDir = join(bundleDir, 'logs');
      await fs.mkdir(logsDir, { recursive: true });

      for (const file of files) {
        const srcPath = join(logDir, file);
        const destPath = join(logsDir, file);
        try {
          await fs.copyFile(srcPath, destPath);
        } catch {
          // Skip files that can't be copied
        }
      }
    } catch {
      // Log directory doesn't exist or can't be read
    }
  }

  /**
   * Copy sanitized configuration to bundle
   */
  private async copyConfiguration(bundleDir: string): Promise<void> {
    const config = {
      // Add sanitized configuration here
      // For now, we'll create an empty config file
      timestamp: new Date().toISOString(),
    };

    await fs.writeFile(
      join(bundleDir, 'config.json'),
      JSON.stringify(config, null, 2)
    );
  }
}
