# Implementation Plan: SPEC-PERFORMANCE-001

## Overview

Implement comprehensive performance optimization across all application layers.

## Task Breakdown

### Task 1: Memory Monitor Service

```typescript
// src/main/services/memory-monitor.service.ts
import { memoryUsage, cpuUsage } from 'process'

export class MemoryMonitorService {
  private warningThreshold = 0.8  // 80% of available
  private criticalThreshold = 0.9  // 90%
  private pollingInterval = 5000  // 5 seconds

  private sessionMemory = new Map<string, number>()

  start(): void {
    setInterval(() => this.checkMemory(), this.pollingInterval)
  }

  private async checkMemory(): Promise<void> {
    const usage = memoryUsage()
    const heapUsed = usage.heapUsed / usage.heapTotal

    if (heapUsed > this.criticalThreshold) {
      this.emitCriticalMemoryWarning()
      await this.forceGarbageCollection()
    } else if (heapUsed > this.warningThreshold) {
      this.emitMemoryWarning(heapUsed)
    }
  }

  trackSessionMemory(sessionId: string): void {
    const baseline = memoryUsage().heapUsed
    this.sessionMemory.set(sessionId, baseline)
  }

  getSessionMemoryDelta(sessionId: string): number {
    const baseline = this.sessionMemory.get(sessionId) || 0
    return memoryUsage().heapUsed - baseline
  }

  cleanupSession(sessionId: string): void {
    this.sessionMemory.delete(sessionId)
  }
}
```

### Task 2: Terminal Buffer Manager

```typescript
// src/renderer/services/terminal-buffer.service.ts
export class TerminalBufferService {
  private maxLines = 10000
  private archiveThreshold = 8000
  private lines: string[] = []
  private archivedChunks: string[] = []

  addLine(line: string): void {
    this.lines.push(line)

    if (this.lines.length > this.maxLines) {
      this.archiveOldLines()
    }
  }

  private archiveOldLines(): void {
    const toArchive = this.lines.splice(0, this.archiveThreshold)
    this.archivedChunks.push(this.compress(toArchive.join('\n')))
  }

  getRecentLines(count: number): string[] {
    return this.lines.slice(-count)
  }

  async loadArchivedChunk(index: number): Promise<string> {
    return this.decompress(this.archivedChunks[index])
  }

  getTotalLineCount(): number {
    return this.lines.length + this.archivedChunks.length * this.archiveThreshold
  }

  clear(): void {
    this.lines = []
    this.archivedChunks = []
  }
}
```

### Task 3: Optimized Terminal Component

```typescript
// src/renderer/components/main/OptimizedTerminal.tsx
import { useEffect, useRef, useCallback, memo } from 'react'
import { Terminal } from 'xterm'
import { WebglAddon } from 'xterm-addon-webgl'
import { FitAddon } from 'xterm-addon-fit'

interface Props {
  sessionId: string
  output: string[]
}

export const OptimizedTerminal = memo(function OptimizedTerminal({
  sessionId,
  output
}: Props) {
  const termRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<Terminal | null>(null)
  const batchBufferRef = useRef<string[]>([])
  const rafIdRef = useRef<number>(0)

  useEffect(() => {
    if (!termRef.current) return

    const term = new Terminal({
      allowProposedApi: true,
      scrollback: 10000,
      fastScrollModifier: 'alt',
      fastScrollSensitivity: 5
    })

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)

    // Use WebGL for GPU acceleration
    try {
      const webglAddon = new WebglAddon()
      term.loadAddon(webglAddon)
    } catch {
      console.warn('WebGL not available, using canvas renderer')
    }

    term.open(termRef.current)
    fitAddon.fit()
    xtermRef.current = term

    return () => {
      term.dispose()
    }
  }, [sessionId])

  // Batch output writes using RAF
  const flushBuffer = useCallback(() => {
    if (batchBufferRef.current.length > 0 && xtermRef.current) {
      xtermRef.current.write(batchBufferRef.current.join(''))
      batchBufferRef.current = []
    }
    rafIdRef.current = 0
  }, [])

  useEffect(() => {
    if (output.length === 0) return

    batchBufferRef.current.push(...output)

    if (!rafIdRef.current) {
      rafIdRef.current = requestAnimationFrame(flushBuffer)
    }
  }, [output, flushBuffer])

  return <div ref={termRef} className="h-full" />
}, (prev, next) => prev.sessionId === next.sessionId)
```

