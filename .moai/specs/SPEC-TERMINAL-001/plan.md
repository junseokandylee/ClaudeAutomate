# Implementation Plan: SPEC-TERMINAL-001

## Overview

Implement advanced xterm.js features with addons and PTY integration.

## Task Breakdown

### Task 1: Enhanced Terminal Component

```typescript
// src/renderer/components/main/EnhancedTerminal.tsx
import { useEffect, useRef, useCallback, useState } from 'react'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { WebglAddon } from 'xterm-addon-webgl'
import { SearchAddon } from 'xterm-addon-search'
import { WebLinksAddon } from 'xterm-addon-web-links'
import { Unicode11Addon } from 'xterm-addon-unicode11'

interface Props {
  sessionId: string
  theme?: TerminalTheme
  fontSize?: number
}

export function EnhancedTerminal({ sessionId, theme, fontSize = 14 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const searchAddonRef = useRef<SearchAddon | null>(null)

  const [isSearchOpen, setIsSearchOpen] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return

    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'block',
      fontFamily: 'JetBrains Mono, Consolas, monospace',
      fontSize,
      scrollback: 10000,
      allowProposedApi: true,
      theme: theme || defaultTheme
    })

    // Load addons
    const fitAddon = new FitAddon()
    const searchAddon = new SearchAddon()
    const webLinksAddon = new WebLinksAddon()
    const unicodeAddon = new Unicode11Addon()

    term.loadAddon(fitAddon)
    term.loadAddon(searchAddon)
    term.loadAddon(webLinksAddon)
    term.loadAddon(unicodeAddon)
    term.unicode.activeVersion = '11'

    // Try WebGL, fallback to canvas
    try {
      const webglAddon = new WebglAddon()
      term.loadAddon(webglAddon)
    } catch (e) {
      console.warn('WebGL not available')
    }

    term.open(containerRef.current)
    fitAddon.fit()

    termRef.current = term
    fitAddonRef.current = fitAddon
    searchAddonRef.current = searchAddon

    // Resize observer
    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit()
    })
    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
      term.dispose()
    }
  }, [sessionId, fontSize])

  // Handle theme changes
  useEffect(() => {
    if (termRef.current && theme) {
      termRef.current.options.theme = theme
    }
  }, [theme])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        setIsSearchOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="relative h-full">
      <div ref={containerRef} className="h-full" />

      {isSearchOpen && (
        <TerminalSearch
          searchAddon={searchAddonRef.current}
          onClose={() => setIsSearchOpen(false)}
        />
      )}
    </div>
  )
}

const defaultTheme = {
  background: '#0F172A',
  foreground: '#E2E8F0',
  cursor: '#FF6B35',
  cursorAccent: '#0F172A',
  selectionBackground: '#334155',
  black: '#1E293B',
  red: '#EF4444',
  green: '#10B981',
  yellow: '#F59E0B',
  blue: '#3B82F6',
  magenta: '#A855F7',
  cyan: '#06B6D4',
  white: '#F1F5F9',
  brightBlack: '#475569',
  brightRed: '#F87171',
  brightGreen: '#34D399',
  brightYellow: '#FBBF24',
  brightBlue: '#60A5FA',
  brightMagenta: '#C084FC',
  brightCyan: '#22D3EE',
  brightWhite: '#FFFFFF'
}
```

### Task 2: Terminal Search Component

```typescript
// src/renderer/components/main/TerminalSearch.tsx
import { useState, useRef, useEffect } from 'react'
import { SearchAddon } from 'xterm-addon-search'
import { Input, Button } from '@/components/ui'

interface Props {
  searchAddon: SearchAddon | null
  onClose: () => void
}

export function TerminalSearch({ searchAddon, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [matchCount, setMatchCount] = useState(0)
  const [currentMatch, setCurrentMatch] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSearch = (forward: boolean) => {
    if (!searchAddon || !query) return

    const result = forward
      ? searchAddon.findNext(query)
      : searchAddon.findPrevious(query)

    // xterm search addon doesn't provide match count directly
    // We'd need to implement custom counting
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(!e.shiftKey)
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <div className="absolute top-2 right-2 flex items-center gap-2 bg-slate-800 p-2 rounded-lg shadow-lg">
      <Input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search..."
        className="w-48"
      />
      <Button size="sm" onClick={() => handleSearch(false)}>
        Prev
      </Button>
      <Button size="sm" onClick={() => handleSearch(true)}>
        Next
      </Button>
      <Button size="sm" variant="ghost" onClick={onClose}>
        X
      </Button>
    </div>
  )
}
```

### Task 3: PTY Session Manager

```typescript
// src/main/services/pty-session.service.ts
import * as pty from 'node-pty'
import os from 'os'

interface PTYSession {
  id: string
  process: pty.IPty
  outputBuffer: string[]
  scrollPosition: number
}

export class PTYSessionService {
  private sessions = new Map<string, PTYSession>()
  private maxBufferLines = 10000

  createSession(id: string, cwd: string): PTYSession {
    const shell = os.platform() === 'win32' ? 'powershell.exe' : 'zsh'

    const process = pty.spawn(shell, [], {
      name: 'xterm-256color',
      cols: 80,
      rows: 24,
      cwd,
      env: process.env as Record<string, string>
    })

    const session: PTYSession = {
      id,
      process,
      outputBuffer: [],
      scrollPosition: 0
    }

    process.onData((data) => {
      this.appendToBuffer(session, data)
      this.sendToRenderer(id, data)
    })

    this.sessions.set(id, session)
    return session
  }

  private appendToBuffer(session: PTYSession, data: string): void {
    const lines = data.split('\n')
    session.outputBuffer.push(...lines)

    // Trim buffer if too large
    if (session.outputBuffer.length > this.maxBufferLines) {
      session.outputBuffer = session.outputBuffer.slice(-this.maxBufferLines)
    }
  }

  resize(id: string, cols: number, rows: number): void {
    const session = this.sessions.get(id)
    session?.process.resize(cols, rows)
  }

  write(id: string, data: string): void {
    const session = this.sessions.get(id)
    session?.process.write(data)
  }

  getBuffer(id: string): string[] {
    return this.sessions.get(id)?.outputBuffer || []
  }

  destroy(id: string): void {
    const session = this.sessions.get(id)
    if (session) {
      session.process.kill()
      this.sessions.delete(id)
    }
  }
}
```

