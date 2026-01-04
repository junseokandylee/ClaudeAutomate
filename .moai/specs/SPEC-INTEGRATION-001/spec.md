---
id: SPEC-INTEGRATION-001
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

# SPEC-INTEGRATION-001: Final Integration (Phase 11)

## Overview

Complete the application with dialog components, remaining stores, hooks, and final polish including the application icon.

## Requirements

### REQ-001: Settings Dialog (Ubiquitous)

The system shall have SettingsDialog.tsx that:
- Displays application settings
- Allows language selection (ko, en, ja, zh)
- Configures maximum parallel sessions
- Sets worktree root directory
- Persists settings via config service

### REQ-002: Confirm Dialog (Ubiquitous)

The system shall have ConfirmDialog.tsx that:
- Displays confirmation message
- Has confirm and cancel buttons
- Supports customizable button labels
- Returns user choice via callback

### REQ-003: Error Dialog (Ubiquitous)

The system shall have ErrorDialog.tsx that:
- Displays error messages
- Shows error details expandable
- Provides retry option where applicable
- Logs errors for debugging

### REQ-004: Config Store (Ubiquitous)

The system shall have configStore.ts that:
- Stores application configuration
- Syncs with Main process config service
- Provides reactive config values
- Handles config loading on startup

### REQ-005: App Store (Ubiquitous)

The system shall have appStore.ts that:
- Tracks bootstrap completion status
- Manages current view state
- Stores UI state (dialogs open, etc.)
- Provides app-wide actions

### REQ-006: useConfig Hook (Ubiquitous)

The system shall have useConfig.ts hook that:
- Provides typed access to config values
- Updates config via IPC
- Handles loading states

### REQ-007: useI18n Hook (Ubiquitous)

The system shall have useI18n.ts hook that:
- Wraps react-i18next useTranslation
- Provides locale switching
- Returns current locale

### REQ-008: Application Icon (Ubiquitous)

The system shall have resources/icon.png that:
- Uses Anthropic orange as primary color
- Works on all platforms (Windows, macOS, Linux)
- Available in required sizes (16, 32, 48, 64, 128, 256, 512)

## Technical Constraints

- All dialogs use Dialog component from UI library
- Stores use Zustand with persistence
- Icons must be PNG format for Electron

## Dependencies

- SPEC-UI-001 (UI Components)
- SPEC-STARTUP-001 (Config Service)
- SPEC-RENDERER-001 (i18n)

## Acceptance Criteria

See acceptance.md for detailed Given/When/Then scenarios.
