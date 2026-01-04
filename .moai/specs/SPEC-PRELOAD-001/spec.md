---
id: SPEC-PRELOAD-001
version: "1.0.0"
status: "draft"
created: "2026-01-04"
updated: "2026-01-04"
author: "MoAI-ADK"
priority: "HIGH"
---

## HISTORY

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-01-04 | MoAI-ADK | Initial SPEC creation |

# SPEC-PRELOAD-001: Preload Bridge (Phase 4)

## Overview

Create the preload script that exposes a secure API bridge between Main and Renderer processes using Electron's contextBridge.

## Requirements

### REQ-001: Context Bridge Setup (Ubiquitous)

The system shall have src/preload/index.ts that:
- Uses contextBridge.exposeInMainWorld to create 'electronAPI'
- Exposes typed IPC invoke methods
- Exposes typed IPC event listeners
- Does not expose any Node.js APIs directly

### REQ-002: Bootstrap API (Ubiquitous)

The exposed API shall include bootstrap methods:
- checkDependencies(): Promise<BootstrapResult>
- onBootstrapProgress(callback): void

### REQ-003: SPEC API (Ubiquitous)

The exposed API shall include SPEC methods:
- scanSpecs(projectPath: string): Promise<SpecInfo[]>
- analyzeSpecs(specs: SpecInfo[]): Promise<ExecutionPlan>
- onSpecStatus(callback): void

### REQ-004: Session API (Ubiquitous)

The exposed API shall include session methods:
- startExecution(plan: ExecutionPlan): Promise<void>
- stopExecution(): Promise<void>
- onSessionUpdate(callback): void
- onSessionOutput(callback): void

### REQ-005: Config API (Ubiquitous)

The exposed API shall include config methods:
- getConfig(key: string): Promise<any>
- setConfig(key: string, value: any): Promise<void>
- onConfigChange(callback): void

### REQ-006: Type Declarations (Ubiquitous)

The system shall have src/preload/index.d.ts that:
- Declares the ElectronAPI interface
- Extends the Window interface with electronAPI
- Provides complete TypeScript types for all exposed methods

## Technical Constraints

- No direct ipcRenderer exposure
- All methods must be typed
- Event listeners must support cleanup (removeListener)

## Dependencies

- SPEC-SETUP-001 (Project Foundation)
- SPEC-SHARED-001 (Types and Constants)
- SPEC-MAIN-001 (IPC Handlers)

## Acceptance Criteria

See acceptance.md for detailed Given/When/Then scenarios.
