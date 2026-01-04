/**
 * SPEC Status Poller Service
 *
 * Tracks SPEC execution status and emits events for status changes.
 * Parses Claude CLI output to detect completion and errors.
 *
 * @module spec-status-poller.service
 */

import { EventEmitter } from 'events';
import type { SpecInfo, SpecStatus } from '../../shared/types';

/**
 * Status change event data
 */
export interface StatusChangeEvent {
  specId: string;
  status: SpecStatus;
  previousStatus: SpecStatus | undefined;
  timestamp: Date;
}

/**
 * Output parse result
 */
interface OutputParseResult {
  detectedStatus: SpecStatus | null;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * SPEC Status Poller Service
 *
 * Monitors SPEC execution status and emits events on changes.
 */
export class SpecStatusPollerService extends EventEmitter {
  private statusMap = new Map<string, SpecStatus>();
  private startTimeMap = new Map<string, Date>();

  constructor() {
    super();
    this.setMaxListeners(100); // Support many concurrent listeners
  }

  /**
   * Start tracking a set of SPECs
   *
   * Initializes all SPECs with 'pending' status.
   *
   * @param specs - Array of SpecInfo objects to track
   *
   * @example
   * ```typescript
   * const poller = new SpecStatusPollerService();
   * poller.start(specs);
   * ```
   */
  start(specs: SpecInfo[]): void {
    for (const spec of specs) {
      this.statusMap.set(spec.id, 'pending');
      this.startTimeMap.set(spec.id, new Date());
    }
  }

  /**
   * Update status for a SPEC
   *
   * Emits statusChange event if status has changed.
   *
   * @param specId - SPEC identifier
   * @param status - New status
   *
   * @example
   * ```typescript
   * poller.updateStatus('SPEC-001', 'running');
   * ```
   */
  updateStatus(specId: string, status: SpecStatus): void {
    const oldStatus = this.statusMap.get(specId);

    // Only emit if status changed
    if (oldStatus !== status) {
      this.statusMap.set(specId, status);

      const event: StatusChangeEvent = {
        specId,
        status,
        previousStatus: oldStatus,
        timestamp: new Date(),
      };

      this.emit('statusChange', event);
      this.emit(`status:${specId}`, event);
    }
  }

  /**
   * Parse output for status indicators
   *
   * Analyzes Claude CLI output to detect status changes.
   *
   * @param specId - SPEC identifier
   * @param output - Output string from Claude CLI
   *
   * @example
   * ```typescript
   * poller.parseOutputForStatus('SPEC-001', 'SPEC completed successfully');
   * ```
   */
  parseOutputForStatus(specId: string, output: string): void {
    const result = this.parseOutput(output);

    if (result.detectedStatus) {
      this.updateStatus(specId, result.detectedStatus);
    }
  }

  /**
   * Parse Claude CLI output for status markers
   *
   * Looks for specific patterns indicating success, failure, or in-progress state.
   *
   * @param output - Output string to parse
   * @returns Parse result with detected status and confidence
   */
  private parseOutput(output: string): OutputParseResult {
    const lowerOutput = output.toLowerCase();

    // Check for completion markers (high confidence)
    if (
      lowerOutput.includes('spec completed successfully') ||
      lowerOutput.includes('/moai:3-sync') ||
      lowerOutput.includes('implementation completed') ||
      lowerOutput.includes('all tests passed')
    ) {
      return { detectedStatus: 'completed', confidence: 'high' };
    }

    // Check for error markers (high confidence)
    if (
      lowerOutput.includes('error:') &&
      (lowerOutput.includes('fatal') || lowerOutput.includes('critical'))
    ) {
      return { detectedStatus: 'failed', confidence: 'high' };
    }

    // Check for failure patterns (medium confidence)
    if (
      lowerOutput.includes('failed') ||
      lowerOutput.includes('test failed') ||
      lowerOutput.includes('compilation error') ||
      lowerOutput.includes('runtime error')
    ) {
      return { detectedStatus: 'failed', confidence: 'medium' };
    }

    // Check for running indicators (medium confidence)
    if (
      lowerOutput.includes('running') ||
      lowerOutput.includes('executing') ||
      lowerOutput.includes('processing') ||
      lowerOutput.includes('implementing')
    ) {
      return { detectedStatus: 'running', confidence: 'medium' };
    }

    // No clear status detected
    return { detectedStatus: null, confidence: 'low' };
  }

  /**
   * Get current status for a SPEC
   *
   * @param specId - SPEC identifier
   * @returns Current status or undefined if not tracked
   */
  getStatus(specId: string): SpecStatus | undefined {
    return this.statusMap.get(specId);
  }

  /**
   * Get all tracked statuses
   *
   * @returns Map of specId to status
   */
  getAllStatuses(): Map<string, SpecStatus> {
    return new Map(this.statusMap);
  }

