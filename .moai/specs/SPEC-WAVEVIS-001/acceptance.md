# Acceptance Criteria: SPEC-WAVEVIS-001

## Test Scenarios

### Scenario 1: Dependency Graph Rendering

**Given** 10 SPECs with dependencies
**When** DependencyGraph renders
**Then** all 10 nodes are visible
**And** dependency arrows connect correctly
**And** nodes are positioned by wave

### Scenario 2: Status Color Updates

**Given** SPEC is running
**When** status changes to completed
**Then** node color changes to green
**And** animation indicates transition
**And** connected edges update

### Scenario 3: Running Animation

**Given** SPEC is executing
**When** viewing dependency graph
**Then** node pulses with animation
**And** connected edges are animated
**And** animation is smooth

### Scenario 4: Wave Timeline Display

**Given** 3 waves in execution plan
**When** timeline is rendered
**Then** 3 lanes are displayed
**And** SPECs positioned correctly
**And** time markers are accurate

### Scenario 5: Current Time Marker

**Given** execution is in progress
**When** 30 seconds have elapsed
**Then** time marker moves to 30s position
**And** marker updates in real-time
**And** marker color is visible

### Scenario 6: Resource Warning

**Given** memory usage at 85%
**When** ResourcePanel renders
**Then** warning message appears
**And** progress bar shows red
**And** suggestion is displayed

### Scenario 7: Zoom and Pan

**Given** large dependency graph
**When** user scrolls mouse wheel
**Then** graph zooms in/out
**And** fit-to-view button resets
**And** minimap updates

### Scenario 8: PNG Export

**Given** completed execution
**When** user clicks Export PNG
**Then** download dialog appears
**And** PNG contains graph image
**And** image quality is good

### Scenario 9: Critical Path Highlight

**Given** dependency analysis complete
**When** critical path is calculated
**Then** longest path is highlighted
**And** highlight color is distinct
**And** tooltip shows path info

### Scenario 10: Drag Reorder (Optional)

**Given** wave editing is enabled
**When** user drags SPEC to new wave
**Then** SPEC moves to new position
**And** dependencies are validated
**And** conflicts are shown if invalid

## Quality Gates

- [ ] React Flow graph component works
- [ ] Custom SpecNode renders correctly
- [ ] Wave timeline displays properly
- [ ] Resource panel shows metrics
- [ ] Animations are 60fps
- [ ] Zoom and pan work smoothly
- [ ] Export produces valid files
- [ ] Minimap reflects graph state
- [ ] Status colors update in real-time
- [ ] Graph is keyboard accessible
