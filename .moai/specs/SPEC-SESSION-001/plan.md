# Implementation Plan: SPEC-SESSION-001

## Overview

Create the parallel execution engine with session management and state stores.

## Task Breakdown

### Task 1: Create Session Manager Service

```typescript
// src/main/services/session-manager.service.ts
import { EventEmitter } from 'events'
import { ClaudeSession } from './claude-session'
import { WorktreeManagerService } from './worktree-manager.service'
import type { ExecutionPlan, Wave, SessionInfo } from '@/shared/types'

export class SessionManagerService extends EventEmitter {
  private sessions = new Map<string, ClaudeSession>()
  private worktreeManager = new WorktreeManagerService()
  private maxParallel = 10
  private currentWave = 0
  private isRunning = false

  async startExecution(plan: ExecutionPlan): Promise<void> {
    this.isRunning = true
    this.currentWave = 0

    for (const wave of plan.waves) {
      if (!this.isRunning) break

      this.emit('waveStarted', { waveNumber: wave.waveNumber })
      await this.executeWave(wave)
      this.emit('waveCompleted', { waveNumber: wave.waveNumber })

      this.currentWave++
    }

    this.emit('executionComplete')
  }

  private async executeWave(wave: Wave): Promise<void> {
    const batches = this.batchSpecs(wave.specs, this.maxParallel)

    for (const batch of batches) {
      const promises = batch.map(spec => this.executeSpec(spec))
      await Promise.allSettled(promises)
    }
  }

  async stopExecution(): Promise<void> {
    this.isRunning = false
    for (const session of this.sessions.values()) {
      session.terminate()
    }
    this.sessions.clear()
  }
}
```

### Task 2: Create Claude Session Class

```typescript
// src/main/services/claude-session.ts
import * as pty from 'node-pty'
import { EventEmitter } from 'events'
import type { SessionInfo, SessionStatus } from '@/shared/types'

export class ClaudeSession extends EventEmitter {
  private ptyProcess: pty.IPty | null = null
  private output: string[] = []
  private status: SessionStatus = 'idle'

  constructor(
    public readonly id: string,
    public readonly specId: string,
    public readonly worktreePath: string
  ) {
    super()
  }

  async start(): Promise<void> {
    this.status = 'running'
    this.emit('statusChange', this.status)

    this.ptyProcess = pty.spawn('claude', ['code', '/moai:2-run', this.specId], {
      name: 'xterm-256color',
      cwd: this.worktreePath,
      env: process.env
    })

    this.ptyProcess.onData((data) => {
      this.output.push(data)
      this.emit('output', data)
      this.checkCompletion(data)
    })

    this.ptyProcess.onExit(({ exitCode }) => {
      this.status = exitCode === 0 ? 'completed' : 'failed'
      this.emit('statusChange', this.status)
    })
  }

  terminate(): void {
    this.ptyProcess?.kill()
    this.status = 'cancelled'
    this.emit('statusChange', this.status)
  }

  getInfo(): SessionInfo {
    return {
      id: this.id,
      specId: this.specId,
      status: this.status,
      worktreePath: this.worktreePath,
      output: this.output
    }
  }
}
```

### Task 3: Create Session Panel Component

```typescript
// src/renderer/components/main/SessionPanel.tsx
import { useSessionStore } from '@/stores/sessionStore'
import { Card, Button, Progress } from '@/components/ui'

export default function SessionPanel() {
  const { sessions, stopSession } = useSessionStore()

  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      {sessions.map(session => (
        <SessionCard
          key={session.id}
          session={session}
          onStop={() => stopSession(session.id)}
        />
      ))}
    </div>
  )
}

function SessionCard({ session, onStop }) {
  return (
    <Card className="p-3">
      <div className="flex justify-between items-center">
        <span className="font-mono text-sm">{session.specId}</span>
        <StatusBadge status={session.status} />
      </div>
      <div className="mt-2 h-24 bg-slate-800 rounded text-xs font-mono p-2 overflow-auto">
        {session.output.slice(-10).join('')}
      </div>
      <Button variant="ghost" size="sm" onClick={onStop}>
        Stop
      </Button>
    </Card>
  )
}
```

