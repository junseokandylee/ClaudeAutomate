# Implementation Plan: SPEC-GIT-001

## Overview

Implement Git integration with worktree management and branch operations.

## Task Breakdown

### Task 1: Git Service

```typescript
// src/main/services/git.service.ts
import simpleGit, { SimpleGit, StatusResult } from 'simple-git'
import path from 'path'
import fs from 'fs/promises'

interface WorktreeInfo {
  path: string
  branch: string
  head: string
  specId: string
  createdAt: Date
}

interface BranchStatus {
  name: string
  current: boolean
  tracking?: string
  ahead: number
  behind: number
}

export class GitService {
  private git: SimpleGit
  private projectPath: string
  private worktrees: Map<string, WorktreeInfo> = new Map()

  constructor(projectPath: string) {
    this.projectPath = projectPath
    this.git = simpleGit(projectPath)
  }

  async initialize(): Promise<void> {
    const isRepo = await this.git.checkIsRepo()
    if (!isRepo) {
      throw new Error('Not a git repository')
    }

    // Load existing worktrees
    await this.refreshWorktrees()
  }

  async createWorktree(specId: string): Promise<WorktreeInfo> {
    const branchName = this.getBranchName(specId)
    const worktreePath = this.getWorktreePath(specId)

    // Create branch if it doesn't exist
    const branches = await this.git.branch()
    if (!branches.all.includes(branchName)) {
      await this.git.checkoutLocalBranch(branchName)
      await this.git.checkout(branches.current)
    }

    // Create worktree
    await this.git.raw(['worktree', 'add', worktreePath, branchName])

    const info: WorktreeInfo = {
      path: worktreePath,
      branch: branchName,
      head: await this.getHeadCommit(worktreePath),
      specId,
      createdAt: new Date()
    }

    this.worktrees.set(specId, info)
    return info
  }

  async removeWorktree(specId: string): Promise<void> {
    const worktree = this.worktrees.get(specId)
    if (!worktree) return

    await this.git.raw(['worktree', 'remove', worktree.path, '--force'])
    this.worktrees.delete(specId)
  }

  async getWorktree(specId: string): Promise<WorktreeInfo | undefined> {
    return this.worktrees.get(specId)
  }

  private async refreshWorktrees(): Promise<void> {
    const output = await this.git.raw(['worktree', 'list', '--porcelain'])
    const lines = output.split('\n')

    this.worktrees.clear()

    let current: Partial<WorktreeInfo> = {}
    for (const line of lines) {
      if (line.startsWith('worktree ')) {
        current.path = line.substring(9)
      } else if (line.startsWith('HEAD ')) {
        current.head = line.substring(5)
      } else if (line.startsWith('branch ')) {
        current.branch = line.substring(7).replace('refs/heads/', '')
      } else if (line === '') {
        if (current.path && current.branch?.startsWith('spec/')) {
          const specId = current.branch.replace('spec/', '').toUpperCase()
          this.worktrees.set(specId, current as WorktreeInfo)
        }
        current = {}
      }
    }
  }

  private getBranchName(specId: string): string {
    return `spec/${specId.toLowerCase()}`
  }

  private getWorktreePath(specId: string): string {
    return path.join(this.projectPath, '.worktrees', specId.toLowerCase())
  }

  private async getHeadCommit(worktreePath: string): Promise<string> {
    const git = simpleGit(worktreePath)
    const log = await git.log({ maxCount: 1 })
    return log.latest?.hash || ''
  }

  async getStatus(worktreePath?: string): Promise<StatusResult> {
    const git = worktreePath ? simpleGit(worktreePath) : this.git
    return git.status()
  }

  async getBranches(): Promise<BranchStatus[]> {
    const branches = await this.git.branch(['-vv'])
    return branches.all.map(name => ({
      name,
      current: name === branches.current,
      tracking: branches.branches[name]?.tracking,
      ahead: branches.branches[name]?.ahead || 0,
      behind: branches.branches[name]?.behind || 0
    }))
  }

  async getCommitHistory(
    branch: string,
    limit = 50
  ): Promise<Array<{
    hash: string
    message: string
    author: string
    date: Date
    files: string[]
  }>> {
    const log = await this.git.log({
      maxCount: limit,
      '--': [branch]
    })

    return Promise.all(log.all.map(async commit => {
      const diff = await this.git.diff([`${commit.hash}^`, commit.hash, '--name-only'])
      return {
        hash: commit.hash,
        message: commit.message,
        author: commit.author_name,
        date: new Date(commit.date),
        files: diff.split('\n').filter(Boolean)
      }
    }))
  }

  async mergeBranch(branch: string, into = 'main'): Promise<{ success: boolean; conflicts?: string[] }> {
    try {
      await this.git.checkout(into)
      await this.git.merge([branch])
      return { success: true }
    } catch (error) {
      const status = await this.git.status()
      return {
        success: false,
        conflicts: status.conflicted
      }
    }
  }

  async hasConflicts(worktreePath: string): Promise<string[]> {
    const git = simpleGit(worktreePath)
    const status = await git.status()
    return status.conflicted
  }

  async cleanupCompletedWorktrees(completedSpecIds: string[]): Promise<number> {
    let cleaned = 0
    for (const specId of completedSpecIds) {
      if (this.worktrees.has(specId)) {
        await this.removeWorktree(specId)
        cleaned++
      }
    }
    return cleaned
  }
}
```

