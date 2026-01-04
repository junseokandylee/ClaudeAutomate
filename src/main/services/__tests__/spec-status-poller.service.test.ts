/**
 * Tests for SPEC Status Poller Service
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  SpecStatusPollerService,
  createStatusPoller,
  type StatusChangeEvent,
} from '../spec-status-poller.service';
import type { SpecInfo } from '../../../shared/types';

describe('spec-status-poller.service', () => {
  let poller: SpecStatusPollerService;
  const mockSpecs: SpecInfo[] = [
    { id: 'SPEC-001', title: 'Test 1', filePath: '/path/1', status: 'pending', dependencies: [] },
    { id: 'SPEC-002', title: 'Test 2', filePath: '/path/2', status: 'pending', dependencies: [] },
    { id: 'SPEC-003', title: 'Test 3', filePath: '/path/3', status: 'pending', dependencies: [] },
  ];

  beforeEach(() => {
    poller = new SpecStatusPollerService();
  });

  afterEach(() => {
    poller.stopAll();
  });

  describe('start', () => {
    it('should initialize all specs with pending status', () => {
      poller.start(mockSpecs);

      expect(poller.getStatus('SPEC-001')).toBe('pending');
      expect(poller.getStatus('SPEC-002')).toBe('pending');
      expect(poller.getStatus('SPEC-003')).toBe('pending');
    });

    it('should track start times for all specs', () => {
      poller.start(mockSpecs);

      expect(poller.getDuration('SPEC-001')).toBeGreaterThanOrEqual(0);
      expect(poller.getDuration('SPEC-002')).toBeGreaterThanOrEqual(0);
    });
  });

  describe('updateStatus', () => {
    it('should update status and emit event on change', () => {
      poller.start(mockSpecs);
      const events: StatusChangeEvent[] = [];

      poller.onAnyChange((event) => events.push(event));

      poller.updateStatus('SPEC-001', 'running');

      expect(poller.getStatus('SPEC-001')).toBe('running');
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        specId: 'SPEC-001',
        status: 'running',
        previousStatus: 'pending',
      });
      expect(events[0].timestamp).toBeInstanceOf(Date);
    });

    it('should not emit event if status unchanged', () => {
      poller.start(mockSpecs);
      const events: StatusChangeEvent[] = [];

      poller.onAnyChange((event) => events.push(event));

      poller.updateStatus('SPEC-001', 'pending');
      poller.updateStatus('SPEC-001', 'pending');

      expect(events).toHaveLength(0);
    });

    it('should emit spec-specific events', () => {
      poller.start(mockSpecs);
      const events: StatusChangeEvent[] = [];

      poller.onSpecChange('SPEC-001', (event) => events.push(event));

      poller.updateStatus('SPEC-001', 'running');
      poller.updateStatus('SPEC-002', 'running');

      expect(events).toHaveLength(1);
      expect(events[0].specId).toBe('SPEC-001');
    });

    it('should track status transitions through multiple states', () => {
      poller.start(mockSpecs);
      const events: StatusChangeEvent[] = [];

      poller.onAnyChange((event) => events.push(event));

      poller.updateStatus('SPEC-001', 'running');
      poller.updateStatus('SPEC-001', 'completed');

      expect(events).toHaveLength(2);
      expect(events[0].status).toBe('running');
      expect(events[1].status).toBe('completed');
      expect(events[1].previousStatus).toBe('running');
    });
  });

  describe('parseOutputForStatus', () => {
    it('should detect completion from output', () => {
      poller.start(mockSpecs);

      poller.parseOutputForStatus('SPEC-001', 'SPEC completed successfully');

      expect(poller.getStatus('SPEC-001')).toBe('completed');
    });

    it('should detect completion from /moai:3-sync', () => {
      poller.start(mockSpecs);

      poller.parseOutputForStatus('SPEC-001', 'Executing /moai:3-sync SPEC-001');

      expect(poller.getStatus('SPEC-001')).toBe('completed');
    });

    it('should detect failure from error output', () => {
      poller.start(mockSpecs);

      poller.parseOutputForStatus('SPEC-001', 'ERROR: fatal error occurred');

      expect(poller.getStatus('SPEC-001')).toBe('failed');
    });

    it('should detect running status', () => {
      poller.start(mockSpecs);

      poller.parseOutputForStatus('SPEC-001', 'Running implementation...');

      expect(poller.getStatus('SPEC-001')).toBe('running');
    });

    it('should not update status for ambiguous output', () => {
      poller.start(mockSpecs);

      poller.parseOutputForStatus('SPEC-001', 'Some random text');

      expect(poller.getStatus('SPEC-001')).toBe('pending');
    });

    it('should detect test failures', () => {
      poller.start(mockSpecs);

      poller.parseOutputForStatus('SPEC-001', 'Test failed: expected true to be false');

      expect(poller.getStatus('SPEC-001')).toBe('failed');
    });

    it('should detect compilation errors', () => {
      poller.start(mockSpecs);

      poller.parseOutputForStatus('SPEC-001', 'Compilation error: missing semicolon');

      expect(poller.getStatus('SPEC-001')).toBe('failed');
    });

    it('should detect all tests passed', () => {
      poller.start(mockSpecs);

      poller.parseOutputForStatus('SPEC-001', 'All tests passed successfully');

      expect(poller.getStatus('SPEC-001')).toBe('completed');
    });
  });

  describe('getStatus', () => {
    it('should return undefined for untracked spec', () => {
      expect(poller.getStatus('SPEC-NONEXISTENT')).toBeUndefined();
    });
  });

  describe('getAllStatuses', () => {
    it('should return map of all statuses', () => {
      poller.start(mockSpecs);
      poller.updateStatus('SPEC-001', 'running');

      const statuses = poller.getAllStatuses();

      expect(statuses.size).toBe(3);
      expect(statuses.get('SPEC-001')).toBe('running');
      expect(statuses.get('SPEC-002')).toBe('pending');
      expect(statuses.get('SPEC-003')).toBe('pending');
    });

    it('should return a copy of the status map', () => {
      poller.start(mockSpecs);
      const statuses1 = poller.getAllStatuses();
      const statuses2 = poller.getAllStatuses();

      expect(statuses1).not.toBe(statuses2);
      expect(statuses1.get('SPEC-001')).toBe(statuses2.get('SPEC-001'));
    });
  });

  describe('getSpecsWithStatus', () => {
    it('should return specs with given status', () => {
      poller.start(mockSpecs);
      poller.updateStatus('SPEC-001', 'running');
      poller.updateStatus('SPEC-002', 'running');

      const runningSpecs = poller.getSpecsWithStatus('running');

      expect(runningSpecs).toHaveLength(2);
      expect(runningSpecs).toContain('SPEC-001');
      expect(runningSpecs).toContain('SPEC-002');
    });

    it('should return empty array when no specs match', () => {
      poller.start(mockSpecs);

      const completedSpecs = poller.getSpecsWithStatus('completed');

      expect(completedSpecs).toEqual([]);
    });
  });

  describe('isComplete', () => {
    it('should return true for completed spec', () => {
      poller.start(mockSpecs);
      poller.updateStatus('SPEC-001', 'completed');

      expect(poller.isComplete('SPEC-001')).toBe(true);
    });

    it('should return true for failed spec', () => {
      poller.start(mockSpecs);
      poller.updateStatus('SPEC-001', 'failed');

      expect(poller.isComplete('SPEC-001')).toBe(true);
    });

    it('should return false for running spec', () => {
      poller.start(mockSpecs);
      poller.updateStatus('SPEC-001', 'running');

      expect(poller.isComplete('SPEC-001')).toBe(false);
    });

    it('should return false for pending spec', () => {
      poller.start(mockSpecs);

      expect(poller.isComplete('SPEC-001')).toBe(false);
    });
  });

  describe('areAllComplete', () => {
    it('should return true when all specs are complete', () => {
      poller.start(mockSpecs);
      poller.updateStatus('SPEC-001', 'completed');
      poller.updateStatus('SPEC-002', 'completed');
      poller.updateStatus('SPEC-003', 'failed');

      expect(poller.areAllComplete()).toBe(true);
    });

    it('should return false when any spec is incomplete', () => {
      poller.start(mockSpecs);
      poller.updateStatus('SPEC-001', 'completed');
      poller.updateStatus('SPEC-002', 'running');

      expect(poller.areAllComplete()).toBe(false);
    });
  });

  describe('getDuration', () => {
    it('should return duration for running spec', (done) => {
      poller.start(mockSpecs);

      setTimeout(() => {
        const duration = poller.getDuration('SPEC-001');
        expect(duration).toBeGreaterThanOrEqual(50);
        done();
      }, 100);
    });

    it('should return null for untracked spec', () => {
      const duration = poller.getDuration('SPEC-NONEXISTENT');
      expect(duration).toBeNull();
    });
  });

  describe('stopTracking', () => {
    it('should remove spec from tracking', () => {
      poller.start(mockSpecs);
      expect(poller.getStatus('SPEC-001')).toBe('pending');

      poller.stopTracking('SPEC-001');

      expect(poller.getStatus('SPEC-001')).toBeUndefined();
    });
  });

  describe('stopAll', () => {
    it('should clear all tracking', () => {
      poller.start(mockSpecs);

      poller.stopAll();

      expect(poller.getStatus('SPEC-001')).toBeUndefined();
      expect(poller.getStatus('SPEC-002')).toBeUndefined();
      expect(poller.getStatus('SPEC-003')).toBeUndefined();
    });

    it('should remove all event listeners', () => {
      poller.start(mockSpecs);
      let callCount = 0;

      poller.onAnyChange(() => callCount++);

      poller.stopAll();
      poller.updateStatus('SPEC-001', 'running');

      expect(callCount).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return accurate statistics', () => {
      poller.start(mockSpecs);
      poller.updateStatus('SPEC-001', 'completed');
      poller.updateStatus('SPEC-002', 'failed');
      poller.updateStatus('SPEC-003', 'running');

      const stats = poller.getStats();

      expect(stats.total).toBe(3);
      expect(stats.completed).toBe(1);
      expect(stats.failed).toBe(1);
      expect(stats.running).toBe(1);
      expect(stats.pending).toBe(0);
      expect(stats.completionRate).toBeCloseTo(66.67, 1);
    });

    it('should return zeros when no specs tracked', () => {
      const stats = poller.getStats();

      expect(stats.total).toBe(0);
      expect(stats.completed).toBe(0);
      expect(stats.failed).toBe(0);
      expect(stats.running).toBe(0);
      expect(stats.pending).toBe(0);
      expect(stats.completionRate).toBe(0);
    });
  });

  describe('exportState/importState', () => {
    it('should export and import state', () => {
      poller.start(mockSpecs);
      poller.updateStatus('SPEC-001', 'running');

      const exported = poller.exportState();

      expect(exported.statuses['SPEC-001']).toBe('running');
      expect(exported.statuses['SPEC-002']).toBe('pending');
      expect(exported.startTimes['SPEC-001']).toBeDefined();

      const newPoller = new SpecStatusPollerService();
      newPoller.importState(exported);

      expect(newPoller.getStatus('SPEC-001')).toBe('running');
      expect(newPoller.getStatus('SPEC-002')).toBe('pending');

      newPoller.stopAll();
    });

    it('should clear existing state on import', () => {
      poller.start(mockSpecs);

      const emptyState = {
        statuses: {},
        startTimes: {},
      };

      poller.importState(emptyState);

      expect(poller.getStatus('SPEC-001')).toBeUndefined();
    });
  });

  describe('createStatusPoller', () => {
    it('should create SpecStatusPollerService instance', () => {
      const p = createStatusPoller();
      expect(p).toBeInstanceOf(SpecStatusPollerService);
      p.stopAll();
    });
  });

  describe('event listener limits', () => {
    it('should support many concurrent listeners', () => {
      poller.start(mockSpecs);

      // Add many listeners
      const listeners: (() => void)[] = [];
      for (let i = 0; i < 50; i++) {
        const fn = () => {};
        poller.onAnyChange(fn);
        listeners.push(fn);
      }

      // Should not throw
      poller.updateStatus('SPEC-001', 'running');

      // Cleanup
      listeners.forEach(() => poller.removeListener('statusChange', () => {}));
    });
  });
});
