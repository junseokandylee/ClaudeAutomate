---
id: SPEC-MAINVIEW-001
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

# SPEC-MAINVIEW-001: Main View Components (Phase 9)

## Overview

Create the primary application UI components including the terminal, SPEC list, wave visualization, and progress overview.

## Requirements

### REQ-001: MainView Container (Ubiquitous)

The system shall have MainView.tsx that:
- Implements the main application layout
- Contains Terminal, SpecList, and control panels
- Uses CSS Grid for responsive layout
- Manages view state transitions

### REQ-002: Terminal Component (Ubiquitous)

The system shall have Terminal.tsx that:
- Embeds xterm.js terminal emulator
- Supports Claude Code CLI input/output
- Auto-fits to container size
- Applies custom theme colors
- Handles terminal resize events

### REQ-003: SpecList Component (Ubiquitous)

The system shall have SpecList.tsx that:
- Displays list of discovered SPECs
- Shows status indicator for each SPEC
- Supports filtering and sorting
- Allows SPEC selection for details
- Updates in real-time during execution

### REQ-004: WaveVisualization Component (Ubiquitous)

The system shall have WaveVisualization.tsx that:
- Displays execution waves graphically
- Shows dependencies between SPECs
- Animates current wave execution
- Highlights completed/active/pending waves
- Uses Framer Motion for animations

### REQ-005: ProgressOverview Component (Ubiquitous)

The system shall have ProgressOverview.tsx that:
- Shows overall execution progress
- Displays completed/running/pending counts
- Calculates estimated time remaining
- Shows success/failure statistics

### REQ-006: StatusBar Component (Ubiquitous)

The system shall have StatusBar.tsx that:
- Displays current application status
- Shows active session count
- Displays current locale
- Provides quick settings access

## Technical Constraints

- xterm.js with fit addon for terminal
- Framer Motion for all animations
- Real-time updates via IPC events
- Responsive to window resizing

## Dependencies

- SPEC-UI-001 (UI Components)
- SPEC-SERVICES-001 (Core Services)
- SPEC-PRELOAD-001 (IPC Bridge)

## Acceptance Criteria

See acceptance.md for detailed Given/When/Then scenarios.
