---
id: SPEC-HOTKEYS-001
version: "1.0.0"
status: "draft"
created: "2026-01-04"
updated: "2026-01-04"
author: "MoAI-ADK"
priority: "LOW"
---

## HISTORY

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-01-04 | MoAI-ADK | Initial SPEC creation |

# SPEC-HOTKEYS-001: Keyboard Shortcuts

## Overview

Implement comprehensive keyboard shortcuts for power users to navigate and control the application efficiently without mouse interaction.

## Requirements

### REQ-001: Global Shortcuts (Ubiquitous)

The system shall support global keyboard shortcuts:
- Cmd/Ctrl + S: Scan for SPECs
- Cmd/Ctrl + E: Execute selected plan
- Cmd/Ctrl + ,: Open Settings
- Cmd/Ctrl + Q: Quit application
- Escape: Close current dialog

### REQ-002: Navigation Shortcuts (Ubiquitous)

The system shall support navigation shortcuts:
- Cmd/Ctrl + 1: Focus SPEC list
- Cmd/Ctrl + 2: Focus Terminal
- Cmd/Ctrl + 3: Focus Wave visualization
- Tab: Next focusable element
- Shift + Tab: Previous focusable element

### REQ-003: Execution Shortcuts (Ubiquitous)

The system shall support execution shortcuts:
- Cmd/Ctrl + Enter: Start execution
- Cmd/Ctrl + Shift + Enter: Stop all sessions
- Cmd/Ctrl + R: Refresh/rescan SPECs

### REQ-004: SPEC List Shortcuts (State-Driven)

When SPEC list is focused, the system shall support:
- Arrow Up/Down: Navigate SPECs
- Space: Toggle SPEC selection
- Enter: View SPEC details
- Cmd/Ctrl + A: Select all SPECs

### REQ-005: Shortcut Customization (Optional-Feature)

The Settings dialog shall allow shortcut customization:
- View all shortcuts
- Change key bindings
- Reset to defaults
- Conflict detection

### REQ-006: Shortcut Help (Ubiquitous)

The system shall display shortcut help:
- Cmd/Ctrl + /: Show shortcut overlay
- Shortcuts grouped by category
- Platform-specific modifier display

## Technical Constraints

- Handle platform differences (Cmd vs Ctrl)
- No conflicts with OS shortcuts
- Work even when dialogs are open

## Dependencies

- SPEC-MAINVIEW-001 (Focus management)
- SPEC-INTEGRATION-001 (Settings Dialog)

## Acceptance Criteria

See acceptance.md for detailed Given/When/Then scenarios.
