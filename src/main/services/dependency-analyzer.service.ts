/**
 * Dependency Analyzer Service
 *
 * Analyzes SPEC dependencies and creates execution waves for parallel processing.
 * Implements topological sorting to resolve dependencies and detect cycles.
 *
 * @module dependency-analyzer.service
 */

import type { SpecInfo, Wave, ExecutionPlan } from '../../shared/types';
import { AnalysisError } from '../../shared/errors';

/**
 * Build dependency graph from SPEC array
 *
 * Creates a mapping where each SPEC ID points to its dependencies.
 *
 * @param specs - Array of SpecInfo objects
 * @returns Map of specId to array of dependency IDs
 */
function buildDependencyGraph(specs: SpecInfo[]): Map<string, string[]> {
  const graph = new Map<string, string[]>();

  for (const spec of specs) {
    // Validate that all dependencies exist
    const validDependencies = spec.dependencies.filter((depId) =>
      specs.some((s) => s.id === depId)
    );

    graph.set(spec.id, validDependencies);
  }

  return graph;
}

/**
 * Detect circular dependencies using DFS
 *
 * Performs depth-first search to find cycles in the dependency graph.
 *
 * @param graph - Dependency graph
 * @returns Array of circular dependency paths (empty if none)
 */
function detectCircularDependencies(
  graph: Map<string, string[]>
): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const path: string[] = [];

  function dfs(node: string): boolean {
    visited.add(node);
    recursionStack.add(node);
    path.push(node);

    const dependencies = graph.get(node) || [];

    for (const dep of dependencies) {
      if (!visited.has(dep)) {
        if (dfs(dep)) {
          return true;
        }
      } else if (recursionStack.has(dep)) {
        // Found a cycle
        const cycleStart = path.indexOf(dep);
        cycles.push([...path.slice(cycleStart), dep]);
        return true;
      }
    }

    path.pop();
    recursionStack.delete(node);
    return false;
  }

  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      dfs(node);
    }
  }

  return cycles;
}

/**
 * Calculate execution waves using topological sort
 *
 * Groups SPECs into waves where each wave contains SPECs whose dependencies
 * are satisfied by previous waves.
 *
 * @param specs - Array of SpecInfo objects
 * @param graph - Dependency graph
 * @returns Array of Wave objects
 */
function calculateWaves(
  specs: SpecInfo[],
  graph: Map<string, string[]>
): Wave[] {
  const waves: Wave[] = [];
  const completed = new Set<string>();
  const specMap = new Map(specs.map((s) => [s.id, s]));

  // Keep processing until all specs are assigned to waves
  while (completed.size < specs.length) {
    const waveSpecs: SpecInfo[] = [];

    // Find all specs whose dependencies are satisfied
    for (const spec of specs) {
      if (completed.has(spec.id)) {
        continue; // Already assigned to a wave
      }

      const dependencies = graph.get(spec.id) || [];

      // Check if all dependencies are completed
      const allDepsCompleted = dependencies.every((dep) =>
        completed.has(dep)
      );

      if (allDepsCompleted) {
        waveSpecs.push(spec);
      }
    }

    // If we can't make progress, we have a cycle (shouldn't happen if we checked earlier)
    if (waveSpecs.length === 0) {
      throw new AnalysisError(
        'ANALYSIS_DEPENDENCY_CYCLE' as const,
        'Unable to calculate waves - possible circular dependency'
      );
    }

    // Create wave and mark specs as completed
    waves.push({
      waveNumber: waves.length + 1,
      specs: waveSpecs,
    });

    waveSpecs.forEach((spec) => completed.add(spec.id));
  }

  return waves;
}

/**
 * Calculate optimal parallelism for a wave
 *
 * Returns the minimum of wave size and maximum allowed parallel sessions.
 *
 * @param waveSize - Number of specs in the wave
 * @param maxParallel - Maximum allowed parallel sessions
 * @returns Optimal parallelism for this wave
 */
function calculateWaveParallelism(
  waveSize: number,
  maxParallel: number
): number {
  return Math.min(waveSize, maxParallel);
}

/**
 * Analyze SPECs and create execution plan
 *
 * Performs dependency analysis, validates the graph, and creates
 * an execution plan with waves for parallel processing.
 *
 * @param specs - Array of SpecInfo objects
 * @param maxParallel - Maximum parallel sessions (default: 10)
 * @returns ExecutionPlan with waves and metadata
 *
 * @throws {AnalysisError} If circular dependencies are detected
 *
 * @example
 * ```typescript
 * const specs = await scanSpecs('/project');
 * const plan = await analyzeSpecs(specs);
 * console.log(`Total waves: ${plan.waves.length}`);
 * ```
 */
