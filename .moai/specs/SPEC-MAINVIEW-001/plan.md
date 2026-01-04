# Implementation Plan: SPEC-MAINVIEW-001

## Overview

Create the main application view with 6 interconnected components.

## Task Breakdown

### Task 1: Create MainView Container

```typescript
// src/renderer/components/main/MainView.tsx
import Terminal from './Terminal'
import SpecList from './SpecList'
import WaveVisualization from './WaveVisualization'
import ProgressOverview from './ProgressOverview'
import StatusBar from './StatusBar'

export default function MainView() {
  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* Header with controls */}
      <header className="h-14 glass-panel flex items-center px-4">
        <h1>Claude Parallel Runner</h1>
        <div className="ml-auto flex gap-2">
          {/* Scan, Analyze, Execute buttons */}
        </div>
      </header>

      {/* Main content grid */}
      <div className="flex-1 grid grid-cols-12 gap-4 p-4">
        {/* Left panel: SPEC list */}
        <aside className="col-span-3 glass-panel">
          <SpecList />
        </aside>

        {/* Center: Terminal + Waves */}
        <main className="col-span-6 flex flex-col gap-4">
          <div className="flex-1 glass-panel">
            <Terminal />
          </div>
          <div className="h-48 glass-panel">
            <WaveVisualization />
          </div>
        </main>

        {/* Right panel: Progress */}
        <aside className="col-span-3 glass-panel">
          <ProgressOverview />
        </aside>
      </div>

      {/* Status bar */}
      <StatusBar />
    </div>
  )
}
```

### Task 2: Create Terminal Component

```typescript
// src/renderer/components/main/Terminal.tsx
import { useEffect, useRef } from 'react'
import { Terminal as XTerm } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'

export default function Terminal() {
  const terminalRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<XTerm | null>(null)

  useEffect(() => {
    if (!terminalRef.current) return

    const terminal = new XTerm({
      theme: {
        background: '#0F172A',
        foreground: '#E2E8F0',
        cursor: '#FF6B35',
        cursorAccent: '#0F172A'
      },
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 14
    })

    const fitAddon = new FitAddon()
    terminal.loadAddon(fitAddon)
    terminal.open(terminalRef.current)
    fitAddon.fit()

    xtermRef.current = terminal

    // Handle resize
    const resizeObserver = new ResizeObserver(() => fitAddon.fit())
    resizeObserver.observe(terminalRef.current)

    return () => {
      terminal.dispose()
      resizeObserver.disconnect()
    }
  }, [])

  return (
    <div ref={terminalRef} className="w-full h-full" />
  )
}
```

### Task 3: Create SpecList Component

```typescript
// src/renderer/components/main/SpecList.tsx
import { useSessionStore } from '@/stores/sessionStore'
import type { SpecInfo } from '@/shared/types'

export default function SpecList() {
  const { specs, selectedSpecId, selectSpec } = useSessionStore()

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-slate-700">
        <h2 className="font-semibold">SPEC Files</h2>
        <input
          type="text"
          placeholder="Filter..."
          className="mt-2 w-full px-3 py-1 bg-slate-800 rounded"
        />
      </div>

      <ul className="flex-1 overflow-auto">
        {specs.map(spec => (
          <SpecListItem
            key={spec.id}
            spec={spec}
            isSelected={spec.id === selectedSpecId}
            onClick={() => selectSpec(spec.id)}
          />
        ))}
      </ul>
    </div>
  )
}
```

### Task 4: Create WaveVisualization Component

```typescript
// src/renderer/components/main/WaveVisualization.tsx
import { motion } from 'framer-motion'
import type { Wave } from '@/shared/types'

export default function WaveVisualization({ waves, currentWave }) {
  return (
    <div className="flex items-center gap-4 p-4 overflow-x-auto">
      {waves.map((wave, index) => (
        <motion.div
          key={wave.waveNumber}
          className={cn(
            'flex flex-col items-center gap-2 p-3 rounded-lg',
            index < currentWave && 'bg-emerald-900/50',
            index === currentWave && 'bg-anthropic/20 ring-2 ring-anthropic',
            index > currentWave && 'bg-slate-800/50'
          )}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <span className="text-sm text-slate-400">Wave {wave.waveNumber}</span>
          <div className="flex gap-1">
            {wave.specs.map(spec => (
              <SpecDot key={spec.id} spec={spec} />
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  )
}
```

### Task 5: Create ProgressOverview Component

Shows execution statistics and progress.

### Task 6: Create StatusBar Component

Bottom bar with status info and quick actions.

## File Structure

```
src/renderer/components/main/
├── MainView.tsx          (~100 lines)
├── Terminal.tsx          (~80 lines)
├── SpecList.tsx          (~90 lines)
├── WaveVisualization.tsx (~70 lines)
├── ProgressOverview.tsx  (~60 lines)
└── StatusBar.tsx         (~40 lines)
```

## Layout Grid

```
┌─────────────────────────────────────────────────────────┐
│  Header (controls)                                      │
├───────────┬─────────────────────────────┬───────────────┤
│           │                             │               │
│  SPEC     │     Terminal (xterm.js)     │   Progress    │
│  List     │                             │   Overview    │
│  (3 cols) │        (6 cols)             │   (3 cols)    │
│           ├─────────────────────────────┤               │
│           │   Wave Visualization        │               │
├───────────┴─────────────────────────────┴───────────────┤
│  Status Bar                                             │
└─────────────────────────────────────────────────────────┘
```

## Risk Analysis

| Risk | Mitigation |
|------|------------|
| Terminal performance | Use WebGL addon |
| Layout on small screens | Collapsible panels |
| Wave visualization overflow | Horizontal scroll |
| Real-time update lag | Debounce updates |

## Success Criteria

- All 6 components render correctly
- Terminal accepts input and shows output
- SPEC list updates in real-time
- Wave visualization animates smoothly
- Progress shows accurate statistics
- Layout is responsive to window size
