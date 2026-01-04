/**
 * Tests for Test Helpers
 *
 * REQ-006: Test Utilities
 * TAG-002: Async test helpers, custom matchers
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  waitFor,
  waitForCondition,
  waitForAsync,
  setupFakeTimers,
  setupFakeTimersAuto,
  mockResolvedValue,
  mockRejectedValue,
  createTrackedMock,
  waitForElement,
  hasClass,
  createMockEvent,
  fireEvent,
  spyOnConsole,
  suppressConsole,
  customMatchers,
} from './test-helpers';

describe('Test Helpers - REQ-006, TAG-002', () => {
  describe('waitFor', () => {
    it('should wait for specified time', async () => {
      const start = Date.now();
      await waitFor(100);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(90);
    });
  });

  describe('waitForCondition', () => {
    it('should resolve when condition becomes true', async () => {
      let condition = false;
      setTimeout(() => {
        condition = true;
      }, 100);

      await waitForCondition(() => condition, 500, 50);
      expect(condition).toBe(true);
    });

    it('should reject on timeout', async () => {
      await expect(
        waitForCondition(() => false, 100, 10)
      ).rejects.toThrow('Condition not met within 100ms');
    });

    it('should resolve immediately if already true', async () => {
      const start = Date.now();
      await waitForCondition(() => true, 5000, 100);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(100);
    });
  });

  describe('waitForAsync', () => {
    it('should wait for async function to resolve', async () => {
      const fn = async () => 'result';
      const result = await waitForAsync(fn, 1000);
      expect(result).toBe('result');
    });

    it('should reject on timeout', async () => {
      const fn = async () => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return 'result';
      };
      await expect(waitForAsync(fn, 100)).rejects.toThrow(
        'Timeout after 100ms'
      );
    });

    it('should handle errors from function', async () => {
      const fn = async () => {
        throw new Error('Function error');
      };
      await expect(waitForAsync(fn, 1000)).rejects.toThrow(
        'Function error'
      );
    });
  });

  describe('setupFakeTimers', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('should advance time', () => {
      const timers = setupFakeTimers();
      let called = false;
      setTimeout(() => {
        called = true;
      }, 1000);
      expect(called).toBe(false);
      timers.advanceTimersByTime(1000);
      expect(called).toBe(true);
      timers.clearFakeTimers();
    });

    it('should run all timers', () => {
      const timers = setupFakeTimers();
      let called = false;
      setTimeout(() => {
        called = true;
      }, 1000);
      timers.runAllTimers();
      expect(called).toBe(true);
      timers.clearFakeTimers();
    });
  });

  describe('setupFakeTimersAuto', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should auto-cleanup timers between tests', () => {
      let called = false;
      setTimeout(() => {
        called = true;
      }, 1000);
      vi.runAllTimers();
      expect(called).toBe(true);
    });
  });

  describe('mockResolvedValue', () => {
    it('should create mock that resolves with value', async () => {
      const mock = mockResolvedValue({ data: 'test' });
      const result = await mock();
      expect(result).toEqual({ data: 'test' });
    });
  });

  describe('mockRejectedValue', () => {
    it('should create mock that rejects with error string', async () => {
      const mock = mockRejectedValue('Error message');
      await expect(mock()).rejects.toThrow('Error message');
    });

    it('should create mock that rejects with error object', async () => {
      const mock = mockRejectedValue(new Error('Custom error'));
      await expect(mock()).rejects.toThrow('Custom error');
    });
  });

  describe('createTrackedMock', () => {
    it('should track call count', () => {
      const mockFn = vi.fn();
      const mock = createTrackedMock<void>(mockFn);
      expect(mock.callCount).toBe(0);
      mock.fn();
      expect(mock.callCount).toBe(1);
      mock.fn();
      mock.fn();
      expect(mock.callCount).toBe(3);
    });

    it('should track last call', () => {
      const mockFn = vi.fn();
      const mock = createTrackedMock<void>(mockFn);
      mock.fn('first');
      mock.fn('second');
      expect(mock.lastCall).toEqual(['second']);
    });

    it('should track all calls', () => {
      const mockFn = vi.fn();
      const mock = createTrackedMock<void>(mockFn);
      mock.fn('a', 'b');
      mock.fn('c', 'd');
      expect(mock.calls).toEqual([
        ['a', 'b'],
        ['c', 'd'],
      ]);
    });

    it('should check called with specific args', () => {
      const mockFn = vi.fn();
      const mock = createTrackedMock<void>(mockFn);
      mock.fn('test', 'value');
      expect(mock.calledWith('test', 'value')).toBe(true);
      expect(mock.calledWith('other', 'value')).toBe(false);
    });
  });

  describe('waitForElement', () => {
    it('should return immediately if element exists', async () => {
      const div = document.createElement('div');
      div.className = 'existing-element';
      document.body.appendChild(div);

      const element = await waitForElement('.existing-element', 100);
      expect(element).toBe(div);
      document.body.removeChild(div);
    });

    it('should timeout if element not found', async () => {
      await expect(waitForElement('.non-existent', 50)).rejects.toThrow(
        'Element ".non-existent" not found within 50ms'
      );
    });
  });

  describe('hasClass', () => {
    it('should return true if element has class', () => {
      const div = document.createElement('div');
      div.className = 'test-class other-class';
      expect(hasClass(div, 'test-class')).toBe(true);
    });

    it('should return false if element does not have class', () => {
      const div = document.createElement('div');
      div.className = 'other-class';
      expect(hasClass(div, 'test-class')).toBe(false);
    });
  });

  describe('createMockEvent', () => {
    it('should create mock event with type', () => {
      const event = createMockEvent('click');
      expect(event.type).toBe('click');
    });

    it('should create keyboard event', () => {
      const event = createMockEvent('keydown');
      expect(event instanceof KeyboardEvent).toBe(true);
      expect(event.type).toBe('keydown');
    });
  });

  describe('fireEvent', () => {
    it('should fire event on element', () => {
      const div = document.createElement('div');
      let called = false;
      div.addEventListener('click', () => {
        called = true;
      });
      const result = fireEvent(div, 'click');
      expect(called).toBe(true);
      expect(result).toBe(true);
    });

    it('should fire keyboard event', () => {
      const div = document.createElement('div');
      let receivedKey: string | undefined;
      div.addEventListener('keydown', (e) => {
        receivedKey = (e as KeyboardEvent).key;
      });
      fireEvent(div, 'keydown', { key: 'Enter' });
      expect(receivedKey).toBe('Enter');
    });
  });

  describe('spyOnConsole', () => {
    it('should spy on console methods', () => {
      const spies = spyOnConsole();
      console.log('test');
      expect(spies.log).toHaveBeenCalledWith('test');
      console.error('error');
      expect(spies.error).toHaveBeenCalledWith('error');
      spies.restore();
    });

    it('should restore console methods', () => {
      const originalLog = console.log;
      const spies = spyOnConsole();
      spies.restore();
      expect(console.log).toBe(originalLog);
    });
  });

  describe('suppressConsole', () => {
    it('should suppress console output', () => {
      const restore = suppressConsole();
      console.log('This should not appear');
      console.error('This should not appear either');
      restore();
    });
  });

  describe('customMatchers', () => {
    describe('toBeEmpty', () => {
      it('should return true for empty array', () => {
        expect(customMatchers.toBeEmpty([])).toBe(true);
      });

      it('should return false for non-empty array', () => {
        expect(customMatchers.toBeEmpty([1, 2, 3])).toBe(false);
      });
    });

    describe('toBeWithinRange', () => {
      it('should return true for number in range', () => {
        expect(customMatchers.toBeWithinRange(5, 1, 10)).toBe(true);
      });

      it('should return true for boundary values', () => {
        expect(customMatchers.toBeWithinRange(1, 1, 10)).toBe(true);
        expect(customMatchers.toBeWithinRange(10, 1, 10)).toBe(true);
      });

      it('should return false for number out of range', () => {
        expect(customMatchers.toBeWithinRange(0, 1, 10)).toBe(false);
        expect(customMatchers.toBeWithinRange(11, 1, 10)).toBe(false);
      });
    });

    describe('toHaveKey', () => {
      it('should return true if object has key', () => {
        expect(customMatchers.toHaveKey({ a: 1 }, 'a')).toBe(true);
      });

      it('should return false if object does not have key', () => {
        expect(customMatchers.toHaveKey({ a: 1 }, 'b')).toBe(false);
      });
    });

    describe('toResolve', () => {
      it('should return true for resolved promise', async () => {
        const result = await customMatchers.toResolve(Promise.resolve('success'));
        expect(result).toBe(true);
      });

      it('should return false for rejected promise', async () => {
        const result = await customMatchers.toResolve(Promise.reject(new Error('fail')));
        expect(result).toBe(false);
      });
    });

    describe('toReject', () => {
      it('should return true for rejected promise', async () => {
        const result = await customMatchers.toReject(Promise.reject(new Error('fail')));
        expect(result).toBe(true);
      });

      it('should return false for resolved promise', async () => {
        const result = await customMatchers.toReject(Promise.resolve('success'));
        expect(result).toBe(false);
      });
    });
  });
});
