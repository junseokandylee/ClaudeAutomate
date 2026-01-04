# Acceptance Criteria: SPEC-PERSISTENCE-001

## Test Scenarios

### Scenario 1: Auto-Save Execution State

**Given** execution is in progress
**When** 30 seconds pass
**Then** state is saved to disk
**And** includes completed SPECs
**And** includes current wave

### Scenario 2: Crash Recovery Detection

**Given** previous execution was interrupted
**When** application starts
**Then** incomplete state is detected
**And** recovery prompt is shown
**And** remaining SPECs are calculated

### Scenario 3: Resume Execution

**Given** recovery prompt is shown
**When** user clicks Resume
**Then** previous state is loaded
**And** only remaining SPECs execute
**And** completed SPECs are skipped

### Scenario 4: Discard Previous State

**Given** recovery prompt is shown
**When** user clicks Discard
**Then** previous state is deleted
**And** fresh start is allowed
**And** no old data remains

### Scenario 5: Session Output Streaming

**Given** session is running
**When** output is generated
**Then** output streams to disk file
**And** can be read in real-time
**And** survives process crash

### Scenario 6: Window State Persistence

**Given** window is moved to position (500, 300)
**When** app restarts
**Then** window opens at (500, 300)
**And** size is preserved
**And** maximized state remembered

### Scenario 7: Recent Projects

**Given** user opens project A then project B
**When** viewing recent projects
**Then** project B is first
**And** project A is second
**And** maximum 10 projects shown

### Scenario 8: Panel Layout Persistence

**Given** user resizes SPEC list to 400px
**When** app restarts
**Then** SPEC list is 400px
**And** other panels preserved
**And** layout is restored

### Scenario 9: Session Cleanup

**Given** session outputs are 8 days old
**When** cleanup runs
**Then** old sessions are deleted
**And** recent sessions preserved
**And** disk space is freed

### Scenario 10: Atomic Write Safety

**Given** save is in progress
**When** app crashes mid-write
**Then** previous valid state remains
**And** corrupted temp file deleted
**And** recovery still possible

## Quality Gates

- [ ] StatePersistenceService saves state
- [ ] SessionOutputService streams logs
- [ ] AppStateService persists UI state
- [ ] RecoveryPrompt shows on startup
- [ ] Window state handlers work
- [ ] Auto-save triggers periodically
- [ ] Atomic writes prevent corruption
- [ ] Cleanup removes old sessions
- [ ] Recent projects tracked
- [ ] Version checking works
