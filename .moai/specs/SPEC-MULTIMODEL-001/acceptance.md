# Acceptance Criteria: SPEC-MULTIMODEL-001

## Test Scenarios

### Scenario 1: Default Model Configuration

**Given** the application starts with no model configuration
**When** user opens Settings
**Then** Claude is selected as default provider
**And** default model is shown

### Scenario 2: Provider Selection

**Given** user is in Settings > Model Configuration
**When** user selects "GLM" from provider dropdown
**Then** available models update to GLM models
**And** API key field shows "Zhipu API Key" placeholder

### Scenario 3: API Key Storage

**Given** user enters an API key for GLM
**When** user clicks Save
**Then** API key is stored encrypted
**And** key is masked in the UI

### Scenario 4: Connection Test

**Given** user has configured GLM with API key
**When** user clicks "Test Connection"
**Then** system makes test API call
**And** success or failure message is shown

### Scenario 5: Environment Override

**Given** CLAUDE_OVERRIDE_PROVIDER=kimi is set
**When** application starts
**Then** Kimi is used regardless of saved settings
**And** "Override Active" indicator is shown in UI

### Scenario 6: Session with Custom Model

**Given** user configured GLM as provider
**When** starting a new parallel session
**Then** session uses GLM model configuration
**And** session log shows selected model

### Scenario 7: Invalid Provider Fallback

**Given** user configures unsupported provider "xyz"
**When** system tries to use the provider
**Then** warning message is displayed
**And** system falls back to Claude

## Quality Gates

- [ ] ModelConfig types defined
- [ ] ModelConfigService created
- [ ] ClaudeSession accepts model config
- [ ] Settings Dialog has model section
- [ ] API keys stored encrypted
- [ ] Environment overrides work
- [ ] Fallback to Claude works
