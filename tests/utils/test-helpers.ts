/**
 * Test Utilities and Helpers
 *
 * REQ-006: Test Utilities
 * TAG-002: Async test helpers, custom matchers
 */

import { vi, beforeEach, afterEach } from 'vitest';

// ============================================================================
// Async Test Helpers
// ============================================================================

/**
 * Wait for a specified amount of time
 *
 * @param ms - Milliseconds to wait
 * @returns Promise that resolves after delay
 *
 * @example
 * ```typescript
 * await waitFor(1000); // Wait 1 second
 * ```
 */
export async function waitFor(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wait for condition to be true
 *
 * @param condition - Function that returns boolean
 * @param timeout - Maximum time to wait in ms
 * @param interval - Check interval in ms
 * @returns Promise that resolves when condition is true
 * @throws Error if timeout is reached
 *
 * @example
 * ```typescript
 * await waitForCondition(() => element.visible, 5000, 100);
 * ```
 */
export async function waitForCondition(
  condition: () => boolean,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (condition()) {
      return;
    }
    await waitFor(interval);
  }

  throw new Error(
    `Condition not met within ${timeout}ms`
  );
}

/**
 * Wait for async function to complete without error
 *
 * @param fn - Async function to execute
 * @param timeout - Maximum time to wait in ms
 * @returns Promise that resolves with function result
 * @throws Error if timeout is reached or function throws
 *
 * @example
 * ```typescript
 * const result = await waitForAsync(() => fetch('/api/data'), 3000);
 * ```
 */
export async function waitForAsync<T>(
  fn: () => Promise<T>,
  timeout: number = 5000
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout)
    ),
  ]);
}

// ============================================================================
// Timer Helpers
// ============================================================================

/**
 * Setup fake timers for testing
 *
 * @returns Vitest timer utilities
 *
 * @example
 * ```typescript
 * const timers = setupFakeTimers();
 * timers.advanceTimersByTime(1000);
 * timers.clearFakeTimers();
 * ```
 */
export function setupFakeTimers() {
  vi.useFakeTimers();

  return {
    advanceTimersByTime: (ms: number) => vi.advanceTimersByTime(ms),
    runAllTimers: () => vi.runAllTimers(),
    runOnlyPendingTimers: () => vi.runOnlyPendingTimers(),
    clearFakeTimers: () => {
      vi.useRealTimers();
    },
  };
}

/**
 * Setup fake timers that auto-cleanup after each test
 *
 * @example
 * ```typescript
 * describe('MyTest', () => {
 *   setupFakeTimersAuto();
 *   it('should work with timers', () => { ... });
 * });
 * ```
 */
export function setupFakeTimersAuto() {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });
}

// ============================================================================
// Mock Helpers
// ============================================================================

/**
 * Create a mock function that resolves with value
 *
 * @param value - Value to resolve with
 * @returns Mock function
 *
 * @example
 * ```typescript
 * const mockFetch = mockResolvedValue({ data: 'test' });
 * await mockFetch(); // { data: 'test' }
 * ```
 */
export function mockResolvedValue<T>(value: T): () => Promise<T> {
  return vi.fn(() => Promise.resolve(value));
}

/**
 * Create a mock function that rejects with error
 *
 * @param error - Error to reject with
 * @returns Mock function
 *
 * @example
 * ```typescript
 * const mockFetch = mockRejectedValue(new Error('Failed'));
 * try { await mockFetch(); } catch (e) { ... }
 * ```
 */
export function mockRejectedValue(
  error: Error | string
): () => Promise<never> {
  const err = typeof error === 'string' ? new Error(error) : error;
  return vi.fn(() => Promise.reject(err));
}

/**
 * Create a mock that tracks calls
 *
 * @returns Mock function with call tracking
 *
 * @example
 * ```typescript
 * const mock = createTrackedMock<void>(vi.fn());
 * mock();
 * expect(mock.callCount).toBe(1);
 * ```
 */
export function createTrackedMock<T>(mockFn: ReturnType<typeof vi.fn>) {
  return {
    fn: mockFn,
    get callCount(): number {
      return mockFn.mock.calls.length;
    },
    get lastCall(): unknown[] | undefined {
      return mockFn.mock.calls[mockFn.mock.calls.length - 1];
    },
    get calls(): unknown[][] {
      return mockFn.mock.calls;
    },
    calledWith(...args: unknown[]): boolean {
      return mockFn.mock.calls.some((call) =>
        call.every((arg, i) => arg === args[i])
      );
    },
  };
}

