# Implementation Plan: SPEC-MAIN-001

## Overview

Create the Electron Main process with window management and IPC infrastructure.

## Task Breakdown

### Task 1: Create Main Entry Point (index.ts)

```typescript
// src/main/index.ts structure
import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { registerIpcHandlers } from './ipc'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    backgroundColor: '#0F172A', // Slate background
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  })

  // Load renderer
  // Register IPC handlers
}
```

### Task 2: Create IPC Index (ipc/index.ts)

Register all IPC handlers organized by category:
- Bootstrap handlers
- Spec handlers
- Session handlers
- Config handlers

### Task 3: Create IPC Handlers (ipc/handlers.ts)

Implement handler functions:

```typescript
// Bootstrap handlers
export async function handleBootstrapCheck(): Promise<BootstrapResult>

// Spec handlers
export async function handleSpecScan(projectPath: string): Promise<SpecInfo[]>
export async function handleSpecAnalyze(specs: SpecInfo[]): Promise<ExecutionPlan>

// Session handlers
export async function handleSessionStart(plan: ExecutionPlan): Promise<void>
export async function handleSessionStop(): Promise<void>

// Config handlers
export async function handleConfigGet(key: string): Promise<any>
export async function handleConfigSet(key: string, value: any): Promise<void>
```

## File Structure

```
src/main/
├── index.ts           # Main entry point
└── ipc/
    ├── index.ts       # Handler registration
    └── handlers.ts    # Handler implementations
```

## Window Configuration Details

| Property | Value | Reason |
|----------|-------|--------|
| width | 1400 | Comfortable for terminal + panels |
| height | 900 | Standard 16:9 aspect |
| minWidth | 1024 | Minimum usable size |
| minHeight | 768 | Minimum usable size |
| backgroundColor | #0F172A | Slate dark background |
| contextIsolation | true | Security requirement |
| nodeIntegration | false | Security requirement |

## Risk Analysis

| Risk | Mitigation |
|------|------------|
| Security vulnerabilities | Strict context isolation |
| IPC type mismatches | Use shared types |
| Memory leaks | Proper cleanup on close |

## Success Criteria

- Electron app launches with correct window size
- IPC handlers are registered and respond
- Context isolation is properly configured
- Window responds to lifecycle events
