---
id: SPEC-UI-001
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

# SPEC-UI-001: UI Components (Phase 6)

## Overview

Create reusable UI components based on shadcn/ui patterns with Tailwind CSS styling and Framer Motion animations.

## Requirements

### REQ-001: Button Component (Ubiquitous)

The system shall have a Button component with:
- Variants: primary (anthropic orange), secondary, ghost, destructive
- Sizes: sm, md, lg
- States: default, hover, active, disabled, loading
- Framer Motion hover/tap animations
- Keyboard accessibility

### REQ-002: Card Component (Ubiquitous)

The system shall have a Card component with:
- Glassmorphism styling by default
- Header, content, and footer slots
- Hover animation effects
- Customizable padding and spacing

### REQ-003: Dialog Component (Ubiquitous)

The system shall have a Dialog component with:
- Modal overlay with backdrop blur
- Title, description, and content areas
- Close button and keyboard dismiss (Escape)
- Framer Motion enter/exit animations
- Focus trap for accessibility

### REQ-004: Progress Component (Ubiquitous)

The system shall have a Progress component with:
- Linear progress bar variant
- Indeterminate loading state
- Customizable colors (anthropic, blue, emerald)
- Percentage label option
- Smooth animation transitions

### REQ-005: Select Component (Ubiquitous)

The system shall have a Select component with:
- Dropdown menu with options
- Search/filter capability
- Single and multi-select modes
- Keyboard navigation
- Custom option rendering

### REQ-006: Tabs Component (Ubiquitous)

The system shall have a Tabs component with:
- Tab list with indicators
- Tab panels with content
- Animated tab switching
- Keyboard navigation (arrow keys)
- Controlled and uncontrolled modes

### REQ-007: Tooltip Component (Ubiquitous)

The system shall have a Tooltip component with:
- Hover trigger by default
- Configurable placement (top, bottom, left, right)
- Delay before showing
- Arrow pointer
- Dark theme styling

## Technical Constraints

- All components must be accessible (ARIA attributes)
- All components must support dark theme
- Animations using Framer Motion
- TypeScript with strict typing

## Dependencies

- SPEC-RENDERER-001 (Renderer Foundation)

## Acceptance Criteria

See acceptance.md for detailed Given/When/Then scenarios.
