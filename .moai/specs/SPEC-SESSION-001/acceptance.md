# Acceptance Criteria: SPEC-SESSION-001

## Test Scenarios

### Scenario 1: Session Start

**Given** an ExecutionPlan with 5 SPECs in 2 waves
**When** startExecution is called
**Then** Wave 1 SPECs begin execution
**And** waveStarted event is emitted

### Scenario 2: Parallel Execution Limit

**Given** a wave with 15 SPECs
**When** the wave executes
**Then** only 10 sessions run concurrently
**And** remaining 5 start after first batch completes

### Scenario 3: Wave Ordering

**Given** Wave 1 with SPECs [A, B] and Wave 2 with SPECs [C, D]
**When** execution starts
**Then** A and B run in parallel
**And** C and D only start after A and B complete

### Scenario 4: Claude Session Output

**Given** a ClaudeSession is running
**When** Claude produces output
**Then** output is captured in session.output
**And** output event is emitted
**And** UI updates in real-time

### Scenario 5: Session Completion Detection

**Given** a ClaudeSession is running
**When** Claude completes successfully
**Then** session status changes to 'completed'
**And** statusChange event is emitted

### Scenario 6: Session Failure Detection

**Given** a ClaudeSession is running
**When** Claude exits with error code
**Then** session status changes to 'failed'
**And** error message is captured

### Scenario 7: Stop Execution

**Given** 5 sessions are running
**When** stopExecution is called
**Then** all 5 sessions are terminated
**And** status changes to 'cancelled'
**And** no new sessions start

### Scenario 8: Session Panel Display

**Given** 3 active sessions
**When** SessionPanel renders
**Then** 3 session cards are displayed
**And** each shows SPEC ID and status
**And** each shows mini output terminal

### Scenario 9: Progress Calculation

**Given** 10 SPECs: 5 completed, 2 running, 1 failed, 2 pending
**When** useProgress is called
**Then** completed = 5
**And** running = 2
**And** failed = 1
**And** pending = 2
**And** percentage = 50

### Scenario 10: Session Store Sync

**Given** Main process updates a session
**When** onSessionUpdate event fires
**Then** sessionStore.sessions is updated
**And** UI re-renders with new data

## Quality Gates

- [ ] session-manager.service.ts with wave execution
- [ ] claude-session.ts with pty spawning
- [ ] SessionPanel.tsx with session cards
- [ ] sessionStore.ts with Zustand
- [ ] useSession.ts hook
- [ ] useProgress.ts hook
- [ ] Parallel limit enforced (max 10)
- [ ] Wave ordering respected
- [ ] Stop terminates all sessions
- [ ] Real-time output updates work
