# Acceptance Criteria: SPEC-HOTKEYS-001

## Test Scenarios

### Scenario 1: Scan Shortcut

**Given** the application is open
**When** user presses Cmd/Ctrl + S
**Then** SPEC scan is triggered
**And** SPEC list updates

### Scenario 2: Open Settings

**Given** the application is open
**When** user presses Cmd/Ctrl + ,
**Then** Settings dialog opens

### Scenario 3: Close Dialog with Escape

**Given** Settings dialog is open
**When** user presses Escape
**Then** Settings dialog closes
**And** focus returns to main view

### Scenario 4: Navigation - Focus Terminal

**Given** SPEC list has focus
**When** user presses Cmd/Ctrl + 2
**Then** Terminal panel gains focus
**And** cursor appears in terminal

### Scenario 5: Platform Key Handling

**Given** running on macOS
**When** checking shortcut display
**Then** Cmd symbol is used instead of Ctrl
**And** Cmd key triggers shortcuts

### Scenario 6: SPEC List Arrow Navigation

**Given** SPEC list has focus with 5 SPECs
**When** user presses Arrow Down
**Then** next SPEC is highlighted
**And** pressing Enter shows details

### Scenario 7: Select All SPECs

**Given** SPEC list has focus
**When** user presses Cmd/Ctrl + A
**Then** all SPECs are selected
**And** selection count updates

### Scenario 8: Shortcut Help Overlay

**Given** any application state
**When** user presses Cmd/Ctrl + /
**Then** shortcut help overlay appears
**And** all shortcuts are listed by category

### Scenario 9: Start Execution Shortcut

**Given** execution plan is ready
**When** user presses Cmd/Ctrl + Enter
**Then** parallel execution starts
**And** progress is shown

### Scenario 10: Stop Execution Shortcut

**Given** execution is running
**When** user presses Cmd/Ctrl + Shift + Enter
**Then** all sessions are stopped
**And** status shows cancelled

## Quality Gates

- [ ] HotkeyConfig types defined
- [ ] useHotkeys hook created
- [ ] HotkeyHelpDialog created
- [ ] All global shortcuts work
- [ ] Navigation shortcuts work
- [ ] Execution shortcuts work
- [ ] Platform differences handled
- [ ] No OS shortcut conflicts
