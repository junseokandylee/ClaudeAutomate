---
id: SPEC-AUTOMERGE-001
version: "1.0.0"
status: "draft"
created: "2026-01-04"
updated: "2026-01-04"
author: "MoAI-ADK"
priority: "HIGH"
---

## HISTORY

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-01-04 | MoAI-ADK | Initial SPEC creation |

# SPEC-AUTOMERGE-001: Auto Merge and Cleanup

## Overview

Automatically merge completed SPEC worktrees back to the main branch and clean up temporary worktrees and branches after successful implementation.

## Requirements

### REQ-001: Auto Merge Configuration (Ubiquitous)

The system shall support auto-merge configuration:
- auto_merge_enabled: boolean (default: true)
- merge_strategy: 'squash' | 'merge' | 'rebase'
- target_branch: string (default: 'main')
- require_tests_pass: boolean (default: true)

### REQ-002: Merge Trigger (Event-Driven)

When a SPEC session completes successfully, the system shall:
- Check if auto_merge is enabled
- Verify all tests passed (if required)
- Initiate merge process
- Update session status to 'merging'

### REQ-003: Merge Process (Ubiquitous)

The merge process shall:
- Switch to target branch (main)
- Pull latest changes
- Merge feature branch using configured strategy
- Handle merge conflicts (pause and notify user)
- Push merged changes to remote

### REQ-004: Worktree Cleanup (Event-Driven)

After successful merge, the system shall:
- Delete the worktree directory
- Delete the feature branch
- Update worktree registry
- Emit cleanup completion event

### REQ-005: Conflict Resolution UI (Event-Driven)

When merge conflict occurs, the system shall:
- Pause auto-merge process
- Display conflict notification
- Show conflicting files
- Provide manual resolution options
- Allow retry after resolution

### REQ-006: Batch Merge (Optional-Feature)

When multiple SPECs complete in same wave, the system shall:
- Optionally batch merge all completed SPECs
- Maintain merge order based on wave order
- Continue even if one merge fails

## Technical Constraints

- Must handle merge conflicts gracefully
- Preserve git history appropriately
- Support both local and remote operations

## Dependencies

- SPEC-SERVICES-001 (Worktree Manager)
- SPEC-SESSION-001 (Session completion events)

## Acceptance Criteria

See acceptance.md for detailed Given/When/Then scenarios.
