/**
 * Dependency Scanner Service Tests
 *
 * REQ-005: Dependency Scanning
 * TAG-TEST-005: DependencyScanner Test Suite
 *
 * Test coverage:
 * - Run npm audit for vulnerability scanning
 * - Parse npm audit output for vulnerabilities
 * - Alert on critical security issues
 * - Generate security reports (JSON format)
 * - Support severity filtering (low, moderate, high, critical)
 * - Cache results with TTL (1 hour)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies before importing the service
vi.mock('electron-log', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock node:child_process and node:util together
const mockExec = vi.fn((
  _command: string,
  callback: (error: Error | null, stdout: string, stderr: string) => void
) => {
  // Simulate async callback
  setImmediate(() => {
    callback(null, '{}', '');
  });
  return {} as any;
});

vi.mock('node:child_process', () => ({
  default: {
    exec: mockExec,
    execSync: vi.fn(() => Buffer.from('{}')),
    spawn: vi.fn(() => ({
      on: vi.fn(),
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      kill: vi.fn(),
    })),
  },
  exec: mockExec,
  execSync: vi.fn(() => Buffer.from('{}')),
  spawn: vi.fn(() => ({
    on: vi.fn(),
    stdout: { on: vi.fn() },
    stderr: { on: vi.fn() },
    kill: vi.fn(),
  })),
}));

vi.mock('node:util', () => ({
  default: {
    promisify: vi.fn((fn: any) => {
      return (...args: any[]) => {
        return new Promise((resolve, reject) => {
          fn(...args, (error: Error | null, stdout: string, stderr: string) => {
            if (error) {
              reject(error);
            } else {
              resolve({ stdout, stderr });
            }
          });
        });
      };
    }),
  },
  promisify: vi.fn((fn: any) => {
    return (...args: any[]) => {
      return new Promise((resolve, reject) => {
        fn(...args, (error: Error | null, stdout: string, stderr: string) => {
          if (error) {
            reject(error);
          } else {
            resolve({ stdout, stderr });
          }
        });
      });
    };
  }),
}));

// Mock npm audit outputs
const mockNpmAuditOutput = {
  vulnerabilities: {
    'lodash': {
      name: 'lodash',
      severity: 'high',
      via: ['lodash'],
      effects: ['app'],
      range: '<4.17.21',
      nodes: ['node_modules/lodash'],
      fixAvailable: true,
    },
    'axios': {
      name: 'axios',
      severity: 'moderate',
      via: ['axios'],
      effects: [],
      range: '<1.0.0',
      nodes: ['node_modules/axios'],
      fixAvailable: true,
    },
  },
  metadata: {
    vulnerabilities: {
      info: 0,
      low: 5,
      moderate: 3,
      high: 2,
      critical: 1,
    },
    dependencies: 150,
    devDependencies: 30,
    optionalDependencies: 0,
    totalDependencies: 180,
  },
};

const mockNpmAuditCritical = {
  vulnerabilities: {
    'critical-package': {
      name: 'critical-package',
      severity: 'critical',
      via: ['critical-package'],
      effects: ['app'],
      range: '<1.0.0',
      nodes: ['node_modules/critical-package'],
      fixAvailable: false,
    },
  },
  metadata: {
    vulnerabilities: {
      info: 0,
      low: 0,
      moderate: 0,
      high: 0,
      critical: 1,
    },
    dependencies: 100,
    devDependencies: 20,
    optionalDependencies: 0,
    totalDependencies: 120,
  },
};

describe('DependencyScanner', () => {
  let scanner: any;
  const mockProjectRoot = '/test/project';

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Reset mockExec to return default successful result
    mockExec.mockImplementation((
      _command: string,
      callback: (error: Error | null, stdout: string, stderr: string) => void
    ) => {
      setImmediate(() => {
        callback(null, JSON.stringify(mockNpmAuditOutput), '');
      });
      return {} as any;
    });

    // Dynamic import to get the service after mocking
    const { DependencyScanner } = await import('../dependency-scanner.service');
    scanner = new (DependencyScanner as any)(mockProjectRoot);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('REQ-005.1: Run npm audit for vulnerability scanning', () => {
    it('should execute npm audit command', async () => {
      await scanner.scan();

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('npm audit'),
        expect.any(Function)
      );
    });

    it('should run audit in project root directory', async () => {
      await scanner.scan();

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining(`cd "${mockProjectRoot}"`),
        expect.any(Function)
      );
    });

    it('should use JSON output format', async () => {
      await scanner.scan();

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('--json'),
        expect.any(Function)
      );
    });

    it('should handle npm audit errors gracefully', async () => {
      mockExec.mockImplementation((
        _command: string,
        callback: (error: Error | null, stdout: string, stderr: string) => void
      ) => {
        callback(new Error('npm audit failed'), '', 'Error message');
        return {} as any;
      });

      const result = await scanner.scan();

      expect(result).toBeDefined();
      expect(result.vulnerabilities).toEqual({});
    });
  });

  describe('REQ-005.2: Parse npm audit output for vulnerabilities', () => {
    it('should parse vulnerability count correctly', async () => {
      const result = await scanner.scan();

      expect(result.metadata.vulnerabilities.low).toBe(5);
      expect(result.metadata.vulnerabilities.moderate).toBe(3);
      expect(result.metadata.vulnerabilities.high).toBe(2);
      expect(result.metadata.vulnerabilities.critical).toBe(1);
    });

    it('should parse individual vulnerability details', async () => {
      const result = await scanner.scan();

      expect(result.vulnerabilities.lodash).toBeDefined();
      expect(result.vulnerabilities.lodash.severity).toBe('high');
      expect(result.vulnerabilities.lodash.range).toBe('<4.17.21');
      expect(result.vulnerabilities.lodash.fixAvailable).toBe(true);
    });

    it('should handle empty audit results', async () => {
      mockExec.mockImplementation((
        _command: string,
        callback: (error: Error | null, stdout: string, stderr: string) => void
      ) => {
        callback(null, JSON.stringify({ vulnerabilities: {}, metadata: { vulnerabilities: {} } }), '');
        return {} as any;
      });

      const result = await scanner.scan();

      expect(Object.keys(result.vulnerabilities)).toHaveLength(0);
    });

    it('should handle malformed JSON output', async () => {
      mockExec.mockImplementation((
        _command: string,
        callback: (error: Error | null, stdout: string, stderr: string) => void
      ) => {
        callback(null, 'invalid json', '');
        return {} as any;
      });

      const result = await scanner.scan();

      expect(result).toBeDefined();
      expect(result.vulnerabilities).toEqual({});
    });
  });

  describe('REQ-005.3: Alert on critical security issues', () => {
    it('should detect critical vulnerabilities', async () => {
      mockExec.mockImplementation((
        _command: string,
        callback: (error: Error | null, stdout: string, stderr: string) => void
      ) => {
        callback(null, JSON.stringify(mockNpmAuditCritical), '');
        return {} as any;
      });

      const result = await scanner.scan();

      expect(result.hasCriticalIssues).toBe(true);
      expect(result.criticalIssues).toHaveLength(1);
      expect(result.criticalIssues[0].name).toBe('critical-package');
    });

    it('should return false when no critical issues exist', async () => {
      const result = await scanner.scan();

      expect(result.hasCriticalIssues).toBe(false);
      expect(result.criticalIssues).toHaveLength(0);
    });

    it('should include fix availability in critical alerts', async () => {
      mockExec.mockImplementation((
        _command: string,
        callback: (error: Error | null, stdout: string, stderr: string) => void
      ) => {
        callback(null, JSON.stringify(mockNpmAuditCritical), '');
        return {} as any;
      });

      const result = await scanner.scan();

      expect(result.criticalIssues[0].fixAvailable).toBe(false);
    });
  });

  describe('REQ-005.4: Generate security reports (JSON format)', () => {
    it('should generate JSON report', async () => {
      const result = await scanner.scan();
      const jsonReport = result.toJSON();

      expect(jsonReport).toMatchObject({
        scanDate: expect.any(String),
        vulnerabilities: expect.any(Object),
        metadata: expect.any(Object),
        hasCriticalIssues: expect.any(Boolean),
      });
    });

    it('should include timestamp in report', async () => {
      const now = new Date('2025-01-04T10:00:00Z');
      vi.setSystemTime(now);

      const result = await scanner.scan();
      const jsonReport = result.toJSON();

      expect(jsonReport.scanDate).toBe('2025-01-04T10:00:00.000Z');
    });

    it('should include vulnerability summary in report', async () => {
      const result = await scanner.scan();
      const jsonReport = result.toJSON();

      expect(jsonReport.summary).toEqual({
        total: 11,
        bySeverity: {
          info: 0,
          low: 5,
          moderate: 3,
          high: 2,
          critical: 1,
        },
      });
    });
  });

  describe('REQ-005.5: Support severity filtering', () => {
    it('should filter by critical severity', async () => {
      const result = await scanner.scan();
      const filtered = result.bySeverity('critical');

      expect(filtered).toHaveLength(1);
    });

    it('should filter by high severity', async () => {
      const result = await scanner.scan();
      const filtered = result.bySeverity('high');

      expect(filtered).toHaveLength(2);
    });

    it('should filter by moderate severity', async () => {
      const result = await scanner.scan();
      const filtered = result.bySeverity('moderate');

      expect(filtered).toHaveLength(3);
    });

    it('should filter by low severity', async () => {
      const result = await scanner.scan();
      const filtered = result.bySeverity('low');

      expect(filtered).toHaveLength(5);
    });

    it('should return empty array for unknown severity', async () => {
      const result = await scanner.scan();
      const filtered = result.bySeverity('unknown' as any);

      expect(filtered).toHaveLength(0);
    });

    it('should support filtering by multiple severities', async () => {
      const result = await scanner.scan();
      const filtered = result.bySeverities(['high', 'critical']);

      expect(filtered).toHaveLength(3);
    });
  });

  describe('REQ-005.6: Cache results with TTL (1 hour)', () => {
    it('should cache scan results', async () => {
      const firstScan = await scanner.scan();
      const secondScan = await scanner.scan();

      expect(mockExec).toHaveBeenCalledTimes(1);
      expect(firstScan).toEqual(secondScan);
    });

    it('should respect cache TTL', async () => {
      await scanner.scan();

      // Advance time by 1 hour + 1 second
      vi.advanceTimersByTime(60 * 60 * 1000 + 1000);

      await scanner.scan();

      expect(mockExec).toHaveBeenCalledTimes(2);
    });

    it('should not use expired cache', async () => {
      const firstScan = await scanner.scan();

      // Advance time by 30 minutes (cache still valid)
      vi.advanceTimersByTime(30 * 60 * 1000);

      const secondScan = await scanner.scan();

      expect(mockExec).toHaveBeenCalledTimes(1);
      expect(firstScan).toEqual(secondScan);
    });

    it('should invalidate cache on clear', async () => {
      await scanner.scan();
      scanner.clearCache();

      await scanner.scan();

      expect(mockExec).toHaveBeenCalledTimes(2);
    });

    it('should cache critical issues separately', async () => {
      mockExec.mockImplementation((
        _command: string,
        callback: (error: Error | null, stdout: string, stderr: string) => void
      ) => {
        callback(null, JSON.stringify(mockNpmAuditCritical), '');
        return {} as any;
      });

      await scanner.scan();

      // Should use cache on second call
      await scanner.scan();

      expect(mockExec).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing project root', async () => {
      const { DependencyScanner } = await import('../dependency-scanner.service');
      const scannerWithoutRoot = new (DependencyScanner as any)('/nonexistent');

      mockExec.mockImplementation((
        _command: string,
        callback: (error: Error | null, stdout: string, stderr: string) => void
      ) => {
        callback(new Error('Project not found'), '', '');
        return {} as any;
      });

      const result = await scannerWithoutRoot.scan();

      expect(result).toBeDefined();
      expect(result.vulnerabilities).toEqual({});
    });

    it('should handle concurrent scans', async () => {
      const promises = [
        scanner.scan(),
        scanner.scan(),
        scanner.scan(),
      ];

      const results = await Promise.all(promises);

      expect(mockExec).toHaveBeenCalledTimes(1);
      results.forEach((result) => {
        expect(result).toBeDefined();
      });
    });

    it('should handle large vulnerability lists', async () => {
      const largeVulnerabilities: Record<string, any> = {};
      for (let i = 0; i < 100; i++) {
        largeVulnerabilities[`package-${i}`] = {
          name: `package-${i}`,
          severity: i % 4 === 0 ? 'high' : 'moderate',
          via: [`package-${i}`],
          effects: [],
          range: `<${i}.0.0`,
          nodes: [`node_modules/package-${i}`],
          fixAvailable: true,
        };
      }

      const largeAudit = {
        vulnerabilities: largeVulnerabilities,
        metadata: {
          vulnerabilities: {
            info: 0,
            low: 0,
            moderate: 75,
            high: 25,
            critical: 0,
          },
          dependencies: 500,
          devDependencies: 100,
          optionalDependencies: 0,
          totalDependencies: 600,
        },
      };

      mockExec.mockImplementation((
        _command: string,
        callback: (error: Error | null, stdout: string, stderr: string) => void
      ) => {
        callback(null, JSON.stringify(largeAudit), '');
        return {} as any;
      });

      const result = await scanner.scan();

      expect(Object.keys(result.vulnerabilities)).toHaveLength(100);
      expect(result.summary.total).toBe(100);
    });
  });
});
