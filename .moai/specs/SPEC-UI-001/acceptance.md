# Acceptance Criteria: SPEC-UI-001

## Test Scenarios

### Scenario 1: Button Variants

**Given** the Button component is rendered
**When** variant="primary" is set
**Then** the button has anthropic orange background
**And** hover effect scales the button slightly

### Scenario 2: Button Loading State

**Given** a Button with isLoading={true}
**When** the button renders
**Then** a spinner icon is displayed
**And** the button is disabled
**And** click events are prevented

### Scenario 3: Card Glassmorphism

**Given** the Card component is rendered
**When** placed over a background
**Then** the card has translucent background
**And** backdrop blur effect is visible
**And** subtle border is present

### Scenario 4: Dialog Open/Close

**Given** a Dialog with open={true}
**When** the dialog renders
**Then** overlay covers the screen with blur
**And** dialog content is centered
**And** pressing Escape closes the dialog

### Scenario 5: Dialog Focus Trap

**Given** a Dialog is open with focusable elements
**When** user presses Tab repeatedly
**Then** focus cycles within the dialog
**And** focus never leaves the dialog

### Scenario 6: Progress Animation

**Given** a Progress component with value={50}
**When** value changes to 75
**Then** the progress bar animates smoothly
**And** transition takes approximately 300ms

### Scenario 7: Select Keyboard Navigation

**Given** a Select component is focused
**When** user presses arrow down
**Then** the dropdown opens
**And** options can be navigated with arrow keys
**And** Enter selects the highlighted option

### Scenario 8: Tabs Switching

**Given** a Tabs component with 3 tabs
**When** user clicks the second tab
**Then** the tab indicator slides to second tab
**And** second panel content is displayed
**And** animation is smooth

### Scenario 9: Tooltip Display

**Given** an element wrapped in Tooltip
**When** user hovers for 300ms
**Then** tooltip appears with content
**And** tooltip is positioned correctly
**And** tooltip has dark background

## Quality Gates

- [ ] All 7 UI components created
- [ ] All components have TypeScript types
- [ ] All components support dark theme
- [ ] Animations are smooth (60fps)
- [ ] Focus management works correctly
- [ ] Keyboard navigation works
- [ ] ARIA attributes present
