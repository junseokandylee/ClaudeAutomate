# Acceptance Criteria: SPEC-AUTOMERGE-001

## Test Scenarios

### Scenario 1: Auto Merge on Completion

**Given** auto_merge is enabled
**And** a SPEC session completes successfully
**When** the session status changes to 'completed'
**Then** merge process starts automatically
**And** session status changes to 'merging'

### Scenario 2: Squash Merge Strategy

**Given** merge_strategy is set to 'squash'
**When** SPEC-AUTH-001 merge executes
**Then** all commits are squashed into one
**And** single commit appears on main branch

### Scenario 3: Rebase Merge Strategy

**Given** merge_strategy is set to 'rebase'
**When** SPEC-AUTH-001 merge executes
**Then** commits are rebased onto main
**And** linear history is maintained

### Scenario 4: Conflict Detection

**Given** SPEC-AUTH-001 has changes conflicting with main
**When** merge is attempted
**Then** conflict is detected
**And** MergeConflictDialog appears
**And** conflicting files are listed

### Scenario 5: Manual Conflict Resolution

**Given** MergeConflictDialog is showing
**When** user resolves conflicts externally
**And** clicks "Retry Merge"
**Then** merge is attempted again
**And** process continues if successful

### Scenario 6: Worktree Cleanup

**Given** merge completed successfully
**When** cleanup phase runs
**Then** worktree directory is deleted
**And** feature branch is deleted
**And** worktree registry is updated

### Scenario 7: Test Requirement

**Given** require_tests_pass is true
**And** SPEC tests failed
**When** session completes
**Then** auto merge is skipped
**And** warning is displayed

### Scenario 8: Batch Merge

**Given** batch_merge is enabled
**And** Wave 1 (SPEC-001, SPEC-002) completes
**When** all wave SPECs finish
**Then** SPECs are merged in order
**And** conflicts in one don't block others

### Scenario 9: Push to Remote

**Given** push_to_remote is true
**And** merge completes locally
**When** push phase runs
**Then** changes are pushed to remote
**And** remote tracking is updated

## Quality Gates

- [ ] AutoMergeConfig types defined
- [ ] AutoMergeService created
- [ ] SessionManager integration complete
- [ ] MergeConflictDialog created
- [ ] Settings UI has merge options
- [ ] Worktree cleanup works
- [ ] All merge strategies work
- [ ] Conflict detection works
