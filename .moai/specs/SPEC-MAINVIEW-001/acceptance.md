# Acceptance Criteria: SPEC-MAINVIEW-001

## Test Scenarios

### Scenario 1: MainView Layout

**Given** the user passes bootstrap
**When** MainView renders
**Then** the 3-column layout is visible
**And** header with controls is displayed
**And** status bar is at the bottom

### Scenario 2: Terminal Initialization

**Given** MainView is rendered
**When** Terminal component mounts
**Then** xterm.js terminal is initialized
**And** custom theme colors are applied
**And** terminal fits its container

### Scenario 3: Terminal Resize

**Given** Terminal is displaying
**When** the window is resized
**Then** terminal automatically refits
**And** no content is clipped or distorted

### Scenario 4: SPEC List Population

**Given** SPECs have been scanned
**When** SpecList renders
**Then** all discovered SPECs are listed
**And** each shows id and status icon
**And** filtering input is available

### Scenario 5: SPEC Selection

**Given** SpecList shows 5 SPECs
**When** user clicks on SPEC-002
**Then** SPEC-002 is highlighted
**And** details panel updates (if applicable)

### Scenario 6: Wave Visualization Display

**Given** an ExecutionPlan with 3 waves
**When** WaveVisualization renders
**Then** 3 wave containers are displayed
**And** each shows correct number of SPEC dots
**And** animations play on render

### Scenario 7: Current Wave Highlighting

**Given** execution is on Wave 2
**When** WaveVisualization updates
**Then** Wave 1 shows completed style (green)
**And** Wave 2 shows active style (orange ring)
**And** Wave 3 shows pending style (gray)

### Scenario 8: Progress Statistics

**Given** 5 total SPECs, 2 completed, 1 running, 2 pending
**When** ProgressOverview renders
**Then** it shows "2/5 Completed"
**And** shows "1 Running"
**And** shows "2 Pending"
**And** progress bar shows 40%

### Scenario 9: Status Bar Information

**Given** application is running 3 sessions
**When** StatusBar renders
**Then** it shows "3 Active Sessions"
**And** current locale is displayed
**And** settings icon is clickable

## Quality Gates

- [ ] MainView.tsx with responsive grid layout
- [ ] Terminal.tsx with xterm.js integration
- [ ] SpecList.tsx with filtering and selection
- [ ] WaveVisualization.tsx with animations
- [ ] ProgressOverview.tsx with statistics
- [ ] StatusBar.tsx with status info
- [ ] Layout responsive to window resize
- [ ] All components receive real-time updates
