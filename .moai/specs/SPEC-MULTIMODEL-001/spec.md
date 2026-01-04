---
id: SPEC-MULTIMODEL-001
version: "1.0.0"
status: "draft"
created: "2026-01-04"
updated: "2026-01-04"
author: "MoAI-ADK"
priority: "MEDIUM"
---

## HISTORY

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-01-04 | MoAI-ADK | Initial SPEC creation |

# SPEC-MULTIMODEL-001: Multi-Model Support

## Overview

Enable alternative AI model integration (GLM, Kimi, and future models) via environment variable override, allowing users to use different AI providers for SPEC implementation.

## Requirements

### REQ-001: Model Configuration (Ubiquitous)

The system shall support configuring alternative AI models:
- CLAUDE_MODEL: Default model selection
- ALTERNATIVE_PROVIDER: GLM, Kimi, or other providers
- API_KEY configuration per provider
- Model switching without application restart

### REQ-002: Environment Variable Override (Ubiquitous)

The system shall support environment variable overrides:
- CLAUDE_OVERRIDE_MODEL: Force specific model
- CLAUDE_OVERRIDE_PROVIDER: Force specific provider
- Precedence: ENV vars > Config file > Defaults

### REQ-003: Model Settings UI (Ubiquitous)

The SettingsDialog shall include model configuration:
- Provider selection dropdown
- Model selection per provider
- API key input (masked)
- Connection test button

### REQ-004: Session Model Assignment (Event-Driven)

When starting a parallel session, the system shall:
- Read model configuration from settings
- Apply environment overrides if present
- Pass model settings to Claude session
- Log model selection for debugging

### REQ-005: Provider Validation (State-Driven)

If an unsupported provider is configured, the system shall:
- Display warning to user
- Fall back to default Claude model
- Log the fallback action

## Technical Constraints

- API keys must be stored securely (electron-store encryption)
- Model changes require session restart
- Not all models support same features

## Dependencies

- SPEC-STARTUP-001 (Config Service)
- SPEC-SESSION-001 (Session Management)
- SPEC-INTEGRATION-001 (Settings Dialog)

## Acceptance Criteria

See acceptance.md for detailed Given/When/Then scenarios.
