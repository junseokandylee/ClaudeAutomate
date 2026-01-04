/**
 * TAG-006: Debug Mode Implementation
 * REQ-006: Debug Mode (DEBUG level, verbose output, performance metrics, IPC tracing)
 *
 * GREEN Phase: Implementation
 */

import { LogLevel } from './log-levels';
import { LoggerService } from './logger.service';

/**
 * Debug mode configuration
 */
export interface DebugModeConfig {
  ipcTracing?: boolean;
  performanceMetrics?: boolean;
  verboseOutput?: boolean;
}

/**
 * DebugMode - Manages debug mode state and features
 */
export class DebugMode {
  private static instance: DebugMode | null = null;
  private enabled: boolean = false;
  private config: DebugModeConfig = {};
  private logger: LoggerService;
  private performanceMetrics: Map<string, number[]> = new Map();

  private constructor(logger: LoggerService) {
    this.logger = logger;
  }

  /**
   * Get singleton instance
   */
  static getInstance(logger?: LoggerService): DebugMode {
    if (!DebugMode.instance) {
      if (!logger) {
        throw new Error('Logger required for first initialization');
      }
      DebugMode.instance = new DebugMode(logger);
    }
    return DebugMode.instance;
  }

  /**
   * Enable debug mode
   */
  enable(config: DebugModeConfig = {}): void {
    this.enabled = true;
    this.config = {
      ipcTracing: config.ipcTracing || false,
      performanceMetrics: config.performanceMetrics || false,
      verboseOutput: config.verboseOutput || false,
    };

    // Set log level to DEBUG
    this.logger.setLevel(LogLevel.DEBUG);

    this.logger.info('Debug mode enabled', { config: this.config });
  }

  /**
   * Disable debug mode
   */
  disable(): void {
    this.enabled = false;
    this.config = {};

    // Reset log level to INFO
    this.logger.setLevel(LogLevel.INFO);

    this.logger.info('Debug mode disabled');
  }

  /**
   * Check if debug mode is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Check if IPC tracing is enabled
   */
  isIpcTracingEnabled(): boolean {
    return this.enabled && this.config.ipcTracing === true;
  }

  /**
   * Check if performance metrics are enabled
   */
  isPerformanceMetricsEnabled(): boolean {
    return this.enabled && this.config.performanceMetrics === true;
  }

  /**
   * Check if verbose output is enabled
   */
  isVerboseOutputEnabled(): boolean {
    return this.enabled && this.config.verboseOutput === true;
  }

  /**
   * Record performance metric
   */
  recordMetric(name: string, duration: number): void {
    if (!this.isPerformanceMetricsEnabled()) {
      return;
    }

    if (!this.performanceMetrics.has(name)) {
      this.performanceMetrics.set(name, []);
    }

    const metrics = this.performanceMetrics.get(name)!;
    metrics.push(duration);

    // Keep only last 100 metrics
    if (metrics.length > 100) {
      metrics.shift();
    }
  }

  /**
   * Get performance metrics for a given name
   */
  getMetrics(name: string): { avg: number; min: number; max: number; count: number } | null {
    const metrics = this.performanceMetrics.get(name);
    if (!metrics || metrics.length === 0) {
      return null;
    }

    const sum = metrics.reduce((a, b) => a + b, 0);
    return {
      avg: sum / metrics.length,
      min: Math.min(...metrics),
      max: Math.max(...metrics),
      count: metrics.length,
    };
  }

  /**
   * Log IPC message
   */
  logIpc(channel: string, ...args: unknown[]): void {
    if (!this.isIpcTracingEnabled()) {
      return;
    }

    this.logger.debug(`IPC: ${channel}`, { args });
  }

  /**
   * Get all performance metrics
   */
  getAllMetrics(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const result: Record<string, { avg: number; min: number; max: number; count: number }> = {};

    for (const [name] of this.performanceMetrics) {
      const metrics = this.getMetrics(name);
      if (metrics) {
        result[name] = metrics;
      }
    }

    return result;
  }

  /**
   * Clear all performance metrics
   */
  clearMetrics(): void {
    this.performanceMetrics.clear();
  }
}
