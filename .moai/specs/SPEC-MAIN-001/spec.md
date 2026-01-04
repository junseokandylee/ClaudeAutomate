---
id: SPEC-MAIN-001
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

# SPEC-MAIN-001: Main Process Foundation (Phase 3)

## Overview

Create the Electron Main process entry point with window management and IPC handler infrastructure.

## Requirements

### REQ-001: Main Entry Point (Ubiquitous)

The system shall have src/main/index.ts that:
- Creates the main BrowserWindow with appropriate settings
- Configures window properties (size, frame, webPreferences)
- Loads the renderer HTML file
- Handles app lifecycle events (ready, window-all-closed, activate)
- Enables context isolation and nodeIntegration security

### REQ-002: Window Configuration (Ubiquitous)

The BrowserWindow shall be configured with:
- Initial size: 1400x900 pixels
- Minimum size: 1024x768 pixels
- Frame: true (standard window chrome)
- webPreferences.contextIsolation: true
- webPreferences.nodeIntegration: false
- webPreferences.preload: path to preload script
- Dark background color matching theme

### REQ-003: IPC Handler Registration (Ubiquitous)

The system shall have src/main/ipc/index.ts that:
- Registers all IPC handlers from handlers.ts
- Organizes handlers by category (bootstrap, spec, session, config)
- Uses ipcMain.handle for async operations
- Uses ipcMain.on for event-based communication

### REQ-004: IPC Handler Implementations (Ubiquitous)

The system shall have src/main/ipc/handlers.ts with:
- Bootstrap handlers: check dependency status
- Spec handlers: scan, analyze, list operations
- Session handlers: start, stop, status updates
- Config handlers: get, set configuration values

### REQ-005: Error Handling (Event-Driven)

When an IPC handler throws an error, the system shall:
- Catch the error and format it appropriately
- Return structured error response to Renderer
- Log errors to console with context

## Technical Constraints

- Must use contextBridge for secure IPC
- No direct Node.js access from Renderer
- All file operations through IPC only

## Dependencies

- SPEC-SETUP-001 (Project Foundation)
- SPEC-SHARED-001 (Types and Constants)

## Acceptance Criteria

See acceptance.md for detailed Given/When/Then scenarios.
