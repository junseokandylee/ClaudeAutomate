# Implementation Plan: SPEC-CONFIG-001

## Overview

Create typed configuration management with validation and migration.

## Task Breakdown

### Task 1: Configuration Schema Definition

```typescript
// src/shared/config.schema.ts
import { z } from 'zod'

export const ConfigSchema = z.object({
  version: z.string().default('1.0.0'),

  general: z.object({
    language: z.enum(['en', 'ko', 'ja', 'zh']).default('en'),
    theme: z.enum(['dark', 'light', 'system']).default('dark'),
    autoUpdate: z.boolean().default(true),
    telemetry: z.boolean().default(false)
  }).default({}),

  execution: z.object({
    maxParallelSessions: z.number().int().min(1).max(10).default(5),
    sessionTimeout: z.number().int().min(60).max(3600).default(300),
    autoRetry: z.boolean().default(true),
    retryCount: z.number().int().min(0).max(5).default(3)
  }).default({}),

  terminal: z.object({
    fontSize: z.number().int().min(8).max(32).default(14),
    fontFamily: z.string().default('JetBrains Mono, monospace'),
    scrollback: z.number().int().min(1000).max(100000).default(10000),
    cursorBlink: z.boolean().default(true),
    theme: z.string().default('moai-dark')
  }).default({}),

  git: z.object({
    autoMerge: z.boolean().default(false),
    autoCleanup: z.boolean().default(false),
    commitPrefix: z.string().default('feat(spec):'),
    branchPrefix: z.string().default('feature/')
  }).default({}),

  notifications: z.object({
    enabled: z.boolean().default(true),
    sound: z.boolean().default(true),
    showOnStart: z.boolean().default(true),
    showOnComplete: z.boolean().default(true),
    showOnError: z.boolean().default(true)
  }).default({})
})

export type AppConfig = z.infer<typeof ConfigSchema>

export const DEFAULT_CONFIG: AppConfig = ConfigSchema.parse({})
```

### Task 2: Configuration Service

```typescript
// src/main/services/config.service.ts
import Store from 'electron-store'
import { z } from 'zod'
import { ConfigSchema, AppConfig, DEFAULT_CONFIG } from '@shared/config.schema'
import { EventEmitter } from 'events'
import path from 'path'
import fs from 'fs/promises'

export class ConfigService extends EventEmitter {
  private store: Store<AppConfig>
  private cache: AppConfig

  constructor() {
    super()
    this.store = new Store<AppConfig>({
      name: 'config',
      defaults: DEFAULT_CONFIG,
      schema: ConfigSchema as any,
      migrations: {
        '1.1.0': (store) => {
          // Example migration
          const oldValue = store.get('terminal.fontSize')
          if (typeof oldValue === 'string') {
            store.set('terminal.fontSize', parseInt(oldValue, 10))
          }
        }
      }
    })

    this.cache = this.load()
    this.loadEnvOverrides()
  }

  private load(): AppConfig {
    try {
      const data = this.store.store
      return ConfigSchema.parse(data)
    } catch (error) {
      console.error('Config validation failed, using defaults', error)
      return DEFAULT_CONFIG
    }
  }

  private loadEnvOverrides(): void {
    const overrides: Partial<AppConfig> = {}

    // Map environment variables to config
    if (process.env.CPR_MAX_SESSIONS) {
      overrides.execution = {
        ...this.cache.execution,
        maxParallelSessions: parseInt(process.env.CPR_MAX_SESSIONS, 10)
      }
    }

    if (process.env.CPR_LANGUAGE) {
      overrides.general = {
        ...this.cache.general,
        language: process.env.CPR_LANGUAGE as any
      }
    }

    // Merge overrides
    this.cache = { ...this.cache, ...overrides }
  }

  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.cache[key]
  }

  getAll(): AppConfig {
    return { ...this.cache }
  }

  set<K extends keyof AppConfig>(key: K, value: AppConfig[K]): void {
    // Validate partial config
    const partialSchema = ConfigSchema.shape[key]
    const validated = partialSchema.parse(value)

    this.cache[key] = validated
    this.store.set(key, validated)
    this.emit('change', { key, value: validated })
  }

  setNested(path: string, value: unknown): void {
    // e.g., 'terminal.fontSize' => terminal: { fontSize: value }
    const parts = path.split('.')
    const key = parts[0] as keyof AppConfig
    const current = this.cache[key] as Record<string, unknown>
    const newValue = { ...current, [parts[1]]: value }

    this.set(key, newValue as any)
  }

  reset(): void {
    this.cache = DEFAULT_CONFIG
    this.store.clear()
    this.emit('reset')
  }

  async export(filePath: string): Promise<void> {
    const data = JSON.stringify(this.cache, null, 2)
    await fs.writeFile(filePath, data, 'utf-8')
  }

  async import(filePath: string): Promise<void> {
    const data = await fs.readFile(filePath, 'utf-8')
    const imported = JSON.parse(data)
    const validated = ConfigSchema.parse(imported)

    // Backup current config
    await this.backup()

    // Apply imported config
    Object.keys(validated).forEach((key) => {
      this.set(key as keyof AppConfig, validated[key as keyof AppConfig])
    })

    this.emit('imported')
  }

  private async backup(): Promise<void> {
    const backupPath = path.join(
      this.store.path,
      `config.backup.${Date.now()}.json`
    )
    await fs.writeFile(backupPath, JSON.stringify(this.cache, null, 2))
  }

  onChange(callback: (change: { key: string; value: unknown }) => void): () => void {
    this.on('change', callback)
    return () => this.off('change', callback)
  }
}
```

