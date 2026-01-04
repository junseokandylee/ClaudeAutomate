/**
 * Core Services Module
 *
 * Exports all Main process services for SPEC management.
 */

// SPEC Scanner Service
export {
  scanSpecs,
  findSpecById,
  filterSpecsByStatus,
} from './spec-scanner.service';

// Dependency Analyzer Service
export {
  analyzeSpecs,
  getWaveSpecs,
  getWaveCount,
  canRunInParallel,
  validatePlan,
} from './dependency-analyzer.service';

// Worktree Manager Service
export {
  WorktreeManagerService,
  createWorktreeManager,
  type WorktreeInfo,
} from './worktree-manager.service';

// SPEC Status Poller Service
export {
  SpecStatusPollerService,
  createStatusPoller,
  type StatusChangeEvent,
} from './spec-status-poller.service';