  /**
   * Get SPECs with a specific status
   *
   * @param status - Status to filter by
   * @returns Array of spec IDs with the given status
   */
  getSpecsWithStatus(status: SpecStatus): string[] {
    const result: string[] = [];
    for (const [specId, specStatus] of this.statusMap.entries()) {
      if (specStatus === status) {
        result.push(specId);
      }
    }
    return result;
  }

  /**
   * Check if a SPEC is complete (completed or failed)
   *
   * @param specId - SPEC identifier
   * @returns True if SPEC has reached terminal state
   */
  isComplete(specId: string): boolean {
    const status = this.statusMap.get(specId);
    return status === 'completed' || status === 'failed';
  }

  /**
   * Check if all SPECs are complete
   *
   * @returns True if all tracked SPECs have reached terminal state
   */
  areAllComplete(): boolean {
    for (const status of this.statusMap.values()) {
      if (status !== 'completed' && status !== 'failed') {
        return false;
      }
    }
    return true;
  }

  /**
   * Get execution duration for a SPEC
   *
   * @param specId - SPEC identifier
   * @returns Duration in milliseconds, or null if SPEC not started
   */
  getDuration(specId: string): number | null {
    const startTime = this.startTimeMap.get(specId);
    if (!startTime) {
      return null;
    }

    const endTime = this.isComplete(specId) ? new Date() : new Date();
    return endTime.getTime() - startTime.getTime();
  }

  /**
   * Stop tracking a SPEC
   *
   * Removes SPEC from tracking maps.
   *
   * @param specId - SPEC identifier
   */
  stopTracking(specId: string): void {
    this.statusMap.delete(specId);
    this.startTimeMap.delete(specId);
  }

  /**
   * Stop tracking all SPECs
   *
   * Clears all tracking maps.
   */
  stopAll(): void {
    this.statusMap.clear();
    this.startTimeMap.clear();
    this.removeAllListeners();
  }

  /**
   * Get completion statistics
   *
   * @returns Object with completion counts and percentages
   */
  getStats(): {
    total: number;
    completed: number;
    failed: number;
    running: number;
    pending: number;
    completionRate: number;
  } {
    let completed = 0;
    let failed = 0;
    let running = 0;
    let pending = 0;

    for (const status of this.statusMap.values()) {
      switch (status) {
        case 'completed':
          completed++;
          break;
        case 'failed':
          failed++;
          break;
        case 'running':
          running++;
          break;
        case 'pending':
          pending++;
          break;
      }
    }

    const total = this.statusMap.size;
    const completionRate = total > 0 ? ((completed + failed) / total) * 100 : 0;

    return {
      total,
      completed,
      failed,
      running,
      pending,
      completionRate: Math.round(completionRate * 100) / 100,
    };
  }

  /**
   * Register a listener for a specific SPEC
   *
   * @param specId - SPEC identifier to listen for
   * @param callback - Callback function for status changes
   *
   * @example
   * ```typescript
   * poller.onSpecChange('SPEC-001', (event) => {
   *   console.log(`${event.specId} is now ${event.status}`);
   * });
   * ```
   */
  onSpecChange(
    specId: string,
    callback: (event: StatusChangeEvent) => void
  ): void {
    this.on(`status:${specId}`, callback);
  }

  /**
   * Register a listener for any status change
   *
   * @param callback - Callback function for status changes
   *
   * @example
   * ```typescript
   * poller.onAnyChange((event) => {
   *   console.log(`${event.specId}: ${event.previousStatus} -> ${event.status}`);
   * });
   * ```
   */
  onAnyChange(callback: (event: StatusChangeEvent) => void): void {
    this.on('statusChange', callback);
  }

  /**
   * Export current state for serialization
   *
   * @returns Plain object representation of current state
   */
  exportState(): {
    statuses: Record<string, SpecStatus>;
    startTimes: Record<string, string>;
  } {
    const statuses: Record<string, SpecStatus> = {};
    const startTimes: Record<string, string> = {};

    for (const [specId, status] of this.statusMap.entries()) {
      statuses[specId] = status;
    }

    for (const [specId, time] of this.startTimeMap.entries()) {
      startTimes[specId] = time.toISOString();
    }

    return { statuses, startTimes };
  }

  /**
   * Import state from serialized data
   *
   * @param state - Serialized state object
   */
  importState(state: {
    statuses: Record<string, SpecStatus>;
    startTimes: Record<string, string>;
  }): void {
    this.stopAll();

    for (const [specId, status] of Object.entries(state.statuses)) {
      this.statusMap.set(specId, status);
    }

    for (const [specId, timeStr] of Object.entries(state.startTimes)) {
      this.startTimeMap.set(specId, new Date(timeStr));
    }
  }
}

/**
 * Create a SPEC status poller instance
 *
 * Factory function for creating SpecStatusPollerService.
 *
 * @returns SpecStatusPollerService instance
 *
 * @example
 * ```typescript
 * const poller = createStatusPoller();
 * poller.start(specs);
 * ```
 */
export function createStatusPoller(): SpecStatusPollerService {
  return new SpecStatusPollerService();
}