### Task 4: Theme Manager

```typescript
// src/renderer/services/terminal-theme.service.ts
export interface TerminalTheme {
  name: string
  background: string
  foreground: string
  cursor: string
  selection: string
  black: string
  red: string
  green: string
  yellow: string
  blue: string
  magenta: string
  cyan: string
  white: string
  brightBlack: string
  brightRed: string
  brightGreen: string
  brightYellow: string
  brightBlue: string
  brightMagenta: string
  brightCyan: string
  brightWhite: string
}

export const builtInThemes: Record<string, TerminalTheme> = {
  'moai-dark': {
    name: 'MoAI Dark',
    background: '#0F172A',
    foreground: '#E2E8F0',
    cursor: '#FF6B35',
    selection: '#334155',
    black: '#1E293B',
    red: '#EF4444',
    green: '#10B981',
    yellow: '#F59E0B',
    blue: '#3B82F6',
    magenta: '#A855F7',
    cyan: '#06B6D4',
    white: '#F1F5F9',
    brightBlack: '#475569',
    brightRed: '#F87171',
    brightGreen: '#34D399',
    brightYellow: '#FBBF24',
    brightBlue: '#60A5FA',
    brightMagenta: '#C084FC',
    brightCyan: '#22D3EE',
    brightWhite: '#FFFFFF'
  },
  'moai-light': {
    name: 'MoAI Light',
    background: '#FFFFFF',
    foreground: '#1E293B',
    cursor: '#FF6B35',
    selection: '#CBD5E1',
    black: '#1E293B',
    red: '#DC2626',
    green: '#059669',
    yellow: '#D97706',
    blue: '#2563EB',
    magenta: '#9333EA',
    cyan: '#0891B2',
    white: '#F1F5F9',
    brightBlack: '#64748B',
    brightRed: '#EF4444',
    brightGreen: '#10B981',
    brightYellow: '#F59E0B',
    brightBlue: '#3B82F6',
    brightMagenta: '#A855F7',
    brightCyan: '#06B6D4',
    brightWhite: '#FFFFFF'
  }
}

export class TerminalThemeService {
  private customThemes: Map<string, TerminalTheme> = new Map()

  getTheme(name: string): TerminalTheme | undefined {
    return builtInThemes[name] || this.customThemes.get(name)
  }

  saveCustomTheme(theme: TerminalTheme): void {
    this.customThemes.set(theme.name, theme)
    // Persist to storage
  }

  listThemes(): string[] {
    return [
      ...Object.keys(builtInThemes),
      ...Array.from(this.customThemes.keys())
    ]
  }
}
```

### Task 5: Split Terminal View

```typescript
// src/renderer/components/main/SplitTerminal.tsx
import { useState } from 'react'
import { EnhancedTerminal } from './EnhancedTerminal'

interface Pane {
  id: string
  sessionId: string
}

export function SplitTerminal() {
  const [panes, setPanes] = useState<Pane[]>([
    { id: 'main', sessionId: 'session-1' }
  ])
  const [splitDirection, setSplitDirection] = useState<'horizontal' | 'vertical'>('horizontal')

  const addPane = (sessionId: string) => {
    setPanes([...panes, { id: `pane-${Date.now()}`, sessionId }])
  }

  const removePane = (paneId: string) => {
    if (panes.length > 1) {
      setPanes(panes.filter(p => p.id !== paneId))
    }
  }

  return (
    <div
      className={`flex h-full ${
        splitDirection === 'horizontal' ? 'flex-row' : 'flex-col'
      }`}
    >
      {panes.map((pane, index) => (
        <div
          key={pane.id}
          className="flex-1 relative"
          style={{ minWidth: 200, minHeight: 100 }}
        >
          <EnhancedTerminal sessionId={pane.sessionId} />

          {panes.length > 1 && (
            <button
              className="absolute top-2 right-2 bg-red-500 rounded p-1"
              onClick={() => removePane(pane.id)}
            >
              Close
            </button>
          )}

          {index < panes.length - 1 && (
            <div
              className={`
                absolute bg-slate-600 cursor-${splitDirection === 'horizontal' ? 'col' : 'row'}-resize
                ${splitDirection === 'horizontal' ? 'right-0 top-0 bottom-0 w-1' : 'bottom-0 left-0 right-0 h-1'}
              `}
            />
          )}
        </div>
      ))}
    </div>
  )
}
```

## xterm.js Addons Used

| Addon | Purpose |
|-------|---------|
| FitAddon | Auto-resize terminal |
| WebglAddon | GPU acceleration |
| SearchAddon | Text search |
| WebLinksAddon | Clickable URLs |
| Unicode11Addon | Unicode support |

## Risk Analysis

| Risk | Mitigation |
|------|------------|
| WebGL unavailable | Canvas fallback |
| Large buffer memory | Buffer virtualization |
| Split pane complexity | Simple resize handles |

## Success Criteria

- Terminal renders ANSI colors correctly
- Copy/paste works natively
- Search finds matches
- Themes apply instantly
- Session persists across updates