### Task 3: Migration System

```typescript
// src/main/services/config-migration.service.ts
import { AppConfig } from '@shared/config.schema'

interface Migration {
  version: string
  description: string
  up: (config: AppConfig) => AppConfig
}

export const migrations: Migration[] = [
  {
    version: '1.1.0',
    description: 'Add notification settings',
    up: (config) => ({
      ...config,
      notifications: config.notifications || {
        enabled: true,
        sound: true,
        showOnStart: true,
        showOnComplete: true,
        showOnError: true
      }
    })
  },
  {
    version: '1.2.0',
    description: 'Add git settings',
    up: (config) => ({
      ...config,
      git: config.git || {
        autoMerge: false,
        autoCleanup: false,
        commitPrefix: 'feat(spec):',
        branchPrefix: 'feature/'
      }
    })
  }
]

export function migrateConfig(config: AppConfig, fromVersion: string): AppConfig {
  let currentConfig = { ...config }

  for (const migration of migrations) {
    if (compareVersions(migration.version, fromVersion) > 0) {
      console.log(`Applying migration ${migration.version}: ${migration.description}`)
      currentConfig = migration.up(currentConfig)
    }
  }

  return currentConfig
}

function compareVersions(a: string, b: string): number {
  const partsA = a.split('.').map(Number)
  const partsB = b.split('.').map(Number)

  for (let i = 0; i < 3; i++) {
    if (partsA[i] > partsB[i]) return 1
    if (partsA[i] < partsB[i]) return -1
  }
  return 0
}
```

### Task 4: Config IPC Handlers

```typescript
// src/main/ipc/config.handlers.ts
import { ipcMain } from 'electron'
import { ConfigService } from '../services/config.service'

export function registerConfigHandlers(configService: ConfigService): void {
  ipcMain.handle('config:get', (_, key: string) => {
    return configService.get(key as any)
  })

  ipcMain.handle('config:getAll', () => {
    return configService.getAll()
  })

  ipcMain.handle('config:set', (_, key: string, value: unknown) => {
    configService.set(key as any, value as any)
    return true
  })

  ipcMain.handle('config:setNested', (_, path: string, value: unknown) => {
    configService.setNested(path, value)
    return true
  })

  ipcMain.handle('config:reset', () => {
    configService.reset()
    return true
  })

  ipcMain.handle('config:export', async (_, filePath: string) => {
    await configService.export(filePath)
    return true
  })

  ipcMain.handle('config:import', async (_, filePath: string) => {
    await configService.import(filePath)
    return true
  })
}
```

### Task 5: React Config Hook

```typescript
// src/renderer/hooks/useConfig.ts
import { useState, useEffect, useCallback } from 'react'
import type { AppConfig } from '@shared/config.schema'

export function useConfig() {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.electronAPI.getConfig().then((cfg) => {
      setConfig(cfg)
      setLoading(false)
    })

    // Listen for config changes
    const unsubscribe = window.electronAPI.onConfigChange((change) => {
      setConfig((prev) => prev ? { ...prev, [change.key]: change.value } : null)
    })

    return unsubscribe
  }, [])

  const updateConfig = useCallback(async <K extends keyof AppConfig>(
    key: K,
    value: AppConfig[K]
  ) => {
    await window.electronAPI.setConfig(key, value)
    setConfig((prev) => prev ? { ...prev, [key]: value } : null)
  }, [])

  const updateNested = useCallback(async (path: string, value: unknown) => {
    await window.electronAPI.setNestedConfig(path, value)
  }, [])

  const resetConfig = useCallback(async () => {
    await window.electronAPI.resetConfig()
  }, [])

  return {
    config,
    loading,
    updateConfig,
    updateNested,
    resetConfig
  }
}
```

## Configuration Categories

| Category | Options | Description |
|----------|---------|-------------|
| General | language, theme, autoUpdate | App-wide settings |
| Execution | maxSessions, timeout, retry | Execution parameters |
| Terminal | fontSize, font, scrollback | Terminal appearance |
| Git | autoMerge, cleanup, prefix | Git automation |
| Notifications | enabled, sound, events | Notification preferences |

## Risk Analysis

| Risk | Mitigation |
|------|------------|
| Config corruption | Automatic backup |
| Migration failure | Rollback mechanism |
| Invalid values | Zod validation |

## Success Criteria

- All config fields validated
- Migrations work correctly
- Live reload updates UI
- Import/export functional
- Environment overrides work
