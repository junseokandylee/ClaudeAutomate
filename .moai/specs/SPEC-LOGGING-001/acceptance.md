# Acceptance Criteria: SPEC-LOGGING-001

## Test Scenarios

### Scenario 1: Log Level Filtering

**Given** log level is set to "warn"
**When** debug and info messages are logged
**Then** they are not written to file
**And** warn and error messages are logged
**And** file contains only warn+ messages

### Scenario 2: Structured Logging

**Given** log message with context
**When** logger.info("Message", { specId: "SPEC-001" })
**Then** output includes specId in structured format
**And** context is parseable
**And** timestamp is included

### Scenario 3: File Rotation

**Given** log file is 10MB
**When** new log message is written
**Then** current file is archived
**And** new file is created
**And** archive has timestamp suffix

### Scenario 4: Archive Cleanup

**Given** 7 archived log files exist
**When** new rotation occurs
**Then** oldest 2 archives are deleted
**And** only 5 archives remain
**And** current log is preserved

### Scenario 5: Debug Mode Enable

**Given** debug mode is disabled
**When** user enables debug mode
**Then** log level changes to debug
**And** IPC tracing is enabled
**And** verbose output appears

### Scenario 6: Diagnostic Bundle

**Given** user requests diagnostic bundle
**When** bundle is generated
**Then** ZIP file is created
**And** contains system-info.json
**And** contains log files
**And** config is sanitized

### Scenario 7: Error Stack Traces

**Given** error with stack trace occurs
**When** logger.error is called
**Then** full stack trace is logged
**And** error message is clear
**And** context is preserved

### Scenario 8: Console Coloring

**Given** running in development mode
**When** logs are output to console
**Then** colors indicate level
**And** format is readable
**And** source location shown

### Scenario 9: Log Viewer Display

**Given** 100 log entries exist
**When** LogViewer is opened
**Then** all entries are displayed
**And** filtering by level works
**And** search filters messages

### Scenario 10: Remote Error Reporting

**Given** telemetry is enabled
**When** error occurs
**Then** error is sent to Sentry
**And** user data is anonymized
**And** stack trace is included

## Quality Gates

- [ ] LoggerService singleton created
- [ ] File rotation configured
- [ ] Debug mode toggles level
- [ ] DiagnosticService generates bundle
- [ ] RendererLogger sends to main
- [ ] LogViewer component works
- [ ] Console colors applied
- [ ] Context formatting correct
- [ ] Archive cleanup works
- [ ] Sensitive data sanitized
