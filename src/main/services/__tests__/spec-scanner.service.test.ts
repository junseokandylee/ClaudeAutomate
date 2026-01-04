/**
 * Tests for SPEC Scanner Service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { scanSpecs, findSpecById, filterSpecsByStatus } from '../spec-scanner.service';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';

describe('spec-scanner.service', () => {
  const testProjectPath = join(process.cwd(), 'test-specs-temp');

  beforeEach(async () => {
    // Clean up test directory before each test
    try {
      await rm(testProjectPath, { recursive: true, force: true });
    } catch {
      // Directory doesn't exist yet
    }
  });

  describe('scanSpecs', () => {
    it('should return empty array when no specs directory exists', async () => {
      const specs = await scanSpecs(testProjectPath);
      expect(specs).toEqual([]);
    });

    it('should scan and parse valid SPEC files', async () => {
      // Create test SPEC files
      const specsDir = join(testProjectPath, '.moai', 'specs', 'SPEC-001');
      await mkdir(specsDir, { recursive: true });

      const specContent = `---
id: SPEC-001
title: Test SPEC
dependencies: []
---
# Test SPEC Content
`;
      await writeFile(join(specsDir, 'spec.md'), specContent);

      const specs = await scanSpecs(testProjectPath);

      expect(specs).toHaveLength(1);
      expect(specs[0]).toMatchObject({
        id: 'SPEC-001',
        title: 'Test SPEC',
        status: 'pending',
        dependencies: [],
      });
      expect(specs[0].filePath).toContain('SPEC-001');
    });

    it('should parse dependencies from YAML frontmatter', async () => {
      const specsDir = join(testProjectPath, '.moai', 'specs', 'SPEC-002');
      await mkdir(specsDir, { recursive: true });

      const specContent = `---
id: SPEC-002
title: SPEC with Dependencies
dependencies:
  - SPEC-001
  - SPEC-SHARED-001
---
# Content
`;
      await writeFile(join(specsDir, 'spec.md'), specContent);

      const specs = await scanSpecs(testProjectPath);

      expect(specs).toHaveLength(1);
      expect(specs[0].dependencies).toEqual(['SPEC-001', 'SPEC-SHARED-001']);
    });

    it('should extract title from content if not in frontmatter', async () => {
      const specsDir = join(testProjectPath, '.moai', 'specs', 'SPEC-003');
      await mkdir(specsDir, { recursive: true });

      const specContent = `---
id: SPEC-003
---
# My Custom Title
`;
      await writeFile(join(specsDir, 'spec.md'), specContent);

      const specs = await scanSpecs(testProjectPath);

      expect(specs).toHaveLength(1);
      expect(specs[0].title).toBe('My Custom Title');
    });

    it('should extract SPEC ID from directory name if not in frontmatter', async () => {
      const specsDir = join(testProjectPath, '.moai', 'specs', 'SPEC-FALLBACK');
      await mkdir(specsDir, { recursive: true });

      const specContent = `---
title: Fallback Test
---
# Content
`;
      await writeFile(join(specsDir, 'spec.md'), specContent);

      const specs = await scanSpecs(testProjectPath);

      expect(specs).toHaveLength(1);
      expect(specs[0].id).toBe('SPEC-FALLBACK');
    });

    it('should handle multiple SPEC files in parallel', async () => {
      // Create multiple SPEC directories
      for (let i = 1; i <= 3; i++) {
        const specId = `SPEC-00${i}`;
        const specsDir = join(testProjectPath, '.moai', 'specs', specId);
        await mkdir(specsDir, { recursive: true });

        const specContent = `---
id: ${specId}
title: Test SPEC ${i}
dependencies: []
---
# Content
`;
        await writeFile(join(specsDir, 'spec.md'), specContent);
      }

      const specs = await scanSpecs(testProjectPath);

      expect(specs).toHaveLength(3);
      expect(specs.map((s) => s.id)).toEqual(['SPEC-001', 'SPEC-002', 'SPEC-003']);
    });

    it('should skip files that cannot be parsed', async () => {
      const specsDir = join(testProjectPath, '.moai', 'specs', 'SPEC-VALID');
      const invalidDir = join(testProjectPath, '.moai', 'specs', 'SPEC-INVALID');
      await mkdir(specsDir, { recursive: true });
      await mkdir(invalidDir, { recursive: true });

      // Valid SPEC
      const validContent = `---
id: SPEC-VALID
title: Valid SPEC
dependencies: []
---
# Content
`;
      await writeFile(join(specsDir, 'spec.md'), validContent);

      // Invalid SPEC (empty file)
      await writeFile(join(invalidDir, 'spec.md'), '');

      const specs = await scanSpecs(testProjectPath);

      expect(specs).toHaveLength(1);
      expect(specs[0].id).toBe('SPEC-VALID');
    });

    it('should default to Untitled SPEC when no title found', async () => {
      const specsDir = join(testProjectPath, '.moai', 'specs', 'SPEC-NOTITLE');
      await mkdir(specsDir, { recursive: true });

      const specContent = `---
id: SPEC-NOTITLE
---
No heading here
`;
      await writeFile(join(specsDir, 'spec.md'), specContent);

      const specs = await scanSpecs(testProjectPath);

      expect(specs).toHaveLength(1);
      expect(specs[0].title).toBe('Untitled SPEC');
    });

    it('should handle nested directory structures', async () => {
      const specsDir = join(testProjectPath, '.moai', 'specs', 'SPEC-NESTED');
      await mkdir(specsDir, { recursive: true });

      const specContent = `---
id: SPEC-NESTED
title: Nested SPEC
dependencies: []
---
# Content
`;
      await writeFile(join(specsDir, 'spec.md'), specContent);

      const specs = await scanSpecs(testProjectPath);

      expect(specs).toHaveLength(1);
      expect(specs[0].id).toBe('SPEC-NESTED');
    });
  });

  describe('findSpecById', () => {
    it('should find spec by ID', () => {
      const specs = [
        { id: 'SPEC-001', title: 'First', filePath: '/path/1', status: 'pending' as const, dependencies: [] },
        { id: 'SPEC-002', title: 'Second', filePath: '/path/2', status: 'pending' as const, dependencies: [] },
      ];

      const found = findSpecById(specs, 'SPEC-002');
      expect(found).toEqual(specs[1]);
    });

    it('should return undefined when spec not found', () => {
      const specs = [
        { id: 'SPEC-001', title: 'First', filePath: '/path/1', status: 'pending' as const, dependencies: [] },
      ];

      const found = findSpecById(specs, 'SPEC-NONEXISTENT');
      expect(found).toBeUndefined();
    });
  });

  describe('filterSpecsByStatus', () => {
    it('should filter specs by status', () => {
      const specs = [
        { id: 'SPEC-001', title: 'First', filePath: '/path/1', status: 'pending' as const, dependencies: [] },
        { id: 'SPEC-002', title: 'Second', filePath: '/path/2', status: 'running' as const, dependencies: [] },
        { id: 'SPEC-003', title: 'Third', filePath: '/path/3', status: 'pending' as const, dependencies: [] },
      ];

      const pendingSpecs = filterSpecsByStatus(specs, 'pending');
      expect(pendingSpecs).toHaveLength(2);
      expect(pendingSpecs.map((s) => s.id)).toEqual(['SPEC-001', 'SPEC-003']);
    });

    it('should return empty array when no specs match status', () => {
      const specs = [
        { id: 'SPEC-001', title: 'First', filePath: '/path/1', status: 'pending' as const, dependencies: [] },
      ];

      const runningSpecs = filterSpecsByStatus(specs, 'running');
      expect(runningSpecs).toEqual([]);
    });
  });
});
