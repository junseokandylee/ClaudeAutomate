# Acceptance Criteria: SPEC-ERROR-RECOVERY-001

## Test Scenarios

### Scenario 1: Session Timeout Recovery

**Given** a Claude session times out after 5 minutes
**When** the error handler detects timeout
**Then** automatic retry is attempted
**And** user is notified of retry status
**And** if retry succeeds, execution continues normally

### Scenario 2: Session Crash with Output Preservation

**Given** a Claude session crashes mid-execution
**When** the crash is detected
**Then** all output before crash is preserved
**And** error is logged with full context
**And** user can view partial output

### Scenario 3: Worktree Lock Conflict

**Given** git lock file exists from previous run
**When** worktree creation is attempted
**Then** system detects stale lock (older than 1 min)
**And** automatically removes stale lock
**And** retries worktree creation

### Scenario 4: Network Connectivity Loss

**Given** network connection is lost during execution
**When** API call fails with connection error
**Then** system enters offline mode
**And** queues failed operations
**And** retries when connectivity restored

### Scenario 5: Execution Resume After Crash

**Given** application crashed with 5 of 10 SPECs completed
**When** application restarts
**Then** checkpoint is detected automatically
**And** user is prompted to resume
**And** only remaining 5 SPECs are executed

### Scenario 6: React Component Crash

**Given** a UI component throws an error
**When** error boundary catches the exception
**Then** fallback UI is displayed
**And** error is logged to diagnostics
**And** retry button is available

### Scenario 7: Max Retry Exceeded

**Given** a session has failed 3 times
**When** the 4th attempt would occur
**Then** retry is blocked
**And** user is prompted for manual action
**And** options include skip, abort, or manual fix

### Scenario 8: Graceful Feature Degradation

**Given** wave visualization fails to render
**When** error is caught
**Then** basic list view is shown instead
**And** user is notified of reduced functionality
**And** background recovery is attempted

### Scenario 9: Checkpoint Persistence

**Given** execution is in progress with 3 waves complete
**When** user closes application
**Then** checkpoint is saved automatically
**And** contains completed SPECs list
**And** contains current wave state

### Scenario 10: Orphaned Worktree Cleanup

**Given** previous execution left orphaned worktrees
**When** application starts
**Then** orphaned worktrees are detected
**And** user is prompted to clean up
**And** cleanup removes all orphaned worktrees

## Quality Gates

- [ ] Error types defined with severity levels
- [ ] ErrorHandlerService handles all error types
- [ ] React ErrorBoundary wraps main app
- [ ] SessionRecoveryService saves checkpoints
- [ ] WorktreeRecoveryService handles git issues
- [ ] Retry logic with exponential backoff
- [ ] User-friendly error messages
- [ ] Error logs include full context
- [ ] Resume from checkpoint works
- [ ] Graceful degradation implemented
