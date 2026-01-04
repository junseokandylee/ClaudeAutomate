# Implementation Plan: SPEC-LOGGING-001

## Overview

Create comprehensive logging system with electron-log and Winston.

## Task Breakdown

### Task 1: Logger Configuration

```typescript
// src/main/services/logger.service.ts
import log from 'electron-log'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

export interface LogContext {
  module?: string
  sessionId?: string
  specId?: string
  [key: string]: unknown
}

class LoggerService {
  private static instance: LoggerService
  private currentLevel: LogLevel = 'info'

  private constructor() {
    this.configure()
  }

  static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService()
    }
    return LoggerService.instance
  }

  private configure(): void {
    const logsPath = path.join(app.getPath('userData'), 'logs')

    // Ensure logs directory exists
    if (!fs.existsSync(logsPath)) {
      fs.mkdirSync(logsPath, { recursive: true })
    }

    // Configure file transport
    log.transports.file.resolvePath = () => path.join(logsPath, 'main.log')
    log.transports.file.maxSize = 10 * 1024 * 1024 // 10MB
    log.transports.file.format = '{y}-{m}-{d} {h}:{i}:{s}.{ms} [{level}] {text}'

    // Configure console transport
    log.transports.console.format = '{h}:{i}:{s}.{ms} [{level}] {text}'
    log.transports.console.useStyles = true

    // Rotation: keep last 5 files
    log.transports.file.archiveLog = (file) => {
      const archivePath = `${file.toString()}.${Date.now()}.old`
      fs.renameSync(file.toString(), archivePath)
      this.cleanOldLogs(logsPath)
    }
  }

  private cleanOldLogs(logsPath: string): void {
    const files = fs.readdirSync(logsPath)
      .filter(f => f.endsWith('.old'))
      .sort()
      .reverse()

    // Keep only 5 archive files
    files.slice(5).forEach(file => {
      fs.unlinkSync(path.join(logsPath, file))
    })
  }

  setLevel(level: LogLevel): void {
    this.currentLevel = level
    log.transports.file.level = level
    log.transports.console.level = level
  }

  private formatMessage(message: string, context?: LogContext): string {
    if (!context) return message

    const contextStr = Object.entries(context)
      .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
      .join(' ')

    return `${message} | ${contextStr}`
  }

  debug(message: string, context?: LogContext): void {
    log.debug(this.formatMessage(message, context))
  }

  info(message: string, context?: LogContext): void {
    log.info(this.formatMessage(message, context))
  }

  warn(message: string, context?: LogContext): void {
    log.warn(this.formatMessage(message, context))
  }

  error(message: string, error?: Error, context?: LogContext): void {
    const fullMessage = error
      ? `${message}\n${error.stack || error.message}`
      : message
    log.error(this.formatMessage(fullMessage, context))
  }

  fatal(message: string, error?: Error, context?: LogContext): void {
    const fullMessage = error
      ? `${message}\n${error.stack || error.message}`
      : message
    log.error(`[FATAL] ${this.formatMessage(fullMessage, context)}`)
  }
}

export const logger = LoggerService.getInstance()
```

### Task 2: Renderer Logger

```typescript
// src/renderer/services/renderer-logger.ts
import log from 'electron-log/renderer'

export const rendererLogger = {
  debug: (message: string, context?: Record<string, unknown>) => {
    log.debug(formatMessage(message, context))
  },

  info: (message: string, context?: Record<string, unknown>) => {
    log.info(formatMessage(message, context))
  },

  warn: (message: string, context?: Record<string, unknown>) => {
    log.warn(formatMessage(message, context))
  },

  error: (message: string, error?: Error, context?: Record<string, unknown>) => {
    const fullMessage = error ? `${message}: ${error.message}` : message
    log.error(formatMessage(fullMessage, context))

    // Also send to main process for file logging
    window.electronAPI.logError({
      message: fullMessage,
      stack: error?.stack,
      context
    })
  }
}

function formatMessage(message: string, context?: Record<string, unknown>): string {
  if (!context) return message
  return `${message} | ${JSON.stringify(context)}`
}
```

### Task 3: Diagnostic Bundle Generator

```typescript
// src/main/services/diagnostic.service.ts
import { app } from 'electron'
import os from 'os'
import path from 'path'
import fs from 'fs/promises'
import archiver from 'archiver'

interface SystemInfo {
  platform: string
  arch: string
  version: string
  release: string
  totalMemory: number
  freeMemory: number
  cpus: os.CpuInfo[]
  uptime: number
}

export class DiagnosticService {
  private logsPath: string
  private configPath: string

  constructor() {
    this.logsPath = path.join(app.getPath('userData'), 'logs')
    this.configPath = path.join(app.getPath('userData'), 'config.json')
  }

  async generateBundle(outputPath: string): Promise<string> {
    const bundlePath = path.join(outputPath, `diagnostic-${Date.now()}.zip`)
    const output = require('fs').createWriteStream(bundlePath)
    const archive = archiver('zip', { zlib: { level: 9 } })

    return new Promise((resolve, reject) => {
      output.on('close', () => resolve(bundlePath))
      archive.on('error', reject)

      archive.pipe(output)

      // Add system info
      archive.append(JSON.stringify(this.getSystemInfo(), null, 2), {
        name: 'system-info.json'
      })

      // Add logs
      archive.directory(this.logsPath, 'logs')

      // Add sanitized config
      this.getSanitizedConfig().then(config => {
        archive.append(config, { name: 'config.json' })
        archive.finalize()
      })
    })
  }

  getSystemInfo(): SystemInfo {
    return {
      platform: os.platform(),
      arch: os.arch(),
      version: app.getVersion(),
      release: os.release(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      cpus: os.cpus(),
      uptime: os.uptime()
    }
  }

  private async getSanitizedConfig(): Promise<string> {
    try {
      const config = await fs.readFile(this.configPath, 'utf-8')
      const parsed = JSON.parse(config)

      // Remove sensitive data
      delete parsed.apiKeys
      delete parsed.credentials

      return JSON.stringify(parsed, null, 2)
    } catch {
      return '{}'
    }
  }

  async getRecentErrors(count = 50): Promise<string[]> {
    const logPath = path.join(this.logsPath, 'main.log')

    try {
      const content = await fs.readFile(logPath, 'utf-8')
      const lines = content.split('\n')

      return lines
        .filter(line => line.includes('[error]') || line.includes('[FATAL]'))
        .slice(-count)
    } catch {
      return []
    }
  }
}
```

