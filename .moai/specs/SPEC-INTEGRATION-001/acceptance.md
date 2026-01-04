# Acceptance Criteria: SPEC-INTEGRATION-001

## Test Scenarios

### Scenario 1: Settings Dialog Open

**Given** user is on MainView
**When** user clicks settings button
**Then** SettingsDialog opens with animation
**And** current settings are displayed

### Scenario 2: Language Change

**Given** SettingsDialog is open with English selected
**When** user selects Korean from language dropdown
**Then** all UI strings update to Korean immediately
**And** selection is persisted to config

### Scenario 3: Max Sessions Configuration

**Given** SettingsDialog is open
**When** user changes max parallel sessions to 5
**Then** the value is saved
**And** next execution respects the limit

### Scenario 4: Settings Persistence

**Given** user changed settings and closed the app
**When** user reopens the application
**Then** all settings are restored
**And** language is correct from last session

### Scenario 5: Confirm Dialog

**Given** user initiates a destructive action
**When** ConfirmDialog appears
**Then** title and message are displayed
**And** confirm and cancel buttons are visible

### Scenario 6: Confirm Dialog - Confirm

**Given** ConfirmDialog is open
**When** user clicks confirm button
**Then** onConfirm callback is called
**And** dialog closes

### Scenario 7: Confirm Dialog - Cancel

**Given** ConfirmDialog is open
**When** user clicks cancel button
**Then** onCancel callback is called
**And** dialog closes
**And** action is not performed

### Scenario 8: Error Dialog Display

**Given** an error occurs during execution
**When** ErrorDialog is triggered
**Then** error message is displayed
**And** dialog has red accent styling

### Scenario 9: Error Dialog Details

**Given** ErrorDialog is showing an Error object
**When** user clicks "Show Details"
**Then** error stack trace is revealed
**And** clicking again hides details

### Scenario 10: Error Dialog Retry

**Given** ErrorDialog has retry option
**When** user clicks Retry button
**Then** onRetry callback is called
**And** dialog closes
**And** action is retried

### Scenario 11: Config Store Loading

**Given** application starts
**When** configStore.loadConfig is called
**Then** config is fetched from Main process
**And** isLoading becomes false
**And** config values are available

### Scenario 12: App Store View Switching

**Given** bootstrap completes successfully
**When** setBootstrapComplete(true) is called
**Then** isBootstrapComplete becomes true
**And** currentView changes to 'main'

### Scenario 13: Application Icon

**Given** the application is packaged
**When** viewing in Windows taskbar/macOS dock
**Then** custom icon is displayed
**And** icon uses Anthropic orange color

## Quality Gates

- [ ] SettingsDialog.tsx with all settings
- [ ] ConfirmDialog.tsx with callbacks
- [ ] ErrorDialog.tsx with details toggle
- [ ] configStore.ts with persistence
- [ ] appStore.ts with view management
- [ ] useConfig.ts hook
- [ ] useI18n.ts hook
- [ ] resources/icon.png created
- [ ] Settings persist across restarts
- [ ] Language switching is instant
- [ ] All dialogs animate properly
- [ ] Application is feature-complete
