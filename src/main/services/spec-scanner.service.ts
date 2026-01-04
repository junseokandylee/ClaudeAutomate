/**
 * SPEC Scanner Service
 *
 * Scans project directory for SPEC files and parses YAML frontmatter.
 * Provides functionality to discover and extract metadata from SPEC documents.
 *
 * @module spec-scanner.service
 */

import { glob } from 'glob';
import { readFile } from 'fs/promises';
import type { SpecInfo } from '../../shared/types';

/**
 * Parsed YAML frontmatter from SPEC file
 */
interface SpecFrontmatter {
  id?: string;
  title?: string;
  status?: string;
  dependencies?: string[];
  [key: string]: unknown;
}

/**
 * Parse YAML frontmatter from file content
 *
 * Extracts YAML metadata between --- delimiters at the start of the file.
 *
 * @param content - File content as string
 * @returns Parsed frontmatter object
 *
 * @example
 * ```typescript
 * const content = '---\nid: SPEC-001\ntitle: Test\n---\n# Content';
 * const frontmatter = parseFrontmatter(content);
 * // { id: 'SPEC-001', title: 'Test' }
 * ```
 */
function parseFrontmatter(content: string): SpecFrontmatter {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return {};
  }

  const yamlContent = match[1];
  const data: SpecFrontmatter = {};

  // Simple YAML parser for key-value pairs
  const lines = yamlContent.split('\n');
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      const value = line.slice(colonIndex + 1).trim();

      // Parse values
      if (value.startsWith('[') && value.endsWith(']')) {
        // Array value
        const arrayContent = value.slice(1, -1);
        data[key] = arrayContent
          .split(',')
          .map((item) => item.trim())
          .filter((item) => item.length > 0);
      } else if (value === 'true') {
        data[key] = true;
      } else if (value === 'false') {
        data[key] = false;
      } else if (value.startsWith('"') || value.startsWith("'")) {
        // String value with quotes
        data[key] = value.slice(1, -1);
      } else {
        // Plain string value
        data[key] = value;
      }
    }
  }

  return data;
}

/**
 * Extract title from SPEC content
 *
 * Falls back to extracting first heading if title not in frontmatter.
 *
 * @param content - File content as string
 * @returns Extracted title or default string
 */
function extractTitleFromContent(content: string): string {
  // Look for first markdown heading
  const headingRegex = /^#\s+(.+)$/m;
  const match = content.match(headingRegex);
  return match ? match[1].trim() : 'Untitled SPEC';
}

/**
 * Scan project directory for SPEC files
 *
 * Searches for all spec.md files in .moai/specs/ directories,
 * parses their frontmatter, and returns SpecInfo objects.
 *
 * @param projectPath - Root directory path to scan
 * @returns Array of SpecInfo objects for all discovered SPECs
 *
 * @throws {Error} If projectPath doesn't exist or is inaccessible
 *
 * @example
 * ```typescript
 * const specs = await scanSpecs('/home/user/project');
 * console.log(`Found ${specs.length} SPECs`);
 * ```
 */
export async function scanSpecs(projectPath: string): Promise<SpecInfo[]> {
  // Find all spec.md files in .moai/specs/ subdirectories
  const specPaths = await glob(`${projectPath}/.moai/specs/*/spec.md`, {
    windowsPathsNoEscape: true,
  });

  if (specPaths.length === 0) {
    return [];
  }

  // Parse all SPEC files in parallel
  const specs = await Promise.all(
    specPaths.map(async (filePath) => {
      try {
        const content = await readFile(filePath, 'utf-8');
        const frontmatter = parseFrontmatter(content);

        // Extract title from frontmatter or content
        const title =
          frontmatter.title ||
          extractTitleFromContent(content);

        return {
          id: frontmatter.id || extractSpecIdFromPath(filePath),
          title,
          filePath,
          status: 'pending' as const,
          dependencies: (frontmatter.dependencies as string[]) || [],
        };
      } catch (error) {
        // Skip files that can't be read or parsed
        console.error(`Failed to parse SPEC file ${filePath}:`, error);
        return null;
      }
    })
  );

  // Filter out null entries from failed parses
  return specs.filter((spec): spec is SpecInfo => spec !== null);
}

/**
 * Extract SPEC ID from file path
 *
 * Falls back to extracting ID from directory name if not in frontmatter.
 *
 * @param filePath - Absolute path to spec.md file
 * @returns Extracted SPEC ID
 */
function extractSpecIdFromPath(filePath: string): string {
  // Extract directory name from path
  // e.g., /path/to/.moai/specs/SPEC-001/spec.md -> SPEC-001
  const parts = filePath.split(/[/\\]/);
  const specDirIndex = parts.findIndex((part) => part === 'specs');

  if (specDirIndex >= 0 && specDirIndex + 1 < parts.length) {
    return parts[specDirIndex + 1];
  }

  // Fallback to filename without extension
  const fileName = parts[parts.length - 1];
  return fileName.replace(/\.md$/, '');
}

/**
 * Find SPEC by ID in scanned specs
 *
 * @param specs - Array of SpecInfo objects
 * @param specId - SPEC ID to find
 * @returns SpecInfo if found, undefined otherwise
 */
export function findSpecById(
  specs: SpecInfo[],
  specId: string
): SpecInfo | undefined {
  return specs.find((spec) => spec.id === specId);
}

/**
 * Filter specs by status
 *
 * @param specs - Array of SpecInfo objects
 * @param status - Status to filter by
 * @returns Array of specs matching the status
 */
export function filterSpecsByStatus(
  specs: SpecInfo[],
  status: SpecInfo['status']
): SpecInfo[] {
  return specs.filter((spec) => spec.status === status);
}