export async function analyzeSpecs(
  specs: SpecInfo[],
  maxParallel: number = 10
): Promise<ExecutionPlan> {
  // Build dependency graph
  const graph = buildDependencyGraph(specs);

  // Check for circular dependencies
  const cycles = detectCircularDependencies(graph);
  if (cycles.length > 0) {
    const cycleDescriptions = cycles
      .map((cycle) => cycle.join(' -> '))
      .join('; ');
    throw new AnalysisError(
      'ANALYSIS_DEPENDENCY_CYCLE' as const,
      `Circular dependencies detected: ${cycleDescriptions}`,
      { cycles }
    );
  }

  // Calculate waves
  const waves = calculateWaves(specs, graph);

  // Calculate maximum parallelism across all waves
  const estimatedParallelism = Math.max(
    ...waves.map((wave) =>
      calculateWaveParallelism(wave.specs.length, maxParallel)
    ),
    1 // At least 1
  );

  return {
    waves,
    totalSpecs: specs.length,
    estimatedParallelism,
  };
}

/**
 * Get SPECs for a specific wave
 *
 * @param plan - ExecutionPlan
 * @param waveNumber - Wave number (1-based)
 * @returns Array of SpecInfo for the wave
 */
export function getWaveSpecs(
  plan: ExecutionPlan,
  waveNumber: number
): SpecInfo[] {
  const wave = plan.waves.find((w) => w.waveNumber === waveNumber);
  return wave?.specs || [];
}

/**
 * Get total number of waves
 *
 * @param plan - ExecutionPlan
 * @returns Number of waves in the plan
 */
export function getWaveCount(plan: ExecutionPlan): number {
  return plan.waves.length;
}

/**
 * Check if a SPEC can run in parallel with others
 *
 * A SPEC can run in parallel if it's in the same wave and has no
 * dependencies on other SPECs in that wave.
 *
 * @param specId - SPEC ID to check
 * @param wave - Wave to check against
 * @param graph - Dependency graph
 * @returns True if SPEC can run in parallel
 */
export function canRunInParallel(
  specId: string,
  wave: Wave,
  graph: Map<string, string[]>
): boolean {
  // SPEC must be in the wave
  if (!wave.specs.some((s) => s.id === specId)) {
    return false;
  }

  // Check dependencies - none should be in the same wave
  const dependencies = graph.get(specId) || [];
  const waveSpecIds = new Set(wave.specs.map((s) => s.id));

  return !dependencies.some((dep) => waveSpecIds.has(dep));
}

/**
 * Validate execution plan
 *
 * Checks that all SPECs are assigned to waves and dependencies are satisfied.
 *
 * @param plan - ExecutionPlan to validate
 * @param specs - Original array of SpecInfo
 * @returns True if plan is valid
 *
 * @throws {AnalysisError} If validation fails
 */
export function validatePlan(
  plan: ExecutionPlan,
  specs: SpecInfo[]
): boolean {
  // Check all specs are assigned
  const assignedSpecs = new Set<string>();
  for (const wave of plan.waves) {
    for (const spec of wave.specs) {
      if (assignedSpecs.has(spec.id)) {
        throw new AnalysisError(
          'ANALYSIS_INVALID_SPEC' as const,
          `SPEC ${spec.id} appears in multiple waves`
        );
      }
      assignedSpecs.add(spec.id);
    }
  }

  if (assignedSpecs.size !== specs.length) {
    throw new AnalysisError(
      'ANALYSIS_NO_SPECS_FOUND' as const,
      `Not all specs assigned to waves: ${specs.length - assignedSpecs.size} missing`
    );
  }

  // Validate wave ordering
  const specToWave = new Map<string, number>();
  for (const wave of plan.waves) {
    for (const spec of wave.specs) {
      specToWave.set(spec.id, wave.waveNumber);
    }
  }

  for (const spec of specs) {
    const specWave = specToWave.get(spec.id);
    if (!specWave) {
      continue;
    }

    for (const depId of spec.dependencies) {
      const depWave = specToWave.get(depId);
      if (depWave && depWave >= specWave) {
        throw new AnalysisError(
          'ANALYSIS_DEPENDENCY_CYCLE' as const,
          `Invalid wave ordering: ${spec.id} (wave ${specWave}) depends on ${depId} (wave ${depWave})`
        );
      }
    }
  }

  return true;
}
