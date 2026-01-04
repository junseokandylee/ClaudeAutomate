# Implementation Plan: SPEC-PRELOAD-001

## Overview

Create the secure preload bridge using Electron's contextBridge API.

## Task Breakdown

### Task 1: Create Preload Script (index.ts)

```typescript
// src/preload/index.ts
import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '../shared/constants'

const electronAPI = {
  // Bootstrap
  checkDependencies: () => ipcRenderer.invoke(IPC_CHANNELS.BOOTSTRAP_CHECK),
  onBootstrapProgress: (callback) => {
    ipcRenderer.on(IPC_CHANNELS.BOOTSTRAP_PROGRESS, callback)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.BOOTSTRAP_PROGRESS, callback)
  },

  // Specs
  scanSpecs: (path) => ipcRenderer.invoke(IPC_CHANNELS.SPEC_SCAN, path),
  analyzeSpecs: (specs) => ipcRenderer.invoke(IPC_CHANNELS.SPEC_ANALYZE, specs),
  onSpecStatus: (callback) => { /* ... */ },

  // Sessions
  startExecution: (plan) => ipcRenderer.invoke(IPC_CHANNELS.SESSION_START, plan),
  stopExecution: () => ipcRenderer.invoke(IPC_CHANNELS.SESSION_STOP),
  onSessionUpdate: (callback) => { /* ... */ },
  onSessionOutput: (callback) => { /* ... */ },

  // Config
  getConfig: (key) => ipcRenderer.invoke(IPC_CHANNELS.CONFIG_GET, key),
  setConfig: (key, value) => ipcRenderer.invoke(IPC_CHANNELS.CONFIG_SET, key, value),
  onConfigChange: (callback) => { /* ... */ }
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
```

### Task 2: Create Type Declarations (index.d.ts)

```typescript
// src/preload/index.d.ts
import type { BootstrapResult, SpecInfo, ExecutionPlan, SessionInfo } from '../shared/types'

export interface ElectronAPI {
  // Bootstrap
  checkDependencies(): Promise<BootstrapResult>
  onBootstrapProgress(callback: (event: any, data: any) => void): () => void

  // Specs
  scanSpecs(projectPath: string): Promise<SpecInfo[]>
  analyzeSpecs(specs: SpecInfo[]): Promise<ExecutionPlan>
  onSpecStatus(callback: (event: any, data: any) => void): () => void

  // Sessions
  startExecution(plan: ExecutionPlan): Promise<void>
  stopExecution(): Promise<void>
  onSessionUpdate(callback: (event: any, sessions: SessionInfo[]) => void): () => void
  onSessionOutput(callback: (event: any, output: any) => void): () => void

  // Config
  getConfig(key: string): Promise<any>
  setConfig(key: string, value: any): Promise<void>
  onConfigChange(callback: (event: any, data: any) => void): () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
```

## File Structure

```
src/preload/
├── index.ts      # Context bridge implementation
└── index.d.ts    # TypeScript declarations
```

## API Method Categories

| Category | Methods | Purpose |
|----------|---------|---------|
| Bootstrap | checkDependencies, onBootstrapProgress | Dependency verification |
| Specs | scanSpecs, analyzeSpecs, onSpecStatus | SPEC management |
| Sessions | startExecution, stopExecution, onSessionUpdate, onSessionOutput | Parallel execution |
| Config | getConfig, setConfig, onConfigChange | Configuration |

## Security Considerations

- Never expose ipcRenderer directly
- Validate all data passed through bridge
- Use typed callbacks for events
- Support listener cleanup (memory leaks prevention)

## Risk Analysis

| Risk | Mitigation |
|------|------------|
| Type mismatches | Shared types between processes |
| Memory leaks | Return cleanup functions from listeners |
| Security holes | No direct ipcRenderer exposure |

## Success Criteria

- contextBridge exposes 'electronAPI' on window
- All methods are properly typed
- Event listeners support cleanup
- TypeScript recognizes window.electronAPI
