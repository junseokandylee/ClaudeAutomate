# Implementation Plan: SPEC-PERSISTENCE-001

## Overview

Implement robust state persistence for crash recovery and session restoration.

## Task Breakdown

### Task 1: State Persistence Service

```typescript
// src/main/services/state-persistence.service.ts
import { app } from 'electron'
import fs from 'fs/promises'
import path from 'path'
import { z } from 'zod'

const ExecutionStateSchema = z.object({
  version: z.string(),
  startedAt: z.string(),
  updatedAt: z.string(),
  projectPath: z.string(),
  plan: z.object({
    waves: z.array(z.any()),
    totalSpecs: z.number()
  }),
  completedSpecs: z.array(z.string()),
  failedSpecs: z.array(z.string()),
  currentWave: z.number(),
  sessions: z.array(z.object({
    id: z.string(),
    specId: z.string(),
    status: z.string(),
    outputPath: z.string()
  }))
})

type ExecutionState = z.infer<typeof ExecutionStateSchema>

export class StatePersistenceService {
  private statePath: string
  private autoSaveInterval: NodeJS.Timer | null = null
  private currentState: ExecutionState | null = null
  private dirty = false

  constructor() {
    this.statePath = path.join(app.getPath('userData'), 'execution-state.json')
  }

  async startAutoSave(intervalMs = 30000): Promise<void> {
    this.autoSaveInterval = setInterval(() => {
      if (this.dirty && this.currentState) {
        this.save(this.currentState).catch(console.error)
      }
    }, intervalMs)
  }

  stopAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval)
      this.autoSaveInterval = null
    }
  }

  async save(state: ExecutionState): Promise<void> {
    state.updatedAt = new Date().toISOString()
    this.currentState = state

    // Write atomically
    const tempPath = `${this.statePath}.tmp`
    await fs.writeFile(tempPath, JSON.stringify(state, null, 2))
    await fs.rename(tempPath, this.statePath)

    this.dirty = false
  }

  async load(): Promise<ExecutionState | null> {
    try {
      const data = await fs.readFile(this.statePath, 'utf-8')
      const state = ExecutionStateSchema.parse(JSON.parse(data))
      this.currentState = state
      return state
    } catch {
      return null
    }
  }

  async hasIncompleteExecution(): Promise<boolean> {
    const state = await this.load()
    if (!state) return false

    const hasIncomplete = state.completedSpecs.length + state.failedSpecs.length
      < state.plan.totalSpecs

    return hasIncomplete
  }

  async getRemainingSpecs(): Promise<string[]> {
    const state = await this.load()
    if (!state) return []

    const completed = new Set([...state.completedSpecs, ...state.failedSpecs])
    return state.plan.waves
      .flatMap(w => w.specs)
      .filter((s: { id: string }) => !completed.has(s.id))
      .map((s: { id: string }) => s.id)
  }

  markSpecCompleted(specId: string): void {
    if (this.currentState) {
      this.currentState.completedSpecs.push(specId)
      this.dirty = true
    }
  }

  markSpecFailed(specId: string): void {
    if (this.currentState) {
      this.currentState.failedSpecs.push(specId)
      this.dirty = true
    }
  }

  async clear(): Promise<void> {
    await fs.unlink(this.statePath).catch(() => {})
    this.currentState = null
    this.dirty = false
  }
}
```

### Task 2: Session Output Persistence

```typescript
// src/main/services/session-output.service.ts
import fs from 'fs'
import path from 'path'
import { app } from 'electron'

export class SessionOutputService {
  private outputDir: string

  constructor() {
    this.outputDir = path.join(app.getPath('userData'), 'session-outputs')
    fs.mkdirSync(this.outputDir, { recursive: true })
  }

  getOutputPath(sessionId: string): string {
    return path.join(this.outputDir, `${sessionId}.log`)
  }

  createOutputStream(sessionId: string): fs.WriteStream {
    const outputPath = this.getOutputPath(sessionId)
    return fs.createWriteStream(outputPath, { flags: 'a' })
  }

  async readOutput(sessionId: string): Promise<string> {
    const outputPath = this.getOutputPath(sessionId)
    try {
      return await fs.promises.readFile(outputPath, 'utf-8')
    } catch {
      return ''
    }
  }

  async getLastLines(sessionId: string, count = 100): Promise<string[]> {
    const content = await this.readOutput(sessionId)
    const lines = content.split('\n')
    return lines.slice(-count)
  }

  async cleanOldSessions(maxAgeDays = 7): Promise<number> {
    const files = await fs.promises.readdir(this.outputDir)
    const now = Date.now()
    const maxAge = maxAgeDays * 24 * 60 * 60 * 1000
    let deletedCount = 0

    for (const file of files) {
      const filePath = path.join(this.outputDir, file)
      const stats = await fs.promises.stat(filePath)

      if (now - stats.mtimeMs > maxAge) {
        await fs.promises.unlink(filePath)
        deletedCount++
      }
    }

    return deletedCount
  }

  async getTotalSize(): Promise<number> {
    const files = await fs.promises.readdir(this.outputDir)
    let totalSize = 0

    for (const file of files) {
      const filePath = path.join(this.outputDir, file)
      const stats = await fs.promises.stat(filePath)
      totalSize += stats.size
    }

    return totalSize
  }
}
```

### Task 3: App State Persistence