### Task 4: Debug Mode Service

```typescript
// src/main/services/debug-mode.service.ts
import { logger } from './logger.service'
import { ipcMain } from 'electron'

export class DebugModeService {
  private enabled = false
  private ipcTracing = false

  enable(): void {
    this.enabled = true
    logger.setLevel('debug')
    logger.info('Debug mode enabled')

    // Enable IPC tracing
    this.enableIPCTracing()
  }

  disable(): void {
    this.enabled = false
    logger.setLevel('info')
    this.disableIPCTracing()
    logger.info('Debug mode disabled')
  }

  toggle(): boolean {
    if (this.enabled) {
      this.disable()
    } else {
      this.enable()
    }
    return this.enabled
  }

  isEnabled(): boolean {
    return this.enabled
  }

  private enableIPCTracing(): void {
    if (this.ipcTracing) return

    const originalHandle = ipcMain.handle.bind(ipcMain)
    ipcMain.handle = (channel: string, listener: any) => {
      return originalHandle(channel, async (event, ...args) => {
        const start = performance.now()
        logger.debug(`IPC[${channel}] called`, { args: this.sanitizeArgs(args) })

        try {
          const result = await listener(event, ...args)
          const duration = performance.now() - start
          logger.debug(`IPC[${channel}] completed`, { duration: `${duration.toFixed(2)}ms` })
          return result
        } catch (error) {
          const duration = performance.now() - start
          logger.error(`IPC[${channel}] failed`, error as Error, { duration: `${duration.toFixed(2)}ms` })
          throw error
        }
      })
    }

    this.ipcTracing = true
  }

  private disableIPCTracing(): void {
    // Would need to restore original ipcMain.handle
    this.ipcTracing = false
  }

  private sanitizeArgs(args: unknown[]): unknown[] {
    return args.map(arg => {
      if (typeof arg === 'string' && arg.length > 100) {
        return `${arg.substring(0, 100)}...`
      }
      return arg
    })
  }
}
```

### Task 5: Log Viewer Component

```typescript
// src/renderer/components/dialogs/LogViewer.tsx
import { useState, useEffect } from 'react'
import { Dialog } from '@/components/ui'

interface LogEntry {
  timestamp: string
  level: string
  message: string
}

export function LogViewer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (open) {
      window.electronAPI.getRecentLogs(100).then(setLogs)
    }
  }, [open])

  const filteredLogs = logs.filter(log => {
    const matchesLevel = filter === 'all' || log.level === filter
    const matchesSearch = !search || log.message.toLowerCase().includes(search.toLowerCase())
    return matchesLevel && matchesSearch
  })

  const levelColors = {
    debug: 'text-slate-400',
    info: 'text-blue-400',
    warn: 'text-amber-400',
    error: 'text-red-400',
    fatal: 'text-red-600'
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <Dialog.Content className="max-w-4xl max-h-[80vh]">
        <Dialog.Title>Log Viewer</Dialog.Title>

        <div className="flex gap-4 mb-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-slate-700 rounded px-2 py-1"
          >
            <option value="all">All Levels</option>
            <option value="debug">Debug</option>
            <option value="info">Info</option>
            <option value="warn">Warn</option>
            <option value="error">Error</option>
          </select>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search logs..."
            className="flex-1 bg-slate-700 rounded px-2 py-1"
          />
        </div>

        <div className="h-96 overflow-auto font-mono text-sm">
          {filteredLogs.map((log, i) => (
            <div key={i} className="py-0.5 hover:bg-slate-700/50">
              <span className="text-slate-500">{log.timestamp}</span>
              <span className={`mx-2 ${levelColors[log.level as keyof typeof levelColors]}`}>
                [{log.level.toUpperCase()}]
              </span>
              <span className="text-slate-300">{log.message}</span>
            </div>
          ))}
        </div>
      </Dialog.Content>
    </Dialog>
  )
}
```

## Log Format

```
2026-01-04 10:15:23.456 [info] Session started | sessionId="abc123" specId="SPEC-AUTH-001"
2026-01-04 10:15:24.789 [error] Session failed: Connection timeout | sessionId="abc123"
```

## Risk Analysis

| Risk | Mitigation |
|------|------------|
| Large log files | Size-based rotation |
| Sensitive data leak | Sanitization |
| Performance impact | Async logging |

## Success Criteria

- All log levels work correctly
- File rotation prevents disk fill
- Debug mode enables verbose output
- Diagnostic bundle is generated
- Log viewer displays entries
