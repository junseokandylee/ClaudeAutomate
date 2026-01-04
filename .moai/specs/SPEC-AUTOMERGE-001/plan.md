# Implementation Plan: SPEC-AUTOMERGE-001

## Overview

Implement automatic merge and cleanup after SPEC completion.

## Task Breakdown

### Task 1: Extend Configuration Types

```typescript
// Add to src/shared/types.ts
type MergeStrategy = 'squash' | 'merge' | 'rebase'

interface AutoMergeConfig {
  enabled: boolean
  strategy: MergeStrategy
  targetBranch: string
  requireTestsPass: boolean
  batchMerge: boolean
  pushToRemote: boolean
}

interface MergeResult {
  success: boolean
  specId: string
  conflictFiles?: string[]
  error?: string
}
```

### Task 2: Create Auto Merge Service

```typescript
// src/main/services/auto-merge.service.ts
import { exec } from 'child_process'
import { WorktreeManagerService } from './worktree-manager.service'

export class AutoMergeService extends EventEmitter {
  constructor(
    private worktreeManager: WorktreeManagerService,
    private config: AutoMergeConfig
  ) {}

  async mergeSpec(specId: string): Promise<MergeResult> {
    const worktreePath = this.worktreeManager.getWorktreePath(specId)
    const branchName = `feature/SPEC-${specId}`

    try {
      // 1. Checkout target branch
      await this.checkoutBranch(this.config.targetBranch)

      // 2. Pull latest
      await this.pullLatest()

      // 3. Merge feature branch
      await this.mergeBranch(branchName, this.config.strategy)

      // 4. Push if configured
      if (this.config.pushToRemote) {
        await this.push()
      }

      // 5. Cleanup
      await this.cleanup(specId)

      return { success: true, specId }
    } catch (error) {
      return this.handleMergeError(specId, error)
    }
  }

  async cleanup(specId: string): Promise<void> {
    // Delete worktree
    await this.worktreeManager.cleanupWorktree(specId)

    // Delete feature branch
    const branchName = `feature/SPEC-${specId}`
    await this.deleteBranch(branchName)

    this.emit('cleanup_complete', { specId })
  }

  private async handleMergeError(specId: string, error: Error): Promise<MergeResult> {
    if (this.isConflictError(error)) {
      const conflictFiles = await this.getConflictFiles()
      this.emit('conflict_detected', { specId, conflictFiles })
      return { success: false, specId, conflictFiles }
    }
    return { success: false, specId, error: error.message }
  }
}
```

### Task 3: Integrate with Session Manager

```typescript
// Update src/main/services/session-manager.service.ts
import { AutoMergeService } from './auto-merge.service'

export class SessionManagerService extends EventEmitter {
  private autoMerge: AutoMergeService

  private async onSessionComplete(session: ClaudeSession): Promise<void> {
    if (session.status === 'completed' && this.config.autoMerge.enabled) {
      const result = await this.autoMerge.mergeSpec(session.specId)

      if (result.success) {
        this.emit('merge_complete', result)
      } else if (result.conflictFiles) {
        this.emit('merge_conflict', result)
      } else {
        this.emit('merge_failed', result)
      }
    }
  }
}
```

### Task 4: Create Merge Conflict Dialog

```typescript
// src/renderer/components/dialogs/MergeConflictDialog.tsx
interface MergeConflictDialogProps {
  open: boolean
  specId: string
  conflictFiles: string[]
  onResolve: () => void
  onAbort: () => void
}

export default function MergeConflictDialog({
  open,
  specId,
  conflictFiles,
  onResolve,
  onAbort
}: MergeConflictDialogProps) {
  return (
    <Dialog open={open}>
      <Dialog.Content>
        <Dialog.Title>Merge Conflict Detected</Dialog.Title>
        <p>SPEC-{specId} has merge conflicts in the following files:</p>
        <ul>
          {conflictFiles.map(file => (
            <li key={file}>{file}</li>
          ))}
        </ul>
        <p>Please resolve conflicts manually and click Retry.</p>
        <Dialog.Footer>
          <Button variant="ghost" onClick={onAbort}>Abort Merge</Button>
          <Button variant="primary" onClick={onResolve}>Retry Merge</Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  )
}
```

### Task 5: Add Settings UI

Add auto-merge section to SettingsDialog:
- Enable/disable toggle
- Merge strategy selection
- Target branch input
- Require tests pass checkbox

## Merge Flow Diagram

```
Session Completes (success)
    ↓
Check auto_merge_enabled
    ↓
Verify tests passed (if required)
    ↓
Begin Merge Process
    ├─→ Checkout main
    ├─→ Pull latest
    ├─→ Merge (squash/merge/rebase)
    │   ├─→ Success → Push → Cleanup → Done
    │   └─→ Conflict → Show Dialog → Wait for User
    └─→ Error → Show Error → Manual intervention
```

## Risk Analysis

| Risk | Mitigation |
|------|------------|
| Merge conflicts | Detect and show resolution UI |
| Remote push failures | Retry with exponential backoff |
| Incomplete cleanup | Cleanup verification step |
| Data loss | Backup branch before delete |

## Success Criteria

- Auto merge triggers on completion
- Merge strategy configurable
- Conflicts detected and displayed
- Cleanup removes worktree and branch
- Settings UI works correctly
