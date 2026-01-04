/**
 * useHotkeys Hook Tests
 *
 * TAG-FUNC-002: useHotkeys Hook Implementation
 * SPEC-HOTKEYS-001
 *
 * Test custom hook for keyboard shortcut handling.
 * Ensures proper event listener registration, cleanup, and callback execution.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHotkeys } from '../useHotkeys';

describe('useHotkeys Hook', () => {
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Spy on window.addEventListener
    addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic hook functionality', () => {
    it('should register event listener on mount', () => {
      const callback = vi.fn();

      renderHook(() => useHotkeys('ctrl+s', callback));

      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function), expect.any(Object));
    });

    it('should cleanup event listener on unmount', () => {
      const callback = vi.fn();
      const { unmount } = renderHook(() => useHotkeys('ctrl+s', callback));

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function), expect.any(Object));
    });

    it('should not register listener if callback is undefined', () => {
      renderHook(() => useHotkeys('ctrl+s', undefined));

      expect(addEventListenerSpy).not.toHaveBeenCalled();
    });
  });

  describe('Callback execution', () => {
    it('should call callback when matching key is pressed', () => {
      const callback = vi.fn();

      renderHook(() => useHotkeys('ctrl+s', callback));

      // Get the registered event handler
      const eventHandler = addEventListenerSpy.mock.calls[0][1] as EventListener;

      // Simulate keyboard event
      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        metaKey: false,
      });

      act(() => {
        eventHandler(event);
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should not call callback for non-matching keys', () => {
      const callback = vi.fn();

      renderHook(() => useHotkeys('ctrl+s', callback));

      const eventHandler = addEventListenerSpy.mock.calls[0][1] as EventListener;

      // Simulate different key
      const event = new KeyboardEvent('keydown', {
        key: 'a',
        ctrlKey: true,
      });

      act(() => {
        eventHandler(event);
      });

      expect(callback).not.toHaveBeenCalled();
    });

    it('should prevent default behavior when enabled', () => {
      const callback = vi.fn();

      renderHook(() => useHotkeys('ctrl+s', callback, { preventDefault: true }));

      const eventHandler = addEventListenerSpy.mock.calls[0][1] as EventListener;

      // Create a mock event with preventDefault method
      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
      });

      // Spy on preventDefault
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      act(() => {
        eventHandler(event);
      });

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should not prevent default when disabled', () => {
      const callback = vi.fn();

      renderHook(() => useHotkeys('ctrl+s', callback, { preventDefault: false }));

      const eventHandler = addEventListenerSpy.mock.calls[0][1] as EventListener;

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
      });

      act(() => {
        eventHandler(event);
      });

      expect(event.defaultPrevented).toBe(false);
    });
  });

  describe('Platform-aware shortcuts', () => {
    it('should detect meta key for macOS shortcuts', () => {
      const callback = vi.fn();

      renderHook(() => useHotkeys('meta+s', callback));

      const eventHandler = addEventListenerSpy.mock.calls[0][1] as EventListener;

      const event = new KeyboardEvent('keydown', {
        key: 's',
        metaKey: true,
        ctrlKey: false,
      });

      act(() => {
        eventHandler(event);
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should accept both meta and ctrl for cross-platform compatibility', () => {
      const callback = vi.fn();

      renderHook(() => useHotkeys('ctrl+s', callback));

      const eventHandler = addEventListenerSpy.mock.calls[0][1] as EventListener;

      // Test with meta key (should also work for cross-platform)
      const event = new KeyboardEvent('keydown', {
        key: 's',
        metaKey: true,
        ctrlKey: false,
      });

      act(() => {
        eventHandler(event);
      });

      // Should trigger as fallback for cross-platform support
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('Key combination parsing', () => {
    it('should handle single key shortcuts', () => {
      const callback = vi.fn();

      renderHook(() => useHotkeys('escape', callback));

      const eventHandler = addEventListenerSpy.mock.calls[0][1] as EventListener;

      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
      });

      act(() => {
        eventHandler(event);
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple modifier keys', () => {
      const callback = vi.fn();

      renderHook(() => useHotkeys('ctrl+shift+s', callback));

      const eventHandler = addEventListenerSpy.mock.calls[0][1] as EventListener;

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        shiftKey: true,
      });

      act(() => {
        eventHandler(event);
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should be case-insensitive for key names', () => {
      const callback = vi.fn();

      renderHook(() => useHotkeys('CTRL+S', callback));

      const eventHandler = addEventListenerSpy.mock.calls[0][1] as EventListener;

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
      });

      act(() => {
        eventHandler(event);
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('Dependency updates', () => {
    it('should update callback when dependency changes', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const { rerender } = renderHook(
        ({ callback }) => useHotkeys('ctrl+s', callback),
        { initialProps: { callback: callback1 } }
      );

      // Get first event handler
      const eventHandler1 = addEventListenerSpy.mock.calls[0][1] as EventListener;

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
      });

      act(() => {
        eventHandler1(event);
      });

      expect(callback1).toHaveBeenCalledTimes(1);

      // Rerender with new callback
      rerender({ callback: callback2 });

      // The event listener should be re-registered
      const lastCallIndex = addEventListenerSpy.mock.calls.length - 1;
      const eventHandler2 = addEventListenerSpy.mock.calls[lastCallIndex][1] as EventListener;

      act(() => {
        eventHandler2(event);
      });

      expect(callback2).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge cases', () => {
    it('should handle undefined keys gracefully', () => {
      const callback = vi.fn();

      renderHook(() => useHotkeys('', callback));

      expect(addEventListenerSpy).not.toHaveBeenCalled();
    });

    it('should handle special keys like Enter', () => {
      const callback = vi.fn();

      renderHook(() => useHotkeys('enter', callback));

      const eventHandler = addEventListenerSpy.mock.calls[0][1] as EventListener;

      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
      });

      act(() => {
        eventHandler(event);
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should handle whitespace in input', () => {
      const callback = vi.fn();

      renderHook(() => useHotkeys(' ctrl + s ', callback));

      const eventHandler = addEventListenerSpy.mock.calls[0][1] as EventListener;

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
      });

      act(() => {
        eventHandler(event);
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });
});
