/**
 * Platform Utility
 *
 * TAG-FUNC-001: Platform Detection Implementation
 * SPEC-HOTKEYS-001
 *
 * Platform detection utilities for keyboard shortcuts.
 * Provides platform-aware modifier key detection (Cmd vs Ctrl).
 *
 * Features:
 * - Detect macOS, Windows, Linux platforms
 * - Return appropriate modifier key for keyboard shortcuts
 * - Provide human-readable modifier names
 *
 * @example
 * ```ts
 * import { getPlatformModifier } from '@/renderer/utils/platform';
 *
 * // On macOS: returns 'meta'
 * // On Windows/Linux: returns 'ctrl'
 * const modifier = getPlatformModifier();
 *
 * // Human-readable: 'Cmd' or 'Ctrl'
 * const modifierName = getPlatformModifier(true);
 * ```
 */

/**
 * Check if current platform is macOS (darwin)
 *
 * @returns true if running on macOS
 *
 * @example
 * ```ts
 * if (isMacPlatform()) {
 *   // Use Command key
 * }
 * ```
 */
export function isMacPlatform(): boolean {
  return process.platform === 'darwin';
}

/**
 * Check if current platform is Windows
 *
 * @returns true if running on Windows
 *
 * @example
 * ```ts
 * if (isWindowsPlatform()) {
 *   // Use Control key
 * }
 * ```
 */
export function isWindowsPlatform(): boolean {
  return process.platform === 'win32';
}

/**
 * Check if current platform is Linux
 *
 * @returns true if running on Linux
 *
 * @example
 * ```ts
 * if (isLinuxPlatform()) {
 *   // Use Control key
 * }
 * ```
 */
export function isLinuxPlatform(): boolean {
  return process.platform === 'linux';
}

/**
 * Get platform-specific modifier key for keyboard shortcuts
 *
 * @param humanReadable - If true, returns human-readable name (Cmd/Ctrl)
 * @returns Modifier key string: 'meta' for macOS, 'ctrl' for others
 *
 * @example
 * ```ts
 * // On macOS: returns 'meta'
 * // On Windows/Linux: returns 'ctrl'
 * const modifier = getPlatformModifier();
 *
 * // Human-readable: 'Cmd' on macOS, 'Ctrl' on others
 * const modifierName = getPlatformModifier(true);
 * ```
 */
export function getPlatformModifier(humanReadable = false): string {
  if (isMacPlatform()) {
    return humanReadable ? 'Cmd' : 'meta';
  }

  // Windows, Linux, and others use Ctrl
  return humanReadable ? 'Ctrl' : 'ctrl';
}
