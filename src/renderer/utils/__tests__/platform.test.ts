/**
 * Platform Utility Tests
 *
 * TAG-FUNC-001: Platform Detection Implementation
 * SPEC-HOTKEYS-001
 *
 * Test platform detection for keyboard shortcuts.
 * Ensures proper modifier key detection (Cmd vs Ctrl) across platforms.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getPlatformModifier, isMacPlatform, isWindowsPlatform, isLinuxPlatform } from '../platform';

describe('Platform Utility', () => {
  let originalPlatform: string;

  beforeEach(() => {
    // Store original platform
    originalPlatform = process.platform;
  });

  afterEach(() => {
    // Restore original platform
    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
    });
  });

  describe('isMacPlatform', () => {
    it('should return true on macOS (darwin)', () => {
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
      });

      expect(isMacPlatform()).toBe(true);
    });

    it('should return false on Windows', () => {
      Object.defineProperty(process, 'platform', {
        value: 'win32',
      });

      expect(isMacPlatform()).toBe(false);
    });

    it('should return false on Linux', () => {
      Object.defineProperty(process, 'platform', {
        value: 'linux',
      });

      expect(isMacPlatform()).toBe(false);
    });
  });

  describe('isWindowsPlatform', () => {
    it('should return true on Windows', () => {
      Object.defineProperty(process, 'platform', {
        value: 'win32',
      });

      expect(isWindowsPlatform()).toBe(true);
    });

    it('should return false on macOS', () => {
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
      });

      expect(isWindowsPlatform()).toBe(false);
    });

    it('should return false on Linux', () => {
      Object.defineProperty(process, 'platform', {
        value: 'linux',
      });

      expect(isWindowsPlatform()).toBe(false);
    });
  });

  describe('isLinuxPlatform', () => {
    it('should return true on Linux', () => {
      Object.defineProperty(process, 'platform', {
        value: 'linux',
      });

      expect(isLinuxPlatform()).toBe(true);
    });

    it('should return false on macOS', () => {
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
      });

      expect(isLinuxPlatform()).toBe(false);
    });

    it('should return false on Windows', () => {
      Object.defineProperty(process, 'platform', {
        value: 'win32',
      });

      expect(isLinuxPlatform()).toBe(false);
    });
  });

  describe('getPlatformModifier', () => {
    it('should return "meta" on macOS for Command key', () => {
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
      });

      expect(getPlatformModifier()).toBe('meta');
    });

    it('should return "ctrl" on Windows for Control key', () => {
      Object.defineProperty(process, 'platform', {
        value: 'win32',
      });

      expect(getPlatformModifier()).toBe('ctrl');
    });

    it('should return "ctrl" on Linux for Control key', () => {
      Object.defineProperty(process, 'platform', {
        value: 'linux',
      });

      expect(getPlatformModifier()).toBe('ctrl');
    });

    it('should default to "ctrl" for unknown platforms', () => {
      Object.defineProperty(process, 'platform', {
        value: 'freebsd',
      });

      expect(getPlatformModifier()).toBe('ctrl');
    });

    it('should provide human-readable modifier name', () => {
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
      });

      expect(getPlatformModifier(true)).toBe('Cmd');

      Object.defineProperty(process, 'platform', {
        value: 'win32',
      });

      expect(getPlatformModifier(true)).toBe('Ctrl');
    });
  });

  describe('Platform consistency', () => {
    it('should return consistent results across multiple calls', () => {
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
      });

      const firstCall = getPlatformModifier();
      const secondCall = getPlatformModifier();

      expect(firstCall).toBe(secondCall);
      expect(firstCall).toBe('meta');
    });
  });
});
