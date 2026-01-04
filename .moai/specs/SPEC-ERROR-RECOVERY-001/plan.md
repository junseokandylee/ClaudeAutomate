# Implementation Plan: SPEC-ERROR-RECOVERY-001

## Overview

Create robust error handling infrastructure with automatic recovery capabilities.

## Task Breakdown

### Task 1: Define Error Types

```typescript
// src/shared/errors.ts
export enum ErrorSeverity {
  CRITICAL = 'critical',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

export enum ErrorCode {
  // Session Errors
  SESSION_START_FAILED = 'SESSION_START_FAILED',
  SESSION_TIMEOUT = 'SESSION_TIMEOUT',
  SESSION_CRASHED = 'SESSION_CRASHED',

  // Git/Worktree Errors
  WORKTREE_CREATE_FAILED = 'WORKTREE_CREATE_FAILED',
  WORKTREE_CLEANUP_FAILED = 'WORKTREE_CLEANUP_FAILED',
  GIT_LOCK_CONFLICT = 'GIT_LOCK_CONFLICT',
  BRANCH_EXISTS = 'BRANCH_EXISTS',

  // Network Errors
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  API_RATE_LIMITED = 'API_RATE_LIMITED',
  CONNECTION_REFUSED = 'CONNECTION_REFUSED',

  // System Errors
  DISK_FULL = 'DISK_FULL',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  PROCESS_SPAWN_FAILED = 'PROCESS_SPAWN_FAILED'
}

export interface AppError {
  code: ErrorCode
  severity: ErrorSeverity
  message: string
  context: Record<string, unknown>
  timestamp: Date
  stack?: string
  recoverable: boolean
  recoveryAction?: RecoveryAction
}

export type RecoveryAction = 'retry' | 'skip' | 'abort' | 'manual'
```

### Task 2: Create Error Handler Service

```typescript
// src/main/services/error-handler.service.ts
export class ErrorHandlerService {
  private retryCounters = new Map<string, number>()
  private maxRetries = 3

  async handleError(error: AppError): Promise<RecoveryResult> {
    // Log error
    await this.logError(error)

    // Classify and route
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        return this.handleCritical(error)
      case ErrorSeverity.ERROR:
        return this.handleError(error)
      case ErrorSeverity.WARNING:
        return this.handleWarning(error)
      default:
        return { recovered: true, action: 'continue' }
    }
  }

  async attemptRetry(
    operationId: string,
    operation: () => Promise<void>
  ): Promise<boolean> {
    const count = this.retryCounters.get(operationId) || 0

    if (count >= this.maxRetries) {
      return false
    }

    const delay = Math.pow(2, count) * 1000 // Exponential backoff
    await this.sleep(delay)

    try {
      await operation()
      this.retryCounters.delete(operationId)
      return true
    } catch {
      this.retryCounters.set(operationId, count + 1)
      return this.attemptRetry(operationId, operation)
    }
  }

  async recoverSession(sessionId: string): Promise<boolean> {
    // Session-specific recovery logic
  }

  async recoverWorktree(specId: string): Promise<boolean> {
    // Worktree-specific recovery logic
  }
}
```

### Task 3: Create React Error Boundary

```typescript
// src/renderer/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo } from 'react'
import { Button } from '@/components/ui'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, errorInfo: null }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo })
    window.electronAPI.logError({
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    })
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  handleReset = (): void => {
    window.electronAPI.resetApplication()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-900">
          <div className="glass-panel p-8 max-w-md text-center">
            <h2 className="text-xl font-semibold text-red-400 mb-4">
              Something went wrong
            </h2>
            <p className="text-slate-400 mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={this.handleRetry} variant="outline">
                Try Again
              </Button>
              <Button onClick={this.handleReset} variant="destructive">
                Reset App
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
```

### Task 4: Session Recovery Manager

```typescript
// src/main/services/session-recovery.service.ts
export class SessionRecoveryService {
  private checkpointPath = '.moai/execution-checkpoint.json'

  async saveCheckpoint(state: ExecutionState): Promise<void> {
    await fs.writeFile(
      this.checkpointPath,
      JSON.stringify(state, null, 2)
    )
  }

  async loadCheckpoint(): Promise<ExecutionState | null> {
    try {
      const data = await fs.readFile(this.checkpointPath, 'utf-8')
      return JSON.parse(data)
    } catch {
      return null
    }
  }

  async resumeExecution(): Promise<ExecutionPlan> {
    const checkpoint = await this.loadCheckpoint()
    if (!checkpoint) {
      throw new Error('No checkpoint found')
    }

    // Filter completed SPECs
    const remainingSpecs = checkpoint.plan.waves
      .flatMap(w => w.specs)
      .filter(s => !checkpoint.completedSpecs.includes(s.id))

    // Recalculate waves for remaining SPECs
    return this.recalculateWaves(remainingSpecs)
  }

  async clearCheckpoint(): Promise<void> {
    await fs.unlink(this.checkpointPath).catch(() => {})
  }
}
```

### Task 5: Worktree Error Recovery

```typescript
// src/main/services/worktree-recovery.service.ts
export class WorktreeRecoveryService {
  async handleLockConflict(lockPath: string): Promise<boolean> {
    try {
      // Check if lock is stale
      const stats = await fs.stat(lockPath)
      const age = Date.now() - stats.mtimeMs

      if (age > 60000) { // Older than 1 minute
        await fs.unlink(lockPath)
        return true
      }
      return false
    } catch {
      return false
    }
  }

  async cleanupOrphanedWorktrees(): Promise<string[]> {
    const worktrees = await this.listWorktrees()
    const orphaned: string[] = []

    for (const wt of worktrees) {
      if (!await this.hasValidBranch(wt)) {
        await this.removeWorktree(wt.path)
        orphaned.push(wt.path)
      }
    }

    return orphaned
  }

  async recoverPartialWorktree(specId: string): Promise<void> {
    // Remove partial and recreate
    await this.removeWorktree(`SPEC-${specId}`)
    await this.createWorktree(specId)
  }
}
```

## Error Recovery Strategies

| Error Type | Strategy | Retry Count | Backoff |
|------------|----------|-------------|---------|
| Session timeout | Retry with extended timeout | 3 | Exponential |
| Network error | Retry with backoff | 5 | Exponential |
| Git lock | Wait and retry | 3 | Fixed 2s |
| Worktree conflict | Clean and recreate | 1 | N/A |
| Permission error | Notify user | 0 | N/A |

## Risk Analysis

| Risk | Mitigation |
|------|------------|
| Infinite retry loop | Max retry count + circuit breaker |
| Data corruption | Checkpoint validation |
| Resource exhaustion | Cleanup before retry |

## Success Criteria

- All errors logged with full context
- Automatic retry works for transient failures
- UI shows clear recovery options
- State persisted for resume capability
- No silent failures
