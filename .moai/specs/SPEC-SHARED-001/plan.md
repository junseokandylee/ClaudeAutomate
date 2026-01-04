# Implementation Plan: SPEC-SHARED-001

## Overview

Create shared TypeScript modules for types, constants, and errors used across the application.

## Task Breakdown

### Task 1: Create types.ts

Define all TypeScript types and interfaces:

```
src/shared/types.ts
├── Status Types (SpecStatus, SessionStatus, ProgressEventType)
├── Locale Types (SupportedLocale, I18nNamespace)
├── Data Interfaces (SpecInfo, Wave, ExecutionPlan)
├── Session Interfaces (SessionInfo, SessionOutput)
├── Bootstrap Interfaces (BootstrapResult, DependencyStatus)
├── Config Interfaces (AppConfig, UserPreferences)
└── IPC Types (IpcChannels, IpcPayloads)
```

### Task 2: Create constants.ts

Define application constants:

```
src/shared/constants.ts
├── IPC_CHANNELS (bootstrap, spec, session, config)
├── DEFAULT_CONFIG (locale, theme, maxSessions)
├── MAX_PARALLEL_SESSIONS = 10
├── SUPPORTED_LOCALES = ['ko', 'en', 'ja', 'zh']
├── COLORS (anthropic, slate, blue, emerald, amber, red)
└── WORKTREE_BASE_PATH
```

### Task 3: Create errors.ts

Define custom error classes:

```
src/shared/errors.ts
├── AppError (base class)
├── BootstrapError
├── SessionError
├── WorktreeError
├── ConfigError
├── AnalysisError
└── Error codes and messages
```

## File Structure

```
src/
└── shared/
    ├── types.ts      (~150 lines)
    ├── constants.ts  (~80 lines)
    └── errors.ts     (~100 lines)
```

## Type Definitions Detail

### SpecInfo Interface
- id: string (e.g., "SPEC-001")
- title: string
- filePath: string
- status: SpecStatus
- dependencies: string[]

### SessionInfo Interface
- id: string (UUID)
- specId: string
- status: SessionStatus
- worktreePath: string
- startedAt?: Date
- completedAt?: Date
- output: string[]
- error?: string

### ExecutionPlan Interface
- waves: Wave[]
- totalSpecs: number
- estimatedParallelism: number

## Risk Analysis

| Risk | Mitigation |
|------|------------|
| Type incompatibility | Test imports in both processes |
| Missing types | Review design doc thoroughly |
| Circular dependencies | Keep modules independent |

## Success Criteria

- All types compile without errors
- Types importable in both Main and Renderer
- No circular dependencies
- Full coverage of design doc types