### Task 2: Git Status Component

```typescript
// src/renderer/components/git/GitStatusPanel.tsx
import { useEffect, useState } from 'react'
import { GitBranch, GitCommit, GitMerge, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GitStatus {
  branch: string
  ahead: number
  behind: number
  staged: number
  modified: number
  untracked: number
  conflicts: string[]
}

export function GitStatusPanel({ specId }: { specId?: string }) {
  const [status, setStatus] = useState<GitStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStatus = async () => {
      setLoading(true)
      const result = await window.electronAPI.getGitStatus(specId)
      setStatus(result)
      setLoading(false)
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 5000)
    return () => clearInterval(interval)
  }, [specId])

  if (loading || !status) {
    return <div className="animate-pulse h-8 bg-slate-700 rounded" />
  }

  const hasConflicts = status.conflicts.length > 0

  return (
    <div className={cn(
      'flex items-center gap-4 px-3 py-2 rounded-lg text-sm',
      hasConflicts ? 'bg-red-900/50' : 'bg-slate-800'
    )}>
      <div className="flex items-center gap-2">
        <GitBranch className="w-4 h-4 text-blue-400" />
        <span className="font-medium text-white">{status.branch}</span>
      </div>

      {(status.ahead > 0 || status.behind > 0) && (
        <div className="flex items-center gap-2 text-slate-400">
          {status.ahead > 0 && <span>↑{status.ahead}</span>}
          {status.behind > 0 && <span>↓{status.behind}</span>}
        </div>
      )}

      <div className="flex items-center gap-3 text-slate-400">
        {status.staged > 0 && (
          <span className="text-emerald-400">+{status.staged} staged</span>
        )}
        {status.modified > 0 && (
          <span className="text-amber-400">~{status.modified} modified</span>
        )}
        {status.untracked > 0 && (
          <span className="text-slate-500">?{status.untracked} untracked</span>
        )}
      </div>

      {hasConflicts && (
        <div className="flex items-center gap-1 text-red-400">
          <AlertCircle className="w-4 h-4" />
          <span>{status.conflicts.length} conflicts</span>
        </div>
      )}
    </div>
  )
}
```

### Task 3: Commit History Component

```typescript
// src/renderer/components/git/CommitHistory.tsx
import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { GitCommit, ChevronRight, FileCode } from 'lucide-react'
import { ScrollArea } from '@/components/ui'

interface Commit {
  hash: string
  message: string
  author: string
  date: Date
  files: string[]
}

export function CommitHistory({ branch, specId }: { branch: string; specId?: string }) {
  const [commits, setCommits] = useState<Commit[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    window.electronAPI.getCommitHistory(branch, 50).then(setCommits)
  }, [branch])

  return (
    <ScrollArea className="h-96">
      <div className="space-y-1 p-2">
        {commits.map(commit => (
          <div key={commit.hash} className="rounded-lg hover:bg-slate-800">
            <button
              onClick={() => setExpanded(expanded === commit.hash ? null : commit.hash)}
              className="w-full flex items-start gap-3 p-3 text-left"
            >
              <GitCommit className="w-4 h-4 mt-1 text-blue-400 flex-shrink-0" />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-slate-500">
                    {commit.hash.substring(0, 7)}
                  </span>
                  <span className="text-xs text-slate-500">
                    {formatDistanceToNow(commit.date, { addSuffix: true })}
                  </span>
                </div>

                <p className="text-white text-sm truncate mt-1">
                  {commit.message}
                </p>

                <p className="text-xs text-slate-500 mt-1">
                  {commit.author} • {commit.files.length} files
                </p>
              </div>

              <ChevronRight
                className={`w-4 h-4 text-slate-500 transition-transform ${
                  expanded === commit.hash ? 'rotate-90' : ''
                }`}
              />
            </button>

            {expanded === commit.hash && (
              <div className="px-10 pb-3 space-y-1">
                {commit.files.map(file => (
                  <div
                    key={file}
                    className="flex items-center gap-2 text-xs text-slate-400"
                  >
                    <FileCode className="w-3 h-3" />
                    <span className="font-mono">{file}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
```

### Task 4: Worktree Manager Component

