# Implementation Plan: SPEC-SERVICES-001

## Overview

Create 4 core Main process services for SPEC management and execution planning.

## Task Breakdown

### Task 1: Create SPEC Scanner Service

```typescript
// src/main/services/spec-scanner.service.ts
import { glob } from 'glob'
import { readFile } from 'fs/promises'
import matter from 'gray-matter'
import type { SpecInfo } from '@/shared/types'

export async function scanSpecs(projectPath: string): Promise<SpecInfo[]> {
  const specPaths = await glob(`${projectPath}/.moai/specs/*/spec.md`)

  const specs = await Promise.all(
    specPaths.map(async (path) => {
      const content = await readFile(path, 'utf-8')
      const { data } = matter(content)

      return {
        id: data.id,
        title: data.title || extractTitleFromContent(content),
        filePath: path,
        status: 'pending' as const,
        dependencies: data.dependencies || []
      }
    })
  )

  return specs
}
```

### Task 2: Create Dependency Analyzer Service

```typescript
// src/main/services/dependency-analyzer.service.ts
import type { SpecInfo, Wave, ExecutionPlan } from '@/shared/types'

export async function analyzeSpecs(specs: SpecInfo[]): Promise<ExecutionPlan> {
  // Build dependency graph
  const graph = buildDependencyGraph(specs)

  // Check for circular dependencies
  if (hasCircularDependency(graph)) {
    throw new AnalysisError('Circular dependency detected')
  }

  // Calculate waves using topological sort
  const waves = calculateWaves(specs, graph)

  return {
    waves,
    totalSpecs: specs.length,
    estimatedParallelism: Math.max(...waves.map(w => w.specs.length))
  }
}

function calculateWaves(specs: SpecInfo[], graph: Map<string, string[]>): Wave[] {
  const waves: Wave[] = []
  const completed = new Set<string>()

  while (completed.size < specs.length) {
    const waveSpecs = specs.filter(spec => {
      if (completed.has(spec.id)) return false
      const deps = graph.get(spec.id) || []
      return deps.every(dep => completed.has(dep))
    })

    waves.push({
      waveNumber: waves.length + 1,
      specs: waveSpecs
    })

    waveSpecs.forEach(spec => completed.add(spec.id))
  }

  return waves
}
```

### Task 3: Create Worktree Manager Service

```typescript
// src/main/services/worktree-manager.service.ts
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execAsync = promisify(exec)

export class WorktreeManagerService {
  private activeWorktrees = new Map<string, string>()

  async createWorktree(specId: string): Promise<string> {
    const worktreePath = path.join('.worktrees', specId)

    await execAsync(`moai-worktree create ${specId}`)

    this.activeWorktrees.set(specId, worktreePath)
    return worktreePath
  }

  async cleanupWorktree(specId: string): Promise<void> {
    await execAsync(`moai-worktree cleanup ${specId}`)
    this.activeWorktrees.delete(specId)
  }

  async mergeWorktree(specId: string): Promise<void> {
    // Switch to worktree, commit, merge back to main
  }

  getActiveWorktrees(): Map<string, string> {
    return new Map(this.activeWorktrees)
  }
}
```

### Task 4: Create SPEC Status Poller Service

```typescript
// src/main/services/spec-status-poller.service.ts
import { EventEmitter } from 'events'
import type { SpecInfo, SpecStatus } from '@/shared/types'

export class SpecStatusPollerService extends EventEmitter {
  private statusMap = new Map<string, SpecStatus>()

  start(specs: SpecInfo[]): void {
    specs.forEach(spec => {
      this.statusMap.set(spec.id, 'pending')
    })
  }

  updateStatus(specId: string, status: SpecStatus): void {
    const oldStatus = this.statusMap.get(specId)
    this.statusMap.set(specId, status)

    if (oldStatus !== status) {
      this.emit('statusChange', { specId, status, previousStatus: oldStatus })
    }
  }

  parseOutputForStatus(specId: string, output: string): void {
    // Look for completion markers in Claude output
    if (output.includes('SPEC completed successfully')) {
      this.updateStatus(specId, 'completed')
    } else if (output.includes('ERROR:') || output.includes('failed')) {
      this.updateStatus(specId, 'failed')
    }
  }

  getStatus(specId: string): SpecStatus | undefined {
    return this.statusMap.get(specId)
  }
}
```

## File Structure

```
src/main/services/
├── spec-scanner.service.ts         (~80 lines)
├── dependency-analyzer.service.ts  (~150 lines)
├── worktree-manager.service.ts     (~100 lines)
└── spec-status-poller.service.ts   (~80 lines)
```

## Wave Calculation Example

```
SPECs: A, B, C, D, E
Dependencies:
  A: []
  B: []
  C: [A]
  D: [A, B]
  E: [C, D]

Result:
  Wave 1: [A, B]     - 2 parallel
  Wave 2: [C, D]     - 2 parallel
  Wave 3: [E]        - 1 parallel
```

## Worktree Commands

| Action | Command |
|--------|---------|
| Create | `moai-worktree create SPEC-XXX` |
| Cleanup | `moai-worktree cleanup SPEC-XXX` |
| List | `moai-worktree list` |
| Switch | `moai-worktree switch SPEC-XXX` |

## Risk Analysis

| Risk | Mitigation |
|------|------------|
| Large number of SPECs | Batch processing |
| Circular dependencies | Early detection and error |
| Worktree conflicts | Lock mechanism |
| Output parsing errors | Fuzzy matching |

## Success Criteria

- SPEC scanning finds all valid SPECs
- Wave calculation is correct
- Worktrees are created/cleaned properly
- Status updates are real-time
- Error handling is robust
