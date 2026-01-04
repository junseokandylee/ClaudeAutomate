# Acceptance Criteria: SPEC-TERMINAL-001

## Test Scenarios

### Scenario 1: Session Persistence

**Given** terminal has 100 lines of output
**When** component re-renders
**Then** all 100 lines are preserved
**And** scroll position is maintained
**And** no output is lost

### Scenario 2: Copy Selection

**Given** text is selected in terminal
**When** user presses Ctrl/Cmd+C
**Then** selected text is copied
**And** clipboard contains text
**And** selection is preserved

### Scenario 3: Paste Input

**Given** text is in clipboard
**When** user presses Ctrl/Cmd+V
**Then** text is pasted to terminal
**And** PTY receives input
**And** cursor advances

### Scenario 4: ANSI Color Rendering

**Given** output contains ANSI color codes
**When** rendered in terminal
**Then** colors are displayed correctly
**And** 256 colors work
**And** true color (24-bit) works

### Scenario 5: Search Functionality

**Given** terminal has output text
**When** user presses Ctrl/Cmd+F
**Then** search bar appears
**And** typing highlights matches
**And** Enter navigates to next match

### Scenario 6: Theme Change

**Given** terminal is using dark theme
**When** user selects light theme
**Then** colors update immediately
**And** no re-render flicker
**And** cursor remains visible

### Scenario 7: Font Size Adjustment

**Given** font size is 14px
**When** user increases to 16px
**Then** terminal reflows content
**And** lines per page decreases
**And** scrollback is preserved

### Scenario 8: Scroll Buffer Limit

**Given** scrollback is 10,000 lines
**When** 11,000 lines are output
**Then** oldest 1,000 lines are removed
**And** recent 10,000 lines remain
**And** scroll works smoothly

### Scenario 9: Clickable URLs

**Given** URL is output to terminal
**When** user Ctrl/Cmd+clicks URL
**Then** URL opens in browser
**And** cursor shows link indicator
**And** URL is highlighted

### Scenario 10: Split Terminal View

**Given** single terminal pane
**When** user clicks split button
**Then** two panes are created
**And** resize handle appears
**And** each pane is independent

## Quality Gates

- [ ] EnhancedTerminal component works
- [ ] PTYSessionService manages sessions
- [ ] Search addon integrated
- [ ] Theme manager with presets
- [ ] Copy/paste works correctly
- [ ] ANSI colors render properly
- [ ] Split view optional feature
- [ ] WebGL rendering active
- [ ] Buffer management prevents memory leak
- [ ] Resize observer updates dimensions
