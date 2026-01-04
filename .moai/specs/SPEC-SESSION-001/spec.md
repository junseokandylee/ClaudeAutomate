---
id: SPEC-SESSION-001
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

# SPEC-SESSION-001: Session Management (Phase 10)

## Overview

Create the parallel execution engine including session manager, individual Claude sessions, and state management stores.

## Requirements

### REQ-001: Session Manager Service (Ubiquitous)

The system shall have session-manager.service.ts that:
- Orchestrates parallel Claude sessions
- Executes SPECs wave by wave
- Respects maximum parallel session limit (10)
- Tracks session status and output
- Handles session completion and failure

### REQ-002: Claude Session Class (Ubiquitous)

The system shall have claude-session.ts that:
- Spawns Claude Code CLI process
- Captures stdout and stderr
- Sends input commands
- Detects completion markers
- Handles process termination

### REQ-003: Session Panel Component (Ubiquitous)

The system shall have SessionPanel.tsx that:
- Displays active session cards
- Shows session output in mini-terminal
- Provides stop button per session
- Indicates session status visually

### REQ-004: Session Store (Ubiquitous)

The system shall have sessionStore.ts using Zustand:
- Stores active sessions array
- Stores execution plan
- Provides actions: startExecution, stopExecution, updateSession
- Syncs with Main process via IPC

### REQ-005: useSession Hook (Ubiquitous)

The system shall have useSession.ts hook that:
- Subscribes to session updates
- Provides session control methods
- Handles cleanup on unmount

### REQ-006: useProgress Hook (Ubiquitous)

The system shall have useProgress.ts hook that:
- Calculates overall progress percentage
- Counts completed/running/pending SPECs
- Estimates remaining time

### REQ-007: Wave Execution (Ubiquitous)

The session manager shall execute waves:
- Wait for all SPECs in wave to complete
- Only start next wave when current completes
- Handle partial wave failures gracefully
- Cap parallel sessions at configured maximum

## Technical Constraints

- Use node-pty for pseudo-terminal
- Non-blocking async execution
- Memory management for long outputs
- Graceful shutdown handling

## Dependencies

- SPEC-SERVICES-001 (Core Services)
- SPEC-PRELOAD-001 (IPC Bridge)
- SPEC-MAINVIEW-001 (Main View)

## Acceptance Criteria

See acceptance.md for detailed Given/When/Then scenarios.
