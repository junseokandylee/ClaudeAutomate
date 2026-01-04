# Implementation Plan: SPEC-HOTKEYS-001

## Overview

Implement keyboard shortcuts system for efficient navigation and control.

## Task Breakdown

### Task 1: Create Hotkey Configuration

```typescript
// src/shared/hotkeys.ts
export interface HotkeyConfig {
  id: string
  description: string
  defaultKey: string
  macKey?: string  // Override for macOS
  category: 'global' | 'navigation' | 'execution' | 'specList'
  action: string
}

export const DEFAULT_HOTKEYS: HotkeyConfig[] = [
  // Global
  { id: 'scan', description: 'Scan for SPECs', defaultKey: 'ctrl+s', macKey: 'cmd+s', category: 'global', action: 'app.scan' },
  { id: 'execute', description: 'Execute plan', defaultKey: 'ctrl+e', macKey: 'cmd+e', category: 'global', action: 'app.execute' },
  { id: 'settings', description: 'Open Settings', defaultKey: 'ctrl+,', macKey: 'cmd+,', category: 'global', action: 'app.settings' },
  { id: 'quit', description: 'Quit application', defaultKey: 'ctrl+q', macKey: 'cmd+q', category: 'global', action: 'app.quit' },
  { id: 'close', description: 'Close dialog', defaultKey: 'escape', category: 'global', action: 'dialog.close' },

  // Navigation
  { id: 'focusSpecs', description: 'Focus SPEC list', defaultKey: 'ctrl+1', macKey: 'cmd+1', category: 'navigation', action: 'nav.focusSpecs' },
  { id: 'focusTerminal', description: 'Focus Terminal', defaultKey: 'ctrl+2', macKey: 'cmd+2', category: 'navigation', action: 'nav.focusTerminal' },
  { id: 'focusWaves', description: 'Focus Waves', defaultKey: 'ctrl+3', macKey: 'cmd+3', category: 'navigation', action: 'nav.focusWaves' },

  // Execution
  { id: 'start', description: 'Start execution', defaultKey: 'ctrl+enter', macKey: 'cmd+enter', category: 'execution', action: 'exec.start' },
  { id: 'stop', description: 'Stop all sessions', defaultKey: 'ctrl+shift+enter', macKey: 'cmd+shift+enter', category: 'execution', action: 'exec.stop' },
  { id: 'refresh', description: 'Refresh SPECs', defaultKey: 'ctrl+r', macKey: 'cmd+r', category: 'execution', action: 'exec.refresh' },

  // SPEC List
  { id: 'selectAll', description: 'Select all SPECs', defaultKey: 'ctrl+a', macKey: 'cmd+a', category: 'specList', action: 'specs.selectAll' },
  { id: 'showHelp', description: 'Show shortcuts', defaultKey: 'ctrl+/', macKey: 'cmd+/', category: 'global', action: 'app.showHelp' }
]
```

### Task 2: Create Hotkey Manager

```typescript
// src/renderer/hooks/useHotkeys.ts
import { useEffect, useCallback } from 'react'

export function useHotkeys(hotkeys: HotkeyConfig[], handlers: Record<string, () => void>) {
  const isMac = navigator.platform.includes('Mac')

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const key = buildKeyString(e, isMac)

    for (const hotkey of hotkeys) {
      const targetKey = isMac && hotkey.macKey ? hotkey.macKey : hotkey.defaultKey
      if (key === targetKey) {
        e.preventDefault()
        handlers[hotkey.action]?.()
        return
      }
    }
  }, [hotkeys, handlers, isMac])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

function buildKeyString(e: KeyboardEvent, isMac: boolean): string {
  const parts: string[] = []
  if (e.ctrlKey || (isMac && e.metaKey)) parts.push(isMac ? 'cmd' : 'ctrl')
  if (e.shiftKey) parts.push('shift')
  if (e.altKey) parts.push('alt')
  parts.push(e.key.toLowerCase())
  return parts.join('+')
}
```

### Task 3: Create Hotkey Help Overlay

```typescript
// src/renderer/components/dialogs/HotkeyHelpDialog.tsx
import { Dialog } from '@/components/ui'
import { DEFAULT_HOTKEYS } from '@/shared/hotkeys'

export default function HotkeyHelpDialog({ open, onClose }) {
  const isMac = navigator.platform.includes('Mac')

  const groupedHotkeys = DEFAULT_HOTKEYS.reduce((acc, hk) => {
    if (!acc[hk.category]) acc[hk.category] = []
    acc[hk.category].push(hk)
    return acc
  }, {} as Record<string, HotkeyConfig[]>)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <Dialog.Content className="glass-panel max-w-lg">
        <Dialog.Title>Keyboard Shortcuts</Dialog.Title>

        {Object.entries(groupedHotkeys).map(([category, hotkeys]) => (
          <div key={category} className="mt-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase">
              {category}
            </h3>
            <ul className="mt-2 space-y-1">
              {hotkeys.map(hk => (
                <li key={hk.id} className="flex justify-between">
                  <span>{hk.description}</span>
                  <kbd className="px-2 py-0.5 bg-slate-700 rounded text-sm">
                    {formatKey(isMac ? hk.macKey || hk.defaultKey : hk.defaultKey, isMac)}
                  </kbd>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Dialog.Content>
    </Dialog>
  )
}
```

### Task 4: Integrate with App

```typescript
// Update src/renderer/App.tsx
import { useHotkeys } from '@/hooks/useHotkeys'
import { DEFAULT_HOTKEYS } from '@/shared/hotkeys'

function App() {
  const [showHotkeyHelp, setShowHotkeyHelp] = useState(false)

  const hotkeyHandlers = {
    'app.scan': () => handleScan(),
    'app.execute': () => handleExecute(),
    'app.settings': () => openSettings(),
    'app.quit': () => window.electronAPI.quit(),
    'dialog.close': () => closeCurrentDialog(),
    'nav.focusSpecs': () => focusElement('spec-list'),
    'nav.focusTerminal': () => focusElement('terminal'),
    'nav.focusWaves': () => focusElement('waves'),
    'exec.start': () => startExecution(),
    'exec.stop': () => stopExecution(),
    'app.showHelp': () => setShowHotkeyHelp(true)
  }

  useHotkeys(DEFAULT_HOTKEYS, hotkeyHandlers)

  return (
    <>
      {/* ... rest of app */}
      <HotkeyHelpDialog open={showHotkeyHelp} onClose={() => setShowHotkeyHelp(false)} />
    </>
  )
}
```

### Task 5: Settings Customization (Optional)

Add hotkey customization to Settings:
- List all shortcuts
- Click to rebind
- Detect conflicts
- Reset button

## Shortcut Categories

| Category | Shortcuts | Context |
|----------|-----------|---------|
| Global | 5 | Works everywhere |
| Navigation | 3 | Panel focus switching |
| Execution | 3 | Start/stop actions |
| SPEC List | 2 | When list focused |

## Risk Analysis

| Risk | Mitigation |
|------|------------|
| OS conflicts | Test on all platforms |
| Focus issues | Proper focus management |
| Dialog interference | Check dialog state |

## Success Criteria

- All shortcuts work on Windows, macOS, Linux
- Platform-specific keys (Cmd/Ctrl) handled
- Help overlay shows all shortcuts
- Focus navigation works correctly
- No conflicts with OS shortcuts
