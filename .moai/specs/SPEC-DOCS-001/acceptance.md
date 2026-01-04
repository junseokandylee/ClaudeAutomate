# Acceptance Criteria: SPEC-DOCS-001

## Test Scenarios

### Scenario 1: Report Generation

**Given** execution has completed
**When** report is generated
**Then** summary includes all SPECs
**And** pass/fail counts are correct
**And** duration is calculated

### Scenario 2: Markdown Export

**Given** report data is available
**When** Markdown export is requested
**Then** .md file is created
**And** formatting is correct
**And** tables render properly

### Scenario 3: HTML Export

**Given** report data is available
**When** HTML export is requested
**Then** .html file is created
**And** styles are embedded
**And** syntax highlighting works

### Scenario 4: PDF Export

**Given** report data is available
**When** PDF export is requested
**Then** .pdf file is created
**And** pagination is correct
**And** images are embedded

### Scenario 5: JSON Export

**Given** report data is available
**When** JSON export is requested
**Then** .json file is created
**And** structure is valid
**And** all data is included

### Scenario 6: Session Log Bundle

**Given** multiple sessions have output
**When** log bundle is created
**Then** ZIP file is generated
**And** each session has log file
**And** summary.json is included

### Scenario 7: ANSI Preservation

**Given** session output has ANSI codes
**When** bundle with preserveAnsi: true
**Then** ANSI codes are preserved
**And** colors can be rendered
**And** original formatting kept

### Scenario 8: Report Preview

**Given** ReportPreview component is open
**When** report is loaded
**Then** preview tab shows rendered
**And** source tab shows markdown
**And** export buttons work

### Scenario 9: Wave Summary

**Given** execution had 3 waves
**When** report is generated
**Then** each wave is detailed
**And** duration per wave shown
**And** SPECs per wave listed

### Scenario 10: Error Section

**Given** some SPECs failed
**When** report is generated
**Then** errors section appears
**And** error messages included
**And** affected SPECs identified

## Quality Gates

- [ ] ReportGeneratorService builds report
- [ ] MarkdownExportService formats correctly
- [ ] HtmlExportService includes styles
- [ ] PdfExportService uses Puppeteer
- [ ] LogBundlerService creates ZIP
- [ ] ReportPreview renders both tabs
- [ ] Export buttons trigger downloads
- [ ] ANSI stripping works
- [ ] Summary statistics are accurate
- [ ] All formats validate
