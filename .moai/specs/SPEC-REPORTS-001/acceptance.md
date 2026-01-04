# Acceptance Criteria: SPEC-REPORTS-001

## Test Scenarios

### Scenario 1: Automatic Report Generation

**Given** parallel execution completes (all waves finished)
**When** execution ends
**Then** HTML report is generated automatically
**And** saved to .moai/reports/ directory
**And** filename includes timestamp

### Scenario 2: Summary Statistics

**Given** execution with 10 SPECs (8 success, 2 failed)
**When** report is generated
**Then** summary shows Total: 10
**And** Successful: 8 (80%)
**And** Failed: 2 (20%)
**And** total duration is calculated

### Scenario 3: Timeline Visualization

**Given** execution with 3 waves
**When** viewing report timeline
**Then** 3 wave lanes are displayed
**And** parallel SPECs shown side-by-side
**And** start/end times are accurate

### Scenario 4: SPEC Details Section

**Given** SPEC-AUTH-001 completed in 45 seconds
**When** viewing SPEC details in report
**Then** shows SPEC-AUTH-001 entry
**And** duration: 45s
**And** status: completed
**And** output summary available

### Scenario 5: Error Log Display

**Given** SPEC-PAYMENT-001 failed with error
**When** viewing report errors section
**Then** SPEC-PAYMENT-001 error is listed
**And** error message shown
**And** stack trace is collapsible

### Scenario 6: Report History

**Given** 5 previous execution reports exist
**When** opening Report Viewer
**Then** all 5 reports are listed
**And** sorted by date (newest first)
**And** clicking shows report content

### Scenario 7: JSON Export

**Given** a generated report
**When** user selects "Export as JSON"
**Then** JSON file is created
**And** contains all report data
**And** is valid JSON format

### Scenario 8: Offline Viewing

**Given** HTML report was generated
**When** opening report without internet
**Then** report renders correctly
**And** all styles are embedded
**And** timeline visualization works

### Scenario 9: History Cleanup

**Given** 60 reports exist (over 50 limit)
**When** new report is generated
**Then** oldest 10 reports are deleted
**And** 50 most recent remain

## Quality Gates

- [ ] ExecutionReport types defined
- [ ] ReportService created
- [ ] HTML template complete
- [ ] ReportViewer component works
- [ ] Timeline visualization renders
- [ ] Export functionality works
- [ ] History management works
- [ ] Offline viewing works
