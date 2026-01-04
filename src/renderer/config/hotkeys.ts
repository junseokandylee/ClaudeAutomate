/**
 * Hotkeys Configuration
 *
 * TAG-FUNC-003: Hotkeys Integration
 * SPEC-HOTKEYS-001
 *
 * Centralized hotkey configuration for the application.
 * Provides platform-aware keyboard shortcuts with categories and descriptions.
 *
 * Features:
 * - Global shortcuts (ubiquitous)
 * - Navigation shortcuts
 * - Execution shortcuts
 * - SPEC list shortcuts
 * - Help overlay shortcuts
 */

import { getPlatformModifier } from '@/renderer/utils/platform';

/**
 * Hotkey category
 */
export type HotkeyCategory =
  | 'global'
  | 'navigation'
  | 'execution'
  | 'spec-list'
  | 'help';

/**
 * Hotkey definition
 */
export interface HotkeyDefinition {
  /** Unique identifier */
  id: string;
  /** Category for grouping */
  category: HotkeyCategory;
  /** Key combination (platform-agnostic) */
  keys: string;
  /** Human-readable description */
  description: string;
  /** Callback function */
  action?: (event?: KeyboardEvent) => void;
  /** Whether to prevent default behavior */
  preventDefault?: boolean;
}

/**
 * Platform-specific key display
 */
export interface HotkeyDisplay {
  /** Display keys (e.g., "Cmd+S" or "Ctrl+S") */
  keys: string;
  /** Description */
  description: string;
}

/**
 * Convert hotkey definition to display format
 */
export function formatHotkey(keys: string): string {
  const modifier = getPlatformModifier(true);
  const modifierKey = getPlatformModifier(false);

  // Replace platform-agnostic modifier with platform-specific
  return keys
    .replace(/\bctrl\b/gi, modifier)
    .replace(/\bmeta\b/gi, modifier)
    .replace(/\bcmd\b/gi, modifier)
    .split('+')
    .map(key => {
      // Capitalize modifier keys
      if (key.toLowerCase() === modifierKey) {
        return modifier;
      }
      // Capitalize regular keys
      return key.charAt(0).toUpperCase() + key.slice(1);
    })
    .join('+');
}

/**
 * Default hotkeys configuration
 */
export const DEFAULT_HOTKEYS: HotkeyDefinition[] = [
  // Global Shortcuts (REQ-001)
  {
    id: 'scan-specs',
    category: 'global',
    keys: 'ctrl+s',
    description: 'hotkeys.scanSpecs',
    preventDefault: true,
  },
  {
    id: 'execute-plan',
    category: 'global',
    keys: 'ctrl+e',
    description: 'hotkeys.executePlan',
    preventDefault: true,
  },
  {
    id: 'open-settings',
    category: 'global',
    keys: 'ctrl+,',
    description: 'hotkeys.openSettings',
    preventDefault: true,
  },
  {
    id: 'quit-app',
    category: 'global',
    keys: 'ctrl+q',
    description: 'hotkeys.quitApp',
    preventDefault: true,
  },
  {
    id: 'close-dialog',
    category: 'global',
    keys: 'escape',
    description: 'hotkeys.closeDialog',
    preventDefault: true,
  },

  // Navigation Shortcuts (REQ-002)
  {
    id: 'focus-spec-list',
    category: 'navigation',
    keys: 'ctrl+1',
    description: 'hotkeys.focusSpecList',
    preventDefault: true,
  },
  {
    id: 'focus-terminal',
    category: 'navigation',
    keys: 'ctrl+2',
    description: 'hotkeys.focusTerminal',
    preventDefault: true,
  },
  {
    id: 'focus-wave',
    category: 'navigation',
    keys: 'ctrl+3',
    description: 'hotkeys.focusWave',
    preventDefault: true,
  },
  // Tab and Shift+Tab are handled by browser natively

  // Execution Shortcuts (REQ-003)
  {
    id: 'start-execution',
    category: 'execution',
    keys: 'ctrl+enter',
    description: 'hotkeys.startExecution',
    preventDefault: true,
  },
  {
    id: 'stop-all',
    category: 'execution',
    keys: 'ctrl+shift+enter',
    description: 'hotkeys.stopAll',
    preventDefault: true,
  },
  {
    id: 'refresh-specs',
    category: 'execution',
    keys: 'ctrl+r',
    description: 'hotkeys.refreshSpecs',
    preventDefault: true,
  },

  // SPEC List Shortcuts (REQ-004)
  {
    id: 'spec-up',
    category: 'spec-list',
    keys: 'arrowup',
    description: 'hotkeys.specUp',
    preventDefault: false,
  },
  {
    id: 'spec-down',
    category: 'spec-list',
    keys: 'arrowdown',
    description: 'hotkeys.specDown',
    preventDefault: false,
  },
  {
    id: 'spec-toggle',
    category: 'spec-list',
    keys: 'space',
    description: 'hotkeys.specToggle',
    preventDefault: true,
  },
  {
    id: 'spec-details',
    category: 'spec-list',
    keys: 'enter',
    description: 'hotkeys.specDetails',
    preventDefault: true,
  },
  {
    id: 'spec-select-all',
    category: 'spec-list',
    keys: 'ctrl+a',
    description: 'hotkeys.specSelectAll',
    preventDefault: true,
  },

  // Help Shortcuts (REQ-006)
  {
    id: 'show-shortcuts',
    category: 'help',
    keys: 'ctrl+/',
    description: 'hotkeys.showShortcuts',
    preventDefault: true,
  },
];

/**
 * Get hotkeys by category
 */
export function getHotkeysByCategory(category: HotkeyCategory): HotkeyDefinition[] {
  return DEFAULT_HOTKEYS.filter(h => h.category === category);
}

/**
 * Get hotkey by ID
 */
export function getHotkeyById(id: string): HotkeyDefinition | undefined {
  return DEFAULT_HOTKEYS.find(h => h.id === id);
}

/**
 * Get all hotkeys for display
 */
export function getAllHotkeysForDisplay(): HotkeyDisplay[] {
  return DEFAULT_HOTKEYS.map(hotkey => ({
    keys: formatHotkey(hotkey.keys),
    description: hotkey.description,
  }));
}
