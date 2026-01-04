# Acceptance Criteria: SPEC-STARTUP-001

## Test Scenarios

### Scenario 1: Startup View Display

**Given** the application starts
**When** StartupView renders
**Then** the application logo is displayed
**And** version number is shown
**And** dependency check begins automatically

### Scenario 2: Dependency Checking Animation

**Given** dependency check is in progress
**When** a dependency is being checked
**Then** a spinner animation is shown for that item
**And** the dependency name is displayed

### Scenario 3: All Dependencies Installed

**Given** Claude, moai-adk, and moai-worktree are all installed
**When** bootstrap check completes
**Then** all three items show green checkmarks
**And** version numbers are displayed
**And** app transitions to MainView

### Scenario 4: Missing Dependency Detection

**Given** moai-adk is not installed
**When** bootstrap check completes
**Then** moai-adk shows red X icon
**And** installation instructions are displayed
**And** retry button is available

### Scenario 5: Bootstrap on Windows

**Given** the app runs on Windows
**When** checking for Claude CLI
**Then** 'where claude' command is used
**And** correct Windows path is detected

### Scenario 6: Bootstrap on macOS/Linux

**Given** the app runs on macOS
**When** checking for Claude CLI
**Then** 'which claude' command is used
**And** correct Unix path is detected

### Scenario 7: Config Persistence

**Given** user sets locale to 'ko'
**When** the app restarts
**Then** locale is still 'ko'
**And** Korean translations are loaded

### Scenario 8: Retry After Installation

**Given** a dependency was missing
**When** user installs it and clicks Retry
**Then** bootstrap check runs again
**And** newly installed dependency shows as installed

## Quality Gates

- [ ] StartupView.tsx created with animations
- [ ] DependencyCheck.tsx created with status display
- [ ] bootstrap.service.ts checks all 3 dependencies
- [ ] config.service.ts persists configuration
- [ ] Bootstrap completes in under 3 seconds
- [ ] Platform-specific commands work (Windows/macOS/Linux)
- [ ] Installation guidance is displayed for missing deps
- [ ] Transition to MainView works when all pass
