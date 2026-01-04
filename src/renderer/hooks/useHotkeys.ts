/**
 * useHotkeys Hook
 *
 * TAG-FUNC-002: useHotkeys Hook Implementation
 * SPEC-HOTKEYS-001
 *
 * Custom React hook for keyboard shortcut handling.
 * Provides platform-aware keyboard event listeners with proper cleanup.
 *
 * Features:
 * - Register keyboard event listeners
 * - Automatic cleanup on unmount
 * - Platform-aware modifier key detection
 * - Prevent default behavior option
 * - Cross-platform compatibility (meta/ctrl)
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   useHotkeys('ctrl+s', () => {
 *     console.log('Save triggered');
 *   }, { preventDefault: true });
 *
 *   return <div>Press Ctrl+S to save</div>;
 * }
 * ```
 */

import { useEffect, useRef } from 'react';

/**
 * Hotkey options
 */
export interface UseHotkeysOptions {
  /** Whether to prevent default behavior */
  preventDefault?: boolean;
  /** Event listener options */
  capture?: boolean;
  /** Enable/disable the hotkey */
  enabled?: boolean;
}

/**
 * Parse hotkey string into key and modifiers
 *
 * @param hotkey - Hotkey string (e.g., "ctrl+s", "meta+shift+enter")
 * @returns Parsed key combination
 *
 * @example
 * ```ts
 * parseHotkey('ctrl+s') // { key: 's', ctrl: true, meta: false, shift: false, alt: false }
 * parseHotkey('meta+shift+enter') // { key: 'enter', ctrl: false, meta: true, shift: true, alt: false }
 * ```
 */
function parseHotkey(hotkey: string) {
  const keys = hotkey.toLowerCase().trim().split('+').map(k => k.trim());

  const result = {
    key: '',
    ctrl: false,
    meta: false,
    shift: false,
    alt: false,
  };

  for (const key of keys) {
    switch (key) {
      case 'ctrl':
      case 'control':
        result.ctrl = true;
        break;
      case 'meta':
      case 'cmd':
      case 'command':
        result.meta = true;
        break;
      case 'shift':
        result.shift = true;
        break;
      case 'alt':
      case 'option':
        result.alt = true;
        break;
      default:
        result.key = key;
    }
  }

  return result;
}

/**
 * Check if keyboard event matches hotkey
 *
 * @param event - Keyboard event
 * @param hotkey - Parsed hotkey object
 * @returns true if event matches hotkey
 */
function matchesHotkey(event: KeyboardEvent, hotkey: ReturnType<typeof parseHotkey>): boolean {
  // Check key match (case-insensitive)
  const keyMatch = event.key.toLowerCase() === hotkey.key;

  // Check modifiers
  const ctrlMatch = hotkey.ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey;
  const metaMatch = hotkey.meta ? (event.metaKey || event.ctrlKey) : !event.metaKey && !event.ctrlKey;
  const shiftMatch = hotkey.shift ? event.shiftKey : !event.shiftKey;
  const altMatch = hotkey.alt ? event.altKey : !event.altKey;

  // For cross-platform compatibility, allow either ctrl or meta when both are specified
  if (hotkey.ctrl || hotkey.meta) {
    const modifierPressed = event.ctrlKey || event.metaKey;
    const modifierRequired = hotkey.ctrl || hotkey.meta;

    return (
      keyMatch &&
      modifierRequired === modifierPressed &&
      shiftMatch &&
      altMatch
    );
  }

  return keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch;
}

/**
 * useHotkeys Hook
 *
 * Register keyboard shortcuts with automatic cleanup.
 *
 * @param hotkey - Hotkey string (e.g., "ctrl+s", "escape", "meta+shift+a")
 * @param callback - Function to call when hotkey is pressed
 * @param options - Hook options
 *
 * @example
 * ```tsx
 * // Single key
 * useHotkeys('escape', () => closeModal());
 *
 * // With modifier
 * useHotkeys('ctrl+s', () => saveFile(), { preventDefault: true });
 *
 * // Multiple modifiers
 * useHotkeys('ctrl+shift+s', () => saveAs(), { preventDefault: true });
 *
 * // Cross-platform (works with Cmd on Mac, Ctrl on Windows/Linux)
 * useHotkeys('ctrl+s', () => save());
 * ```
 */
export function useHotkeys(
  hotkey: string,
  callback?: (event: KeyboardEvent) => void,
  options: UseHotkeysOptions = {}
): void {
  const { preventDefault = false, capture = false, enabled = true } = options;

  // Use ref to avoid re-registering event listener on callback changes
  const callbackRef = useRef(callback);
  const hotkeyRef = useRef(hotkey);
  const optionsRef = useRef(options);

  // Update refs when props change
  useEffect(() => {
    callbackRef.current = callback;
    hotkeyRef.current = hotkey;
    optionsRef.current = options;
  }, [callback, hotkey, options]);

  useEffect(() => {
    // Don't register if hotkey is empty or callback is undefined
    if (!hotkey.trim() || !callback || !enabled) {
      return;
    }

    const parsedHotkey = parseHotkey(hotkey);

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if event matches hotkey
      if (matchesHotkey(event, parsedHotkey)) {
        // Prevent default if requested
        if (optionsRef.current.preventDefault) {
          event.preventDefault();
        }

        // Call callback
        callbackRef.current?.(event);
      }
    };

    // Register event listener
    window.addEventListener('keydown', handleKeyDown, { capture });

    // Cleanup function
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture });
    };
  }, [hotkey, preventDefault, capture, enabled]);
}
