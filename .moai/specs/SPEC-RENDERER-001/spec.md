---
id: SPEC-RENDERER-001
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

# SPEC-RENDERER-001: Renderer Foundation & i18n (Phase 5)

## Overview

Create the React Renderer process foundation with internationalization support for 4 languages (Korean, English, Japanese, Chinese).

## Requirements

### REQ-001: HTML Template (Ubiquitous)

The system shall have src/renderer/index.html with:
- DOCTYPE declaration and UTF-8 charset
- Meta viewport for responsive design
- Root div element for React mounting
- Script reference to main.tsx

### REQ-002: React Entry Point (Ubiquitous)

The system shall have src/renderer/main.tsx that:
- Imports React and ReactDOM
- Imports i18n configuration
- Imports global CSS
- Renders App component to root element

### REQ-003: Root App Component (Ubiquitous)

The system shall have src/renderer/App.tsx that:
- Implements main application routing
- Provides Zustand store context
- Handles startup vs main view switching
- Applies global layout styles

### REQ-004: Global Styles (Ubiquitous)

The system shall have src/renderer/index.css with:
- Tailwind CSS directives (@tailwind base, components, utilities)
- Custom CSS variables for theme colors
- Glassmorphism utility classes
- Dark mode as default theme

### REQ-005: i18n Configuration (Ubiquitous)

The system shall have src/renderer/i18n/index.ts that:
- Configures i18next with react-i18next
- Sets up browser language detection
- Configures fallback language (English)
- Loads translation namespaces dynamically

### REQ-006: Translation Files (Ubiquitous)

The system shall have translation JSON files for each locale:
- Korean (ko): common, startup, main, settings, dialogs, errors
- English (en): common, startup, main, settings, dialogs, errors
- Japanese (ja): common, startup, main, settings, dialogs, errors
- Chinese (zh): common, startup, main, settings, dialogs, errors

Each namespace shall contain relevant UI strings for that section.

## Technical Constraints

- React 18 with concurrent features
- i18next for internationalization
- Tailwind CSS for styling
- Support RTL languages in future

## Dependencies

- SPEC-SETUP-001 (Project Foundation)
- SPEC-SHARED-001 (Types and Constants)
- SPEC-PRELOAD-001 (Electron API bridge)

## Acceptance Criteria

See acceptance.md for detailed Given/When/Then scenarios.
