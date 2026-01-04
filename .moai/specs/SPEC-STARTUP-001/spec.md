---
id: SPEC-STARTUP-001
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

# SPEC-STARTUP-001: Startup View & Bootstrap (Phase 7)

## Overview

Create the startup view that displays dependency check status and guides users through any missing installations.

## Requirements

### REQ-001: StartupView Component (Ubiquitous)

The system shall have StartupView.tsx that:
- Displays application logo and title
- Shows version number
- Contains DependencyCheck component
- Animates on initial render
- Transitions to MainView when bootstrap passes

### REQ-002: DependencyCheck Component (Ubiquitous)

The system shall have DependencyCheck.tsx that:
- Displays three dependency items (Claude, moai-adk, moai-worktree)
- Shows checking/installed/missing status for each
- Uses icons and colors to indicate status
- Provides installation guidance for missing dependencies

### REQ-003: Bootstrap Service (Ubiquitous)

The system shall have bootstrap.service.ts in Main process that:
- Checks if 'claude' CLI is available (which claude / where claude)
- Checks if 'moai-adk' is installed
- Checks if 'moai-worktree' is available
- Returns version information for each installed tool
- Returns path information for each tool

### REQ-004: Config Service (Ubiquitous)

The system shall have config.service.ts in Main process that:
- Uses electron-store for persistent storage
- Manages application configuration
- Provides get/set methods for config values
- Handles default values for unset keys

### REQ-005: Status Display (State-Driven)

When checking dependencies, the UI shall show:
- Spinner animation for "checking" state
- Green checkmark for "installed" state
- Red X icon for "missing" state
- Version number when installed

### REQ-006: Installation Guidance (Event-Driven)

When a dependency is missing, the system shall:
- Display installation instructions
- Provide clickable links to documentation
- Show platform-specific commands
- Allow retry after installation

## Technical Constraints

- Bootstrap check runs on app startup
- Must work on Windows, macOS, and Linux
- Use child_process.exec for CLI checks
- Non-blocking async checks

## Dependencies

- SPEC-MAIN-001 (Main Process Foundation)
- SPEC-PRELOAD-001 (Preload Bridge)
- SPEC-UI-001 (UI Components)

## Acceptance Criteria

See acceptance.md for detailed Given/When/Then scenarios.