```typescript
// src/main/services/app-state.service.ts
import Store from 'electron-store'

interface AppState {
  window: {
    x: number
    y: number
    width: number
    height: number
    maximized: boolean
  }
  lastProject: string | null
  recentProjects: string[]
  panelLayout: {
    specListWidth: number
    terminalHeight: number
  }
  ui: {
    theme: 'dark' | 'light' | 'system'
    sidebarCollapsed: boolean
    showWaveVisualization: boolean
  }
}

export class AppStateService {
  private store: Store<AppState>

  constructor() {
    this.store = new Store<AppState>({
      name: 'app-state',
      defaults: {
        window: {
          x: 100,
          y: 100,
          width: 1400,
          height: 900,
          maximized: false
        },
        lastProject: null,
        recentProjects: [],
        panelLayout: {
          specListWidth: 300,
          terminalHeight: 300
        },
        ui: {
          theme: 'dark',
          sidebarCollapsed: false,
          showWaveVisualization: true
        }
      }
    })
  }

  getWindowState(): AppState['window'] {
    return this.store.get('window')
  }

  setWindowState(state: Partial<AppState['window']>): void {
    this.store.set('window', { ...this.getWindowState(), ...state })
  }

  getLastProject(): string | null {
    return this.store.get('lastProject')
  }

  setLastProject(projectPath: string): void {
    this.store.set('lastProject', projectPath)
    this.addRecentProject(projectPath)
  }

  addRecentProject(projectPath: string): void {
    const recent = this.store.get('recentProjects')
    const updated = [projectPath, ...recent.filter(p => p !== projectPath)].slice(0, 10)
    this.store.set('recentProjects', updated)
  }

  getRecentProjects(): string[] {
    return this.store.get('recentProjects')
  }

  getPanelLayout(): AppState['panelLayout'] {
    return this.store.get('panelLayout')
  }

  setPanelLayout(layout: Partial<AppState['panelLayout']>): void {
    this.store.set('panelLayout', { ...this.getPanelLayout(), ...layout })
  }

  getUIState(): AppState['ui'] {
    return this.store.get('ui')
  }

  setUIState(state: Partial<AppState['ui']>): void {
    this.store.set('ui', { ...this.getUIState(), ...state })
  }
}
```

### Task 4: Recovery Prompt Dialog

```typescript
// src/renderer/components/dialogs/RecoveryPrompt.tsx
import { Dialog, Button } from '@/components/ui'

interface Props {
  open: boolean
  previousState: {
    projectPath: string
    completedSpecs: number
    totalSpecs: number
    lastUpdated: string
  }
  onResume: () => void
  onDiscard: () => void
  onClose: () => void
}

export function RecoveryPrompt({
  open,
  previousState,
  onResume,
  onDiscard,
  onClose
}: Props) {
  const remainingSpecs = previousState.totalSpecs - previousState.completedSpecs

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <Dialog.Content className="max-w-md">
        <Dialog.Title>Resume Previous Execution?</Dialog.Title>

        <div className="py-4 space-y-4">
          <p className="text-slate-300">
            An incomplete execution was found from a previous session.
          </p>

          <div className="bg-slate-800 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Project:</span>
              <span className="text-white">{previousState.projectPath}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Progress:</span>
              <span className="text-white">
                {previousState.completedSpecs} / {previousState.totalSpecs} SPECs
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Remaining:</span>
              <span className="text-amber-400">{remainingSpecs} SPECs</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Last Updated:</span>
              <span className="text-white">
                {new Date(previousState.lastUpdated).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onDiscard}>
            Discard
          </Button>
          <Button onClick={onResume}>
            Resume Execution
          </Button>
        </div>
      </Dialog.Content>
    </Dialog>
  )
}
```

### Task 5: Window State Handler

```typescript
// src/main/handlers/window-state.handler.ts
import { BrowserWindow } from 'electron'
import { AppStateService } from '../services/app-state.service'

export function setupWindowStateHandlers(
  window: BrowserWindow,
  appState: AppStateService
): void {
  // Restore window state
  const savedState = appState.getWindowState()
  window.setBounds({
    x: savedState.x,
    y: savedState.y,
    width: savedState.width,
    height: savedState.height
  })

  if (savedState.maximized) {
    window.maximize()
  }

  // Save on changes
  let saveTimeout: NodeJS.Timeout | null = null

  const saveWindowState = () => {
    if (saveTimeout) clearTimeout(saveTimeout)

    saveTimeout = setTimeout(() => {
      const bounds = window.getBounds()
      appState.setWindowState({
        ...bounds,
        maximized: window.isMaximized()
      })
    }, 500)
  }

  window.on('resize', saveWindowState)
  window.on('move', saveWindowState)
  window.on('maximize', () => appState.setWindowState({ maximized: true }))
  window.on('unmaximize', () => appState.setWindowState({ maximized: false }))
}
```

## State Files

| File | Purpose | Location |
|------|---------|----------|
| execution-state.json | Execution progress | userData |
| app-state.json | Window/UI state | userData |
| session-outputs/*.log | Session logs | userData |

## Risk Analysis

| Risk | Mitigation |
|------|------------|
| Corruption during write | Atomic writes with temp file |
| Large state files | Size limits, cleanup |
| Stale state | Version tracking |

## Success Criteria

- State persists across restarts
- Crash recovery prompts user
- Session outputs are preserved
- Window position remembered
- Auto-save works reliably
