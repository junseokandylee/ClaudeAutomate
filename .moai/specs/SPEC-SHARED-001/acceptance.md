# Acceptance Criteria: SPEC-SHARED-001

## Test Scenarios

### Scenario 1: Type Import in Main Process

**Given** types.ts is created in src/shared/
**When** the Main process imports types from '../shared/types'
**Then** all types are available without compilation errors
**And** TypeScript intellisense works correctly

### Scenario 2: Type Import in Renderer Process

**Given** types.ts is created in src/shared/
**When** the Renderer process imports types from '../shared/types'
**Then** all types are available without compilation errors
**And** React components can use the types

### Scenario 3: Constants Usage

**Given** constants.ts defines IPC_CHANNELS
**When** both Main and Renderer import IPC_CHANNELS
**Then** the same channel names are used consistently
**And** no string literals are hardcoded in IPC calls

### Scenario 4: Error Handling

**Given** custom error classes are defined in errors.ts
**When** a BootstrapError is thrown with a message
**Then** the error includes the correct error code
**And** the error is instanceof AppError
**And** the error message is accessible

### Scenario 5: Type Safety Validation

**Given** SpecInfo interface is defined
**When** creating a SpecInfo object with invalid status
**Then** TypeScript reports a compilation error
**And** only valid SpecStatus values are accepted

## Quality Gates

- [ ] All 3 shared files created (types.ts, constants.ts, errors.ts)
- [ ] No TypeScript compilation errors
- [ ] Types importable in both processes
- [ ] All design doc types covered
- [ ] Custom errors extend base AppError
- [ ] IPC channel names are constants, not strings
