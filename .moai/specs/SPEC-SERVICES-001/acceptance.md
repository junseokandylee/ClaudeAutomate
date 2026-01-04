# Acceptance Criteria: SPEC-SERVICES-001

## Test Scenarios

### Scenario 1: SPEC Scanning

**Given** a project with 5 SPEC files in .moai/specs/
**When** scanSpecs is called with project path
**Then** an array of 5 SpecInfo objects is returned
**And** each has id, title, filePath, and dependencies

### Scenario 2: YAML Frontmatter Parsing

**Given** a spec.md with valid YAML frontmatter
**When** the SPEC is scanned
**Then** id is extracted from frontmatter
**And** dependencies array is extracted
**And** status defaults to 'pending'

### Scenario 3: Wave Calculation - No Dependencies

**Given** 3 SPECs with no dependencies
**When** analyzeSpecs is called
**Then** all 3 SPECs are in Wave 1
**And** estimatedParallelism is 3

### Scenario 4: Wave Calculation - Chain Dependencies

**Given** SPECs A, B, C where B depends on A and C depends on B
**When** analyzeSpecs is called
**Then** Wave 1 contains [A]
**And** Wave 2 contains [B]
**And** Wave 3 contains [C]

### Scenario 5: Circular Dependency Detection

**Given** SPECs A, B where A depends on B and B depends on A
**When** analyzeSpecs is called
**Then** AnalysisError is thrown
**And** error message indicates circular dependency

### Scenario 6: Worktree Creation

**Given** a valid SPEC-AUTH-001 identifier
**When** createWorktree is called
**Then** moai-worktree create SPEC-AUTH-001 is executed
**And** worktree path is returned
**And** worktree is tracked in activeWorktrees

### Scenario 7: Worktree Cleanup

**Given** an active worktree for SPEC-AUTH-001
**When** cleanupWorktree is called
**Then** moai-worktree cleanup SPEC-AUTH-001 is executed
**And** worktree is removed from activeWorktrees

### Scenario 8: Status Update Event

**Given** a SPEC with status 'running'
**When** updateStatus is called with 'completed'
**Then** statusChange event is emitted
**And** event contains specId, status, and previousStatus

### Scenario 9: Output Parsing for Completion

**Given** Claude output containing "SPEC completed successfully"
**When** parseOutputForStatus is called
**Then** SPEC status is updated to 'completed'
**And** statusChange event is emitted

## Quality Gates

- [ ] spec-scanner.service.ts created and tested
- [ ] dependency-analyzer.service.ts with wave calculation
- [ ] worktree-manager.service.ts with create/cleanup
- [ ] spec-status-poller.service.ts with events
- [ ] Circular dependency detection works
- [ ] Wave calculation is correct
- [ ] Worktree commands execute properly
- [ ] Status events emit correctly
