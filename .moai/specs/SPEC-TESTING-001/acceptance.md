# Acceptance Criteria: SPEC-TESTING-001

## Test Scenarios

### Scenario 1: Vitest Configuration

**Given** the project is set up
**When** running `npm test`
**Then** Vitest runs all test files
**And** tests use jsdom environment
**And** path aliases resolve correctly

### Scenario 2: Unit Test Coverage

**Given** unit tests are complete
**When** coverage report is generated
**Then** overall coverage is at least 80%
**And** coverage report is generated in HTML
**And** uncovered lines are highlighted

### Scenario 3: Mock Factory Usage

**Given** test needs mock data
**When** using createMockSpec factory
**Then** valid SpecInfo is generated
**And** overrides can customize properties
**And** faker provides realistic data

### Scenario 4: Component Test Rendering

**Given** SpecList component with mock specs
**When** component is rendered
**Then** all spec items are visible
**And** clicking item triggers onSelect
**And** selected items show highlight

### Scenario 5: Store Test Isolation

**Given** sessionStore tests
**When** each test runs
**Then** store state is reset
**And** tests do not affect each other
**And** state changes are verified

### Scenario 6: Hook Test with Timers

**Given** useProgress hook test
**When** fake timers advance
**Then** elapsed time updates correctly
**And** percentage calculation is accurate
**And** timer cleanup works

### Scenario 7: IPC Mock Testing

**Given** component using electronAPI
**When** component calls IPC method
**Then** mock function is called
**And** return value is controlled
**And** call arguments are verifiable

### Scenario 8: E2E Application Launch

**Given** Playwright test configuration
**When** launching Electron app
**Then** application window opens
**And** window title is correct
**And** app can be closed cleanly

### Scenario 9: E2E Bootstrap Flow

**Given** E2E test for bootstrap
**When** app launches
**Then** bootstrap checks run
**And** dependency status is displayed
**And** main view loads on success

### Scenario 10: CI Test Integration

**Given** PR is created
**When** CI pipeline runs
**Then** all unit tests execute
**And** coverage is reported
**And** PR fails if tests fail

## Quality Gates

- [ ] Vitest configured with jsdom
- [ ] Test setup file mocks Electron
- [ ] Mock factories for all types
- [ ] Service unit tests written
- [ ] Component tests with RTL
- [ ] Store tests with isolation
- [ ] Hook tests with timers
- [ ] E2E tests with Playwright
- [ ] 80% coverage achieved
- [ ] CI integration configured
