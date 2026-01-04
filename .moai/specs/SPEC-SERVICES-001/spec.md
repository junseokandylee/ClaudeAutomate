---
id: SPEC-SERVICES-001
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

# SPEC-SERVICES-001: Core Services (Phase 8)

## Overview

Create the core Main process services for SPEC scanning, AI dependency analysis, worktree management, and status polling.

## Requirements

### REQ-001: SPEC Scanner Service (Ubiquitous)

The system shall have spec-scanner.service.ts that:
- Scans project directory for SPEC files (.moai/specs/)
- Parses YAML frontmatter from spec.md files
- Extracts id, title, status, dependencies from each SPEC
- Returns array of SpecInfo objects
- Handles nested directory structures

### REQ-002: Dependency Analyzer Service (Ubiquitous)

The system shall have dependency-analyzer.service.ts that:
- Analyzes SPEC dependencies using AI
- Groups SPECs into execution waves based on dependencies
- Creates ExecutionPlan with wave ordering
- Calculates optimal parallelism for each wave
- Handles circular dependency detection

### REQ-003: Worktree Manager Service (Ubiquitous)

The system shall have worktree-manager.service.ts that:
- Creates git worktrees using moai-worktree commands
- Manages worktree paths (.worktrees/{SPEC-ID}/)
- Cleans up worktrees after completion
- Tracks active worktrees for sessions
- Handles merge operations

### REQ-004: SPEC Status Poller Service (Ubiquitous)

The system shall have spec-status-poller.service.ts that:
- Polls Claude session output for status changes
- Detects SPEC completion markers in output
- Updates SpecInfo status in real-time
- Emits events for status changes
- Handles multiple concurrent sessions

### REQ-005: Wave Calculation (Ubiquitous)

The dependency analyzer shall calculate waves where:
- Wave 1: SPECs with no dependencies
- Wave 2: SPECs depending only on Wave 1 SPECs
- Wave N: SPECs depending only on completed waves
- Maximum parallelism equals wave size (capped at 10)

### REQ-006: Error Handling (Event-Driven)

When a service encounters an error, the system shall:
- Log the error with context
- Emit error event to Renderer
- Attempt graceful recovery where possible
- Clean up partial state

## Technical Constraints

- Use child_process for CLI commands
- Non-blocking async operations
- Event-based communication for updates
- Memory-efficient for large SPEC sets

## Dependencies

- SPEC-MAIN-001 (Main Process Foundation)
- SPEC-SHARED-001 (Types and Constants)

## Acceptance Criteria

See acceptance.md for detailed Given/When/Then scenarios.
