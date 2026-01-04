---
id: SPEC-SHARED-001
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

# SPEC-SHARED-001: Shared Module (Phase 2)

## Overview

Create the shared module containing TypeScript types, constants, and error definitions used by both Main and Renderer processes.

## Requirements

### REQ-001: Core Type Definitions (Ubiquitous)

The system shall define the following types in src/shared/types.ts:

- SpecStatus: 'pending' | 'running' | 'completed' | 'failed'
- SessionStatus: 'idle' | 'running' | 'completed' | 'failed' | 'cancelled'
- ProgressEventType: 'wave_started' | 'wave_completed' | 'spec_started' | 'spec_completed' | 'spec_failed' | 'all_completed' | 'cancelled' | 'error'
- SupportedLocale: 'ko' | 'en' | 'ja' | 'zh'
- I18nNamespace: 'common' | 'startup' | 'main' | 'settings' | 'dialogs' | 'errors'

### REQ-002: Interface Definitions (Ubiquitous)

The system shall define interfaces:

- SpecInfo: id, title, filePath, status, dependencies
- Wave: waveNumber, specs array
- ExecutionPlan: waves array, totalSpecs, estimatedParallelism
- SessionInfo: id, specId, status, worktreePath, timestamps, output, error
- BootstrapResult: claude, moaiAdk, moaiWorktree statuses, allPassed
- DependencyStatus: installed, version, path
- AppConfig: locale, theme, maxParallelSessions, worktreeRoot

### REQ-003: Application Constants (Ubiquitous)

The system shall define constants in src/shared/constants.ts:

- IPC channel names for all communication
- Default configuration values
- Maximum parallel session count (10)
- Supported locales array
- Color palette values

### REQ-004: Error Definitions (Ubiquitous)

The system shall define custom errors in src/shared/errors.ts:

- BootstrapError: Dependency check failures
- SessionError: Claude session failures
- WorktreeError: Git worktree operations
- ConfigError: Configuration issues
- AnalysisError: Dependency analysis failures

## Technical Constraints

- All types must be compatible with both Node.js and browser environments
- Use TypeScript strict mode
- Export all types for use in both processes

## Dependencies

- SPEC-SETUP-001 (Project Foundation)

## Acceptance Criteria

See acceptance.md for detailed Given/When/Then scenarios.
