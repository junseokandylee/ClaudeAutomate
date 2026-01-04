/**
 * Tests for Dependency Analyzer Service
 */

import { describe, it, expect } from 'vitest';
import {
  analyzeSpecs,
  getWaveSpecs,
  getWaveCount,
  canRunInParallel,
  validatePlan,
} from '../dependency-analyzer.service';
import { AnalysisError } from '../../../shared/errors';
import type { SpecInfo } from '../../../shared/types';

describe('dependency-analyzer.service', () => {
  const createMockSpec = (
    id: string,
    dependencies: string[] = []
  ): SpecInfo => ({
    id,
    title: `SPEC ${id}`,
    filePath: `/specs/${id}/spec.md`,
    status: 'pending',
    dependencies,
  });

  describe('analyzeSpecs', () => {
    it('should put all specs in wave 1 when there are no dependencies', async () => {
      const specs = [
        createMockSpec('SPEC-001'),
        createMockSpec('SPEC-002'),
        createMockSpec('SPEC-003'),
      ];

      const plan = await analyzeSpecs(specs);

      expect(plan.waves).toHaveLength(1);
      expect(plan.waves[0].specs).toHaveLength(3);
      expect(plan.totalSpecs).toBe(3);
      expect(plan.estimatedParallelism).toBe(3);
    });

    it('should calculate waves for chain dependencies', async () => {
      const specs = [
        createMockSpec('SPEC-A'),
        createMockSpec('SPEC-B', ['SPEC-A']),
        createMockSpec('SPEC-C', ['SPEC-B']),
      ];

      const plan = await analyzeSpecs(specs);

      expect(plan.waves).toHaveLength(3);
      expect(plan.waves[0].specs).toHaveLength(1);
      expect(plan.waves[0].specs[0].id).toBe('SPEC-A');
      expect(plan.waves[1].specs[0].id).toBe('SPEC-B');
      expect(plan.waves[2].specs[0].id).toBe('SPEC-C');
    });

    it('should handle diamond dependencies correctly', async () => {
      const specs = [
        createMockSpec('SPEC-A'),
        createMockSpec('SPEC-B', ['SPEC-A']),
        createMockSpec('SPEC-C', ['SPEC-A']),
        createMockSpec('SPEC-D', ['SPEC-B', 'SPEC-C']),
      ];

      const plan = await analyzeSpecs(specs);

      expect(plan.waves).toHaveLength(3);
      expect(plan.waves[0].specs.map((s) => s.id)).toEqual(['SPEC-A']);
      expect(plan.waves[1].specs.map((s) => s.id).sort()).toEqual(['SPEC-B', 'SPEC-C']);
      expect(plan.waves[2].specs.map((s) => s.id)).toEqual(['SPEC-D']);
    });

    it('should throw error for circular dependencies', async () => {
      const specs = [
        createMockSpec('SPEC-A', ['SPEC-B']),
        createMockSpec('SPEC-B', ['SPEC-A']),
      ];

      await expect(analyzeSpecs(specs)).rejects.toThrow(AnalysisError);
      await expect(analyzeSpecs(specs)).rejects.toThrow();
    });

    it('should throw error for self-dependency', async () => {
      const specs = [
        createMockSpec('SPEC-A', ['SPEC-A']),
      ];

      await expect(analyzeSpecs(specs)).rejects.toThrow();
    });

    it('should handle complex circular dependency (3 nodes)', async () => {
      const specs = [
        createMockSpec('SPEC-A', ['SPEC-C']),
        createMockSpec('SPEC-B', ['SPEC-A']),
        createMockSpec('SPEC-C', ['SPEC-B']),
      ];

      await expect(analyzeSpecs(specs)).rejects.toThrow(AnalysisError);
    });

    it('should ignore non-existent dependencies', async () => {
      const specs = [
        createMockSpec('SPEC-001'),
        createMockSpec('SPEC-002', ['SPEC-NONEXISTENT', 'SPEC-001']),
      ];

      const plan = await analyzeSpecs(specs);

      // Both should be in wave 1 since the non-existent dependency is ignored
      expect(plan.waves.length).toBeGreaterThanOrEqual(1);
      const allSpecIds = plan.waves.flatMap((w) => w.specs.map((s) => s.id));
      expect(allSpecIds).toContain('SPEC-002');
      expect(allSpecIds).toContain('SPEC-001');
    });

    it('should cap parallelism at maxParallel', async () => {
      const specs = Array.from({ length: 15 }, (_, i) =>
        createMockSpec(`SPEC-${String(i + 1).padStart(3, '0')}`)
      );

      const plan = await analyzeSpecs(specs, 10);

      expect(plan.estimatedParallelism).toBe(10);
    });

    it('should handle empty spec array', async () => {
      const plan = await analyzeSpecs([]);

      expect(plan.waves).toEqual([]);
      expect(plan.totalSpecs).toBe(0);
      expect(plan.estimatedParallelism).toBe(1);
    });

    it('should handle single spec with no dependencies', async () => {
      const specs = [createMockSpec('SPEC-001')];

      const plan = await analyzeSpecs(specs);

      expect(plan.waves).toHaveLength(1);
      expect(plan.waves[0].specs[0].id).toBe('SPEC-001');
      expect(plan.estimatedParallelism).toBe(1);
    });
  });

  describe('getWaveSpecs', () => {
    it('should return specs for requested wave', async () => {
      const specs = [
        createMockSpec('SPEC-A'),
        createMockSpec('SPEC-B', ['SPEC-A']),
        createMockSpec('SPEC-C', ['SPEC-A']),
      ];

      const plan = await analyzeSpecs(specs);

      const wave1Specs = getWaveSpecs(plan, 1);
      const wave2Specs = getWaveSpecs(plan, 2);

      expect(wave1Specs.map((s) => s.id)).toEqual(['SPEC-A']);
      expect(wave2Specs.map((s) => s.id).sort()).toEqual(['SPEC-B', 'SPEC-C']);
    });

    it('should return empty array for non-existent wave', async () => {
      const specs = [createMockSpec('SPEC-A')];
      const plan = await analyzeSpecs(specs);

      const waveSpecs = getWaveSpecs(plan, 99);

      expect(waveSpecs).toEqual([]);
    });
  });

  describe('getWaveCount', () => {
    it('should return correct wave count', async () => {
      const specs = [
        createMockSpec('SPEC-A'),
        createMockSpec('SPEC-B', ['SPEC-A']),
        createMockSpec('SPEC-C', ['SPEC-B']),
      ];

      const plan = await analyzeSpecs(specs);

      expect(getWaveCount(plan)).toBe(3);
    });

    it('should return 0 for empty plan', async () => {
      const plan = await analyzeSpecs([]);

      expect(getWaveCount(plan)).toBe(0);
    });
  });

  describe('canRunInParallel', () => {
    it('should return true for specs with no shared dependencies', async () => {
      const specs = [
        createMockSpec('SPEC-A'),
        createMockSpec('SPEC-B'),
        createMockSpec('SPEC-C'),
      ];

      const plan = await analyzeSpecs(specs);
      const wave = plan.waves[0];

      expect(canRunInParallel('SPEC-A', wave, new Map())).toBe(true);
      expect(canRunInParallel('SPEC-B', wave, new Map())).toBe(true);
    });

    it('should return true for specs in same wave with no cross-dependencies', async () => {
      const specs = [
        createMockSpec('SPEC-A'),
        createMockSpec('SPEC-B', ['SPEC-A']),
        createMockSpec('SPEC-C', ['SPEC-A']),
      ];

      const plan = await analyzeSpecs(specs);
      const wave = plan.waves[1]; // Wave 2 has B and C

      // B and C should be able to run in parallel (both only depend on A)
      expect(canRunInParallel('SPEC-B', wave, new Map([['SPEC-B', ['SPEC-A']]]))).toBe(true);
    });
  });

  describe('validatePlan', () => {
    it('should validate correct plan', async () => {
      const specs = [
        createMockSpec('SPEC-A'),
        createMockSpec('SPEC-B', ['SPEC-A']),
      ];

      const plan = await analyzeSpecs(specs);

      expect(validatePlan(plan, specs)).toBe(true);
    });

    it('should throw error for invalid wave ordering', async () => {
      const specs = [
        createMockSpec('SPEC-A'),
        createMockSpec('SPEC-B', ['SPEC-A']),
      ];

      // Create invalid plan manually
      const invalidPlan = {
        waves: [
          {
            waveNumber: 1,
            specs: [createMockSpec('SPEC-B', ['SPEC-A'])],
          },
          {
            waveNumber: 2,
            specs: [createMockSpec('SPEC-A')],
          },
        ],
        totalSpecs: 2,
        estimatedParallelism: 1,
      };

      expect(() => validatePlan(invalidPlan, specs)).toThrow(AnalysisError);
    });

    it('should throw error when spec appears in multiple waves', async () => {
      const specs = [createMockSpec('SPEC-A')];
      const duplicateSpec = createMockSpec('SPEC-A');

      const invalidPlan = {
        waves: [
          {
            waveNumber: 1,
            specs: [duplicateSpec],
          },
          {
            waveNumber: 2,
            specs: [duplicateSpec],
          },
        ],
        totalSpecs: 1,
        estimatedParallelism: 1,
      };

      expect(() => validatePlan(invalidPlan, specs)).toThrow(AnalysisError);
    });
  });

  describe('complex scenarios', () => {
    it('should handle large dependency tree', async () => {
      const specs = [
        createMockSpec('SPEC-001'),
        createMockSpec('SPEC-002'),
        createMockSpec('SPEC-003', ['SPEC-001', 'SPEC-002']),
        createMockSpec('SPEC-004'),
        createMockSpec('SPEC-005', ['SPEC-003', 'SPEC-004']),
      ];

      const plan = await analyzeSpecs(specs);

      expect(plan.waves).toHaveLength(3);
      expect(plan.waves[0].specs.map((s) => s.id).sort()).toEqual(['SPEC-001', 'SPEC-002', 'SPEC-004']);
      expect(plan.waves[1].specs.map((s) => s.id)).toEqual(['SPEC-003']);
      expect(plan.waves[2].specs.map((s) => s.id)).toEqual(['SPEC-005']);
    });

    it('should handle multiple independent chains', async () => {
      const specs = [
        createMockSpec('SPEC-A1'),
        createMockSpec('SPEC-A2', ['SPEC-A1']),
        createMockSpec('SPEC-B1'),
        createMockSpec('SPEC-B2', ['SPEC-B1']),
      ];

      const plan = await analyzeSpecs(specs);

      expect(plan.waves).toHaveLength(2);
      expect(plan.waves[0].specs.map((s) => s.id).sort()).toEqual(['SPEC-A1', 'SPEC-B1']);
      expect(plan.waves[1].specs.map((s) => s.id).sort()).toEqual(['SPEC-A2', 'SPEC-B2']);
    });
  });
});
