# Implementation Plan: SPEC-MULTIMODEL-001

## Overview

Add multi-model support allowing users to switch between AI providers.

## Task Breakdown

### Task 1: Extend Shared Types

```typescript
// Add to src/shared/types.ts
type AIProvider = 'claude' | 'glm' | 'kimi' | 'custom'

interface ModelConfig {
  provider: AIProvider
  modelId: string
  apiKey?: string
  baseUrl?: string
}

interface ProviderInfo {
  name: string
  displayName: string
  models: string[]
  requiresApiKey: boolean
  baseUrl: string
}
```

### Task 2: Create Model Configuration Service

```typescript
// src/main/services/model-config.service.ts
export class ModelConfigService {
  private providers: Map<AIProvider, ProviderInfo>

  getProvider(name: AIProvider): ProviderInfo
  getAvailableModels(provider: AIProvider): string[]
  validateApiKey(provider: AIProvider, apiKey: string): Promise<boolean>
  getEffectiveConfig(): ModelConfig  // Applies env overrides
}
```

### Task 3: Update Session Creation

```typescript
// Update src/main/services/claude-session.ts
export class ClaudeSession {
  constructor(
    id: string,
    specId: string,
    worktreePath: string,
    modelConfig: ModelConfig  // NEW parameter
  )

  private buildEnvironment(): Record<string, string> {
    return {
      ...process.env,
      CLAUDE_MODEL: this.modelConfig.modelId,
      CLAUDE_PROVIDER: this.modelConfig.provider,
      // Provider-specific API keys
    }
  }
}
```

### Task 4: Update Settings Dialog

Add model configuration section to SettingsDialog:
- Provider dropdown (Claude, GLM, Kimi, Custom)
- Model dropdown (filtered by provider)
- API key input (masked, with show/hide toggle)
- Test Connection button
- Save button

### Task 5: Environment Variable Support

Read environment overrides on startup:
- CLAUDE_OVERRIDE_MODEL
- CLAUDE_OVERRIDE_PROVIDER
- CLAUDE_OVERRIDE_API_KEY

Display override indicator in UI when active.

## Supported Providers

| Provider | Models | API Key Required |
|----------|--------|------------------|
| Claude | claude-3-opus, claude-3-sonnet, etc. | Yes (Anthropic) |
| GLM | glm-4, glm-3-turbo | Yes (Zhipu) |
| Kimi | moonshot-v1-* | Yes (Moonshot) |
| Custom | User-defined | Configurable |

## Risk Analysis

| Risk | Mitigation |
|------|------------|
| API key exposure | Encrypt with electron-store |
| Model incompatibility | Feature detection and fallback |
| Rate limiting | Per-provider rate limit handling |

## Success Criteria

- Settings shows model configuration
- Provider switching works correctly
- API keys stored securely
- Environment overrides apply
- Sessions use configured model