```typescript
// src/renderer/components/git/WorktreeManager.tsx
import { useState, useEffect } from 'react'
import { FolderGit2, Trash2, RefreshCw, GitMerge } from 'lucide-react'
import { Button, Tooltip } from '@/components/ui'
import { formatDistanceToNow } from 'date-fns'

interface Worktree {
  path: string
  branch: string
  specId: string
  status: 'active' | 'completed' | 'failed'
  createdAt: Date
}

export function WorktreeManager() {
  const [worktrees, setWorktrees] = useState<Worktree[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    refreshWorktrees()
  }, [])

  const refreshWorktrees = async () => {
    setLoading(true)
    const trees = await window.electronAPI.getWorktrees()
    setWorktrees(trees)
    setLoading(false)
  }

  const handleCleanup = async (specId: string) => {
    await window.electronAPI.removeWorktree(specId)
    refreshWorktrees()
  }

  const handleMerge = async (specId: string) => {
    const result = await window.electronAPI.mergeWorktree(specId)
    if (result.success) {
      refreshWorktrees()
    } else {
      // Show conflict dialog
    }
  }

  const handleCleanupAll = async () => {
    const completed = worktrees.filter(w => w.status === 'completed')
    for (const wt of completed) {
      await window.electronAPI.removeWorktree(wt.specId)
    }
    refreshWorktrees()
  }

  const statusColors = {
    active: 'text-blue-400',
    completed: 'text-emerald-400',
    failed: 'text-red-400'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white">Git Worktrees</h3>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={refreshWorktrees}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleCleanupAll}>
            Cleanup Completed
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {worktrees.map(wt => (
          <div
            key={wt.specId}
            className="flex items-center gap-4 p-3 bg-slate-800 rounded-lg"
          >
            <FolderGit2 className="w-5 h-5 text-amber-400" />

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-white">{wt.specId}</span>
                <span className={`text-xs ${statusColors[wt.status]}`}>
                  {wt.status}
                </span>
              </div>
              <div className="text-xs text-slate-500">
                {wt.branch} • {formatDistanceToNow(wt.createdAt, { addSuffix: true })}
              </div>
            </div>

            <div className="flex gap-1">
              {wt.status === 'completed' && (
                <Tooltip content="Merge to main">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMerge(wt.specId)}
                  >
                    <GitMerge className="w-4 h-4" />
                  </Button>
                </Tooltip>
              )}
              <Tooltip content="Remove worktree">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCleanup(wt.specId)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </Tooltip>
            </div>
          </div>
        ))}
      </div>

      {worktrees.length === 0 && !loading && (
        <div className="text-center py-8 text-slate-500">
          No active worktrees
        </div>
      )}
    </div>
  )
}
```

### Task 5: Conflict Resolution Dialog

```typescript
// src/renderer/components/git/ConflictDialog.tsx
import { Dialog, Button, ScrollArea } from '@/components/ui'
import { AlertTriangle, FileWarning, ExternalLink } from 'lucide-react'

interface Props {
  open: boolean
  specId: string
  conflicts: string[]
  onResolve: () => void
  onAbort: () => void
  onClose: () => void
}

export function ConflictDialog({
  open,
  specId,
  conflicts,
  onResolve,
  onAbort,
  onClose
}: Props) {
  const handleOpenInEditor = (file: string) => {
    window.electronAPI.openInEditor(file)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <Dialog.Content className="max-w-lg">
        <Dialog.Title className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Merge Conflicts Detected
        </Dialog.Title>

        <div className="py-4 space-y-4">
          <p className="text-slate-300">
            The merge for <strong>{specId}</strong> has conflicts that need
            to be resolved manually.
          </p>

          <div className="bg-slate-800 rounded-lg p-3">
            <h4 className="text-sm font-medium text-slate-400 mb-2">
              Conflicting Files ({conflicts.length})
            </h4>
            <ScrollArea className="max-h-48">
              <div className="space-y-1">
                {conflicts.map(file => (
                  <div
                    key={file}
                    className="flex items-center justify-between py-1"
                  >
                    <div className="flex items-center gap-2">
                      <FileWarning className="w-4 h-4 text-amber-500" />
                      <span className="font-mono text-sm text-white">{file}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenInEditor(file)}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <p className="text-sm text-slate-500">
            Resolve conflicts in your editor, then click "Mark Resolved" to
            continue the merge.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onAbort}>
            Abort Merge
          </Button>
          <Button onClick={onResolve}>
            Mark Resolved
          </Button>
        </div>
      </Dialog.Content>
    </Dialog>
  )
}
```

## Branch Naming Convention

| Pattern | Example |
|---------|---------|
| SPEC branch | spec/spec-auth-001 |
| Feature branch | feature/login-flow |
| Fix branch | fix/session-crash |

## Risk Analysis

| Risk | Mitigation |
|------|------------|
| Worktree corruption | Health checks, cleanup |
| Merge conflicts | Detection, manual resolution |
| Branch proliferation | Auto-cleanup policy |

## Success Criteria

- Worktrees created per SPEC
- Branches managed correctly
- Commit history displayed
- Conflicts detected and resolved
- Cleanup works properly