// ============================================================================
// DOM Helpers
// ============================================================================

/**
 * Wait for element to appear in DOM
 *
 * @param selector - CSS selector
 * @param timeout - Maximum time to wait in ms
 * @returns Promise that resolves with element
 * @throws Error if element not found
 *
 * @example
 * ```typescript
 * const element = await waitForElement('.my-class', 2000);
 * ```
 */
export async function waitForElement(
  selector: string,
  timeout: number = 5000
): Promise<Element> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const element = document.querySelector(selector);
    if (element) {
      return element;
    }
    await waitFor(100);
  }

  throw new Error(
    `Element "${selector}" not found within ${timeout}ms`
  );
}

/**
 * Check if element has class
 *
 * @param element - DOM element
 * @param className - Class name to check
 * @returns True if element has class
 *
 * @example
 * ```typescript
 * expect(hasClass(element, 'active')).toBe(true);
 * ```
 */
export function hasClass(element: Element, className: string): boolean {
  return element.classList.contains(className);
}

// ============================================================================
// Event Helpers
// ============================================================================

/**
 * Create a mock event
 *
 * @param type - Event type
 * @param props - Additional event properties
 * @returns Mock event object
 *
 * @example
 * ```typescript
 * const event = createMockEvent('click', { button: 0 });
 * ```
 */
export function createMockEvent<T extends keyof WindowEventMap>(
  type: T,
  props: Partial<WindowEventMap[T]> = {}
): Event {
  const eventInit: EventInit = {
    bubbles: true,
    cancelable: true,
    ...props,
  };

  // Create appropriate event type based on event category
  if (type.startsWith('key')) {
    return new KeyboardEvent(type, eventInit);
  } else if (type.startsWith('mouse') || type.startsWith('click')) {
    return new MouseEvent(type, eventInit);
  } else if (type.startsWith('touch')) {
    return new TouchEvent(type, eventInit);
  } else {
    return new Event(type, eventInit);
  }
}

/**
 * Fire a DOM event on element
 *
 * @param element - Target element
 * @param type - Event type
 * @param props - Additional event properties
 * @returns The created event
 *
 * @example
 * ```typescript
 * fireEvent(button, 'click', { button: 0 });
 * ```
 */
export function fireEvent<T extends keyof WindowEventMap>(
  element: Element | Window,
  type: T,
  props: Partial<WindowEventMap[T]> = {}
): boolean {
  const event = createMockEvent(type, props);
  return element.dispatchEvent(event);
}

// ============================================================================
// Console Helpers
// ============================================================================

/**
 * Spy on console methods
 *
 * @returns Spies for console methods
 *
 * @example
 * ```typescript
 * const spies = spyOnConsole();
 * console.error('test');
 * expect(spies.error).toHaveBeenCalledWith('test');
 * spies.restore();
 * ```
 */
export function spyOnConsole() {
  const spies = {
    log: vi.spyOn(console, 'log').mockImplementation(() => {}),
    error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
    info: vi.spyOn(console, 'info').mockImplementation(() => {}),
  };

  return {
    ...spies,
    restore: () => {
      Object.values(spies).forEach((spy) => spy.mockRestore());
    },
  };
}

/**
 * Suppress console output during test
 *
 * @returns Restore function
 *
 * @example
 * ```typescript
 * const restore = suppressConsole();
 * console.log('This will not appear');
 * restore();
 * ```
 */
export function suppressConsole(): () => void {
  const consoleSpies = spyOnConsole();
  return () => {
    consoleSpies.restore();
  };
}

// ============================================================================
// Custom Matchers
// ============================================================================

/**
 * Custom Vitest matchers
 */
export const customMatchers = {
  /**
   * Check if array is empty
   */
  toBeEmpty(received: unknown[]): boolean {
    return received.length === 0;
  },

  /**
   * Check if number is within range
   */
  toBeWithinRange(received: number, min: number, max: number): boolean {
    return received >= min && received <= max;
  },

  /**
   * Check if object has key
   */
  toHaveKey(received: Record<string, unknown>, key: string): boolean {
    return key in received;
  },

  /**
   * Check if promise resolves
   */
  async toResolve(promise: Promise<unknown>): Promise<boolean> {
    try {
      await promise;
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Check if promise rejects
   */
  async toReject(promise: Promise<unknown>): Promise<boolean> {
    try {
      await promise;
      return false;
    } catch {
      return true;
    }
  },
};
