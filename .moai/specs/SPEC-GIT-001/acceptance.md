# Acceptance Criteria: SPEC-GIT-001

## Test Scenarios

### Scenario 1: Worktree Creation

**Given** project is a git repository
**When** SPEC execution starts
**Then** worktree is created at .worktrees/spec-id
**And** branch spec/spec-id is checked out
**And** worktree is isolated from main

### Scenario 2: Worktree Removal

**Given** worktree exists for SPEC
**When** user requests cleanup
**Then** worktree directory is removed
**And** branch can be preserved or deleted
**And** resources are freed

### Scenario 3: Branch Status Display

**Given** multiple SPEC branches exist
**When** GitStatusPanel is displayed
**Then** current branch is shown
**And** ahead/behind count is visible
**And** modified file count is shown

### Scenario 4: Conflict Detection

**Given** SPEC branch has conflicting changes
**When** merge is attempted
**Then** conflict is detected
**And** conflicting files are listed
**And** ConflictDialog is shown

### Scenario 5: Conflict Resolution

**Given** conflicts are detected
**When** user resolves and marks resolved
**Then** merge continues
**And** worktree is updated
**And** status reflects resolution

### Scenario 6: Commit History Display

**Given** SPEC branch has commits
**When** CommitHistory is opened
**Then** commits are listed chronologically
**And** each shows hash, message, author
**And** changed files are expandable

### Scenario 7: Merge to Main

**Given** SPEC is completed successfully
**When** user clicks merge
**Then** branch is merged to main
**And** conflicts are handled if any
**And** worktree can be cleaned up

### Scenario 8: Batch Cleanup

**Given** 5 completed SPEC worktrees exist
**When** user clicks "Cleanup Completed"
**Then** all 5 worktrees are removed
**And** completed branches are preserved
**And** active worktrees remain

### Scenario 9: Status Monitoring

**Given** session is running in worktree
**When** files are modified
**Then** GitStatusPanel updates
**And** shows modified count
**And** reflects staging state

### Scenario 10: Worktree Health Check

**Given** worktree may be corrupted
**When** health check runs
**Then** corruption is detected
**And** user is notified
**And** repair options are offered

## Quality Gates

- [ ] GitService creates worktrees
- [ ] Branch naming follows convention
- [ ] GitStatusPanel shows live status
- [ ] CommitHistory lists commits
- [ ] ConflictDialog handles conflicts
- [ ] WorktreeManager displays list
- [ ] Merge operations work
- [ ] Cleanup removes worktrees
- [ ] Status updates in real-time
- [ ] simple-git integration works
