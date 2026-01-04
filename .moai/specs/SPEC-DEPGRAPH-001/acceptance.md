# Acceptance Criteria: SPEC-DEPGRAPH-001

## Test Scenarios

### Scenario 1: Graph Initialization

**Given** project with 5 SPECs loaded
**When** DependencyGraph component mounts
**Then** 5 nodes are rendered
**And** edges show dependencies
**And** layout is applied automatically

### Scenario 2: Wave Grouping

**Given** wave plan with 3 waves
**When** graph is displayed
**Then** nodes are grouped by wave
**And** wave boundaries are visible
**And** colors indicate wave membership

### Scenario 3: Real-Time Status Update

**Given** graph is displayed
**When** session status changes to "running"
**Then** corresponding node pulses
**And** edge becomes animated
**And** color changes to blue

### Scenario 4: Completion Visualization

**Given** session completes successfully
**When** status updates
**Then** node turns green
**And** checkmark appears
**And** dependent edges highlight

### Scenario 5: Failure Visualization

**Given** session fails
**When** status updates
**Then** node turns red
**And** error icon appears
**And** tooltip shows error message

### Scenario 6: Node Click Selection

**Given** graph is displayed
**When** user clicks on node
**Then** node is selected
**And** details panel shows SPEC info
**And** dependencies are highlighted

### Scenario 7: Node Double-Click Navigation

**Given** node has active session
**When** user double-clicks node
**Then** terminal view is focused
**And** session output is visible
**And** graph remains accessible

### Scenario 8: Zoom and Pan

**Given** graph with 20 nodes
**When** user zooms and pans
**Then** view updates smoothly
**And** minimap reflects position
**And** controls remain accessible

### Scenario 9: Export to PNG

**Given** graph is rendered
**When** user clicks Export PNG
**Then** PNG file is downloaded
**And** all nodes are included
**And** colors are preserved

### Scenario 10: Circular Dependency Detection

**Given** SPEC A depends on B, B depends on A
**When** graph data is built
**Then** cycle is detected
**And** warning is displayed
**And** affected nodes are marked

## Quality Gates

- [ ] GraphDataService builds correct structure
- [ ] SpecNode renders with all states
- [ ] DependencyGraph uses React Flow
- [ ] Dagre layout algorithm works
- [ ] Status updates are real-time
- [ ] Zoom/pan performance is smooth
- [ ] Export functions generate files
- [ ] MiniMap reflects graph state
- [ ] Cycle detection identifies loops
- [ ] Node interactions work correctly