### Task 4: Virtualized SPEC List

```typescript
// src/renderer/components/main/VirtualizedSpecList.tsx
import { useVirtualizer } from '@tanstack/react-virtual'
import { memo, useRef } from 'react'

interface Props {
  specs: SpecInfo[]
  selectedIds: Set<string>
  onSelect: (id: string) => void
}

export const VirtualizedSpecList = memo(function VirtualizedSpecList({
  specs,
  selectedIds,
  onSelect
}: Props) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: specs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,  // Estimated row height
    overscan: 5
  })

  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div
        style={{ height: virtualizer.getTotalSize(), position: 'relative' }}
      >
        {virtualizer.getVirtualItems().map(virtualItem => {
          const spec = specs[virtualItem.index]
          return (
            <SpecListItem
              key={spec.id}
              spec={spec}
              selected={selectedIds.has(spec.id)}
              onClick={() => onSelect(spec.id)}
              style={{
                position: 'absolute',
                top: virtualItem.start,
                height: virtualItem.size,
                width: '100%'
              }}
            />
          )
        })}
      </div>
    </div>
  )
})
```

### Task 5: IPC Batch Manager

```typescript
// src/main/services/ipc-batch.service.ts
export class IPCBatchService {
  private batchWindow = 100  // ms
  private batches = new Map<string, unknown[]>()
  private timers = new Map<string, NodeJS.Timeout>()

  queueMessage(channel: string, data: unknown): void {
    if (!this.batches.has(channel)) {
      this.batches.set(channel, [])
    }

    this.batches.get(channel)!.push(data)

    if (!this.timers.has(channel)) {
      const timer = setTimeout(() => this.flush(channel), this.batchWindow)
      this.timers.set(channel, timer)
    }
  }

  private flush(channel: string): void {
    const batch = this.batches.get(channel) || []
    this.batches.delete(channel)
    this.timers.delete(channel)

    if (batch.length > 0) {
      this.sendBatch(channel, batch)
    }
  }

  private sendBatch(channel: string, data: unknown[]): void {
    const windows = BrowserWindow.getAllWindows()
    windows.forEach(win => {
      win.webContents.send(`${channel}:batch`, data)
    })
  }
}
```

### Task 6: Resource Throttle Manager

```typescript
// src/main/services/resource-throttle.service.ts
import os from 'os'

export class ResourceThrottleService {
  private cpuThreshold = 0.8
  private memoryThreshold = 0.8
  private checkInterval = 2000

  private lastCpuUsage = process.cpuUsage()
  private lastCpuCheck = Date.now()

  isResourcesAvailable(): boolean {
    return this.getCpuUsage() < this.cpuThreshold &&
           this.getMemoryUsage() < this.memoryThreshold
  }

  getCpuUsage(): number {
    const now = Date.now()
    const elapsed = now - this.lastCpuCheck
    const cpuUsage = process.cpuUsage(this.lastCpuUsage)

    const totalUsage = (cpuUsage.user + cpuUsage.system) / 1000
    const percentage = totalUsage / elapsed

    this.lastCpuUsage = process.cpuUsage()
    this.lastCpuCheck = now

    return percentage
  }

  getMemoryUsage(): number {
    const total = os.totalmem()
    const free = os.freemem()
    return (total - free) / total
  }

  getMaxConcurrentSessions(): number {
    const availableMemory = os.freemem()
    const sessionMemory = 100 * 1024 * 1024  // 100MB per session
    const cpuCores = os.cpus().length

    const memoryLimit = Math.floor(availableMemory / sessionMemory)
    const cpuLimit = cpuCores * 2

    return Math.min(memoryLimit, cpuLimit, 10)  // Max 10 sessions
  }
}
```

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Startup time | < 2s | Time to interactive |
| Memory per session | < 100MB | Peak memory during run |
| Terminal FPS | > 30fps | During output streaming |
| SPEC list scroll | 60fps | Virtual list performance |
| IPC latency | < 50ms | Message round-trip |

## Risk Analysis

| Risk | Mitigation |
|------|------------|
| WebGL not supported | Canvas fallback |
| Memory leaks | Periodic cleanup |
| CPU spikes | Throttle sessions |

## Success Criteria

- Application remains responsive with 10 concurrent sessions
- No memory growth over time
- Terminal renders smoothly
- UI updates don't block main thread
