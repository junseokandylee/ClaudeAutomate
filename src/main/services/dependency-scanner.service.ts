/**
 * Dependency Scanner Service
 *
 * REQ-005: Dependency Scanning
 * TAG-DESIGN-005: DependencyScanner Design
 * TAG-FUNC-005: DependencyScanner Implementation
 *
 * Scans project dependencies for security vulnerabilities using npm audit.
 * Features:
 * - Run npm audit for vulnerability scanning
 * - Parse npm audit output for vulnerabilities
 * - Alert on critical security issues
 * - Generate security reports (JSON format)
 * - Support severity filtering (low, moderate, high, critical)
 * - Cache results with TTL (1 hour)
 *
 * @example
 * ```typescript
 * const scanner = new DependencyScanner('/project/root');
 * const result = await scanner.scan();
 *
 * if (result.hasCriticalIssues) {
 *   console.error('Critical vulnerabilities found:', result.criticalIssues);
 * }
 *
 * const highSev = result.bySeverity('high');
 * const report = result.toJSON();
 * ```
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import logger from 'electron-log';

const execAsync = promisify(exec);

/**
 * Vulnerability severity levels
 */
export type VulnerabilitySeverity = 'info' | 'low' | 'moderate' | 'high' | 'critical';

/**
 * NPM audit vulnerability structure
 */
export interface NpmAuditVulnerability {
  name: string;
  severity: VulnerabilitySeverity;
  via: string[];
  effects: string[];
  range: string;
  nodes: string[];
  fixAvailable: boolean;
}

/**
 * NPM audit metadata structure
 */
export interface NpmAuditMetadata {
  vulnerabilities: {
    info: number;
    low: number;
    moderate: number;
    high: number;
    critical: number;
  };
  dependencies: number;
  devDependencies: number;
  optionalDependencies: number;
  totalDependencies: number;
}

/**
 * NPM audit output structure
 */
export interface NpmAuditOutput {
  vulnerabilities: Record<string, NpmAuditVulnerability>;
  metadata: NpmAuditMetadata;
}

/**
 * Security scan result
 */
export class SecurityScanResult {
  /** Scan timestamp */
  scanDate: Date;

  /** Raw vulnerabilities from npm audit */
  vulnerabilities: Record<string, NpmAuditVulnerability>;

  /** Metadata from npm audit */
  metadata: NpmAuditMetadata;

  /** Whether critical issues were found */
  hasCriticalIssues: boolean;

  /** List of critical vulnerabilities */
  criticalIssues: NpmAuditVulnerability[];

  /** Vulnerability summary */
  summary: {
    total: number;
    bySeverity: Record<VulnerabilitySeverity, number>;
  };

  /**
   * Create scan result from npm audit output
   */
  constructor(auditOutput: NpmAuditOutput) {
    this.scanDate = new Date();
    this.vulnerabilities = auditOutput.vulnerabilities;
    this.metadata = auditOutput.metadata;

    // Find critical issues
    this.criticalIssues = Object.values(this.vulnerabilities).filter(
      (vuln) => vuln.severity === 'critical'
    );
    this.hasCriticalIssues = this.criticalIssues.length > 0;

    // Calculate summary
    const counts = this.metadata.vulnerabilities;
    this.summary = {
      total: Object.keys(this.vulnerabilities).length,
      bySeverity: {
        info: counts.info || 0,
        low: counts.low || 0,
        moderate: counts.moderate || 0,
        high: counts.high || 0,
        critical: counts.critical || 0,
      },
    };
  }

  /**
   * Filter vulnerabilities by severity
   */
  bySeverity(severity: VulnerabilitySeverity): NpmAuditVulnerability[] {
    return Object.values(this.vulnerabilities).filter(
      (vuln) => vuln.severity === severity
    );
  }

  /**
   * Filter vulnerabilities by multiple severities
   */
  bySeverities(severities: VulnerabilitySeverity[]): NpmAuditVulnerability[] {
    return Object.values(this.vulnerabilities).filter(
      (vuln) => severities.includes(vuln.severity)
    );
  }

  /**
   * Convert to JSON format for reporting
   */
  toJSON(): Record<string, unknown> {
    return {
      scanDate: this.scanDate.toISOString(),
      vulnerabilities: this.vulnerabilities,
      metadata: this.metadata,
      hasCriticalIssues: this.hasCriticalIssues,
      criticalIssues: this.criticalIssues,
      summary: this.summary,
    };
  }
}

/**
 * Cache entry with expiration
 */
interface CacheEntry {
  result: SecurityScanResult;
  expiresAt: number;
}

/**
 * Dependency Scanner Service
 */
export class DependencyScanner {
  private projectRoot: string;
  private cache: Map<string, CacheEntry> | null = null;
  private readonly CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

  /**
   * Create dependency scanner
   */
  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.cache = new Map();
  }

  /**
   * Run npm audit and parse results
   */
  async scan(): Promise<SecurityScanResult> {
    const cacheKey = this.projectRoot;

    // Check cache
    const cached = this.cache?.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      logger.info('Using cached dependency scan result');
      return cached.result;
    }

    try {
      logger.info(`Running npm audit for ${this.projectRoot}`);

      // Run npm audit with JSON output
      const { stdout } = await execAsync(
        `cd "${this.projectRoot}" && npm audit --json`
      );

      // Parse npm audit output
      const auditOutput: NpmAuditOutput = JSON.parse(stdout);

      // Create scan result
      const result = new SecurityScanResult(auditOutput);

      // Cache the result
      this.cache?.set(cacheKey, {
        result,
        expiresAt: Date.now() + this.CACHE_TTL_MS,
      });

      logger.info(
        `Dependency scan complete: ${result.summary.total} vulnerabilities found`
      );

      return result;
    } catch (error) {
      // Handle npm audit errors (e.g., no vulnerabilities, project not found)
      if (error instanceof Error) {
        logger.error(`Dependency scan failed: ${error.message}`);

        // Return empty result on error
        const emptyResult = new SecurityScanResult({
          vulnerabilities: {},
          metadata: {
            vulnerabilities: {
              info: 0,
              low: 0,
              moderate: 0,
              high: 0,
              critical: 0,
            },
            dependencies: 0,
            devDependencies: 0,
            optionalDependencies: 0,
            totalDependencies: 0,
          },
        });

        return emptyResult;
      }

      throw error;
    }
  }

  /**
   * Clear scan cache
   */
  clearCache(): void {
    this.cache?.clear();
    logger.info('Dependency scan cache cleared');
  }

  /**
   * Check if cache entry is valid
   */
  private isCacheValid(entry: CacheEntry): boolean {
    return entry.expiresAt > Date.now();
  }
}
