# Acceptance Criteria: SPEC-CONFIG-001

## Test Scenarios

### Scenario 1: Config Schema Validation

**Given** config with invalid maxParallelSessions: 15
**When** config is loaded
**Then** validation error is thrown
**And** error message indicates max is 10
**And** default value is used instead

### Scenario 2: Default Values Applied

**Given** fresh installation with no config
**When** config service initializes
**Then** all default values are applied
**And** config is valid
**And** app starts successfully

### Scenario 3: Config Persistence

**Given** user changes theme to "light"
**When** app restarts
**Then** theme remains "light"
**And** change is persisted to disk
**And** no data loss occurs

### Scenario 4: Environment Override

**Given** CPR_MAX_SESSIONS=8 environment variable
**When** config loads
**Then** maxParallelSessions is 8
**And** env takes priority over saved config
**And** other settings unchanged

### Scenario 5: Schema Migration

**Given** config from version 1.0.0
**When** app updates to 1.2.0
**Then** migration runs automatically
**And** new fields are added
**And** existing values preserved

### Scenario 6: Live Config Update

**Given** terminal is open
**When** fontSize changes from 14 to 16
**Then** terminal updates immediately
**And** no restart required
**And** change event is emitted

### Scenario 7: Config Export

**Given** user clicks Export Config
**When** file dialog selects location
**Then** JSON file is created
**And** contains all config values
**And** file is valid JSON

### Scenario 8: Config Import

**Given** valid config JSON file
**When** user imports the file
**Then** config is replaced
**And** backup is created first
**And** app reflects new settings

### Scenario 9: Invalid Import Rejection

**Given** config file with invalid values
**When** import is attempted
**Then** validation fails
**And** error is shown to user
**And** current config unchanged

### Scenario 10: Nested Config Update

**Given** updating "terminal.fontSize"
**When** setNested is called
**Then** only fontSize changes
**And** other terminal settings preserved
**And** change event includes path

## Quality Gates

- [ ] ConfigSchema with Zod validation
- [ ] ConfigService with electron-store
- [ ] Migration system implemented
- [ ] IPC handlers registered
- [ ] useConfig hook works
- [ ] Environment overrides work
- [ ] Import/export functionality
- [ ] Live reload updates UI
- [ ] Backup before changes
- [ ] Default values documented