### Task 4: Create Session Store

```typescript
// src/renderer/stores/sessionStore.ts
import { create } from 'zustand'
import type { SessionInfo, SpecInfo, ExecutionPlan } from '@/shared/types'

interface SessionState {
  specs: SpecInfo[]
  sessions: SessionInfo[]
  plan: ExecutionPlan | null
  currentWave: number
  isExecuting: boolean

  // Actions
  setSpecs: (specs: SpecInfo[]) => void
  setPlan: (plan: ExecutionPlan) => void
  startExecution: () => Promise<void>
  stopExecution: () => Promise<void>
  updateSession: (session: SessionInfo) => void
}

export const useSessionStore = create<SessionState>((set, get) => ({
  specs: [],
  sessions: [],
  plan: null,
  currentWave: 0,
  isExecuting: false,

  setSpecs: (specs) => set({ specs }),
  setPlan: (plan) => set({ plan }),

  startExecution: async () => {
    const { plan } = get()
    if (!plan) return

    set({ isExecuting: true })
    await window.electronAPI.startExecution(plan)
  },

  stopExecution: async () => {
    await window.electronAPI.stopExecution()
    set({ isExecuting: false })
  },

  updateSession: (session) => set((state) => ({
    sessions: state.sessions.map(s =>
      s.id === session.id ? session : s
    )
  }))
}))
```

### Task 5: Create useSession Hook

```typescript
// src/renderer/hooks/useSession.ts
import { useEffect } from 'react'
import { useSessionStore } from '@/stores/sessionStore'

export function useSession() {
  const store = useSessionStore()

  useEffect(() => {
    const unsubscribe = window.electronAPI.onSessionUpdate((_, sessions) => {
      sessions.forEach(store.updateSession)
    })

    return unsubscribe
  }, [])

  return store
}
```

### Task 6: Create useProgress Hook

```typescript
// src/renderer/hooks/useProgress.ts
import { useMemo } from 'react'
import { useSessionStore } from '@/stores/sessionStore'

export function useProgress() {
  const { specs, sessions } = useSessionStore()

  return useMemo(() => {
    const completed = specs.filter(s => s.status === 'completed').length
    const running = specs.filter(s => s.status === 'running').length
    const failed = specs.filter(s => s.status === 'failed').length
    const pending = specs.filter(s => s.status === 'pending').length
    const total = specs.length

    return {
      completed,
      running,
      failed,
      pending,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    }
  }, [specs, sessions])
}
```

## File Structure

```
src/
├── main/services/
│   ├── session-manager.service.ts  (~200 lines)
│   └── claude-session.ts           (~120 lines)
└── renderer/
    ├── components/main/
    │   └── SessionPanel.tsx        (~100 lines)
    ├── stores/
    │   └── sessionStore.ts         (~80 lines)
    └── hooks/
        ├── useSession.ts           (~30 lines)
        └── useProgress.ts          (~30 lines)
```

## Execution Flow

```
1. User clicks "Execute"
2. SessionManager receives ExecutionPlan
3. For each Wave:
   a. Create worktrees for all SPECs in wave
   b. Spawn ClaudeSession for each (max 10 parallel)
   c. Wait for all to complete
   d. Emit wave completion event
4. Emit execution complete event
```

## Risk Analysis

| Risk | Mitigation |
|------|------------|
| Memory from output | Limit stored lines |
| Process zombies | Proper cleanup on terminate |
| Race conditions | Atomic state updates |
| Large wave size | Batch into groups of 10 |

## Success Criteria

- Sessions spawn and execute correctly
- Output is captured in real-time
- Wave execution respects order
- Max parallel limit is enforced
- Stop command terminates all sessions
- State updates propagate to UI
