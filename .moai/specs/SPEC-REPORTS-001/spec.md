---
id: SPEC-REPORTS-001
version: "1.0.0"
status: "draft"
created: "2026-01-04"
updated: "2026-01-04"
author: "MoAI-ADK"
priority: "MEDIUM"
---

## HISTORY

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-01-04 | MoAI-ADK | Initial SPEC creation |

# SPEC-REPORTS-001: Execution Reports

## Overview

Generate comprehensive execution reports with statistics, logs, and timelines for completed parallel execution runs.

## Requirements

### REQ-001: Report Generation (Event-Driven)

When execution completes (all waves finished), the system shall:
- Generate HTML report automatically
- Save report to reports/ directory
- Include timestamp in filename
- Open report in default browser (optional)

### REQ-002: Report Content (Ubiquitous)

Each execution report shall include:
- Execution summary (total time, success rate)
- Wave-by-wave breakdown
- Per-SPEC details (duration, status, errors)
- Timeline visualization
- Error logs and stack traces

### REQ-003: Statistics Dashboard (Ubiquitous)

The report shall display statistics:
- Total SPECs: count
- Successful: count and percentage
- Failed: count and percentage
- Total execution time
- Average time per SPEC
- Parallelism efficiency

### REQ-004: Timeline Visualization (Ubiquitous)

The report shall include a Gantt-style timeline showing:
- Wave start/end times
- SPEC execution periods
- Parallel execution visualization
- Merge and cleanup phases

### REQ-005: Export Options (Optional-Feature)

The system shall support report export:
- HTML (default)
- JSON (machine-readable)
- Markdown (documentation)
- PDF (printable)

### REQ-006: Report History (Ubiquitous)

The system shall maintain report history:
- Store last 50 reports
- Allow viewing past reports
- Compare execution runs
- Auto-cleanup old reports

## Technical Constraints

- Reports must be self-contained HTML
- Large logs should be collapsible
- Support offline viewing

## Dependencies

- SPEC-SESSION-001 (Execution data)
- SPEC-SERVICES-001 (Status polling)

## Acceptance Criteria

See acceptance.md for detailed Given/When/Then scenarios.
