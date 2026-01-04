# Implementation Plan: SPEC-STARTUP-001

## Overview

Create startup flow with dependency checking and configuration management.

## Task Breakdown

### Task 1: Create StartupView Component

```typescript
// src/renderer/components/startup/StartupView.tsx
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import DependencyCheck from './DependencyCheck'

export default function StartupView() {
  const { t } = useTranslation('startup')

  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Logo */}
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring' }}
      >
        <h1 className="text-4xl font-bold text-anthropic">
          Claude Parallel Runner
        </h1>
        <p className="text-slate-400 text-center">v2.5.0</p>
      </motion.div>

      {/* Dependency Check */}
      <DependencyCheck />
    </motion.div>
  )
}
```

### Task 2: Create DependencyCheck Component

```typescript
// src/renderer/components/startup/DependencyCheck.tsx
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { BootstrapResult, DependencyStatus } from '@/shared/types'

interface DependencyItemProps {
  name: string
  status: DependencyStatus
  isChecking: boolean
}

function DependencyItem({ name, status, isChecking }: DependencyItemProps) {
  return (
    <div className="flex items-center gap-3 py-2">
      {isChecking && <Spinner />}
      {!isChecking && status.installed && <CheckIcon className="text-emerald-500" />}
      {!isChecking && !status.installed && <XIcon className="text-red-500" />}
      <span>{name}</span>
      {status.version && <span className="text-slate-500">v{status.version}</span>}
    </div>
  )
}

export default function DependencyCheck() {
  const [result, setResult] = useState<BootstrapResult | null>(null)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    window.electronAPI.checkDependencies().then(setResult)
  }, [])

  // Render dependency items
}
```

### Task 3: Create Bootstrap Service

```typescript
// src/main/services/bootstrap.service.ts
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function checkDependencies(): Promise<BootstrapResult> {
  const claude = await checkClaude()
  const moaiAdk = await checkMoaiAdk()
  const moaiWorktree = await checkMoaiWorktree()

  return {
    claude,
    moaiAdk,
    moaiWorktree,
    allPassed: claude.installed && moaiAdk.installed && moaiWorktree.installed
  }
}

async function checkClaude(): Promise<DependencyStatus> {
  try {
    const { stdout } = await execAsync('claude --version')
    const version = parseVersion(stdout)
    const { stdout: path } = await execAsync(process.platform === 'win32' ? 'where claude' : 'which claude')
    return { installed: true, version, path: path.trim() }
  } catch {
    return { installed: false }
  }
}

// Similar functions for moaiAdk and moaiWorktree
```

### Task 4: Create Config Service

```typescript
// src/main/services/config.service.ts
import Store from 'electron-store'
import type { AppConfig } from '@/shared/types'

const store = new Store<AppConfig>({
  defaults: {
    locale: 'en',
    theme: 'dark',
    maxParallelSessions: 10,
    worktreeRoot: '~/worktrees'
  }
})

export function getConfig<K extends keyof AppConfig>(key: K): AppConfig[K] {
  return store.get(key)
}

export function setConfig<K extends keyof AppConfig>(key: K, value: AppConfig[K]): void {
  store.set(key, value)
}

export function getAllConfig(): AppConfig {
  return store.store
}
```

## File Structure

```
src/
├── main/services/
│   ├── bootstrap.service.ts   (~100 lines)
│   └── config.service.ts      (~50 lines)
└── renderer/components/startup/
    ├── StartupView.tsx        (~80 lines)
    └── DependencyCheck.tsx    (~120 lines)
```

## Platform-Specific Commands

| Dependency | Windows | macOS/Linux |
|------------|---------|-------------|
| Claude check | `where claude` | `which claude` |
| Version | `claude --version` | `claude --version` |

## Installation Guidance Messages

- Claude: "Install Claude Code CLI from https://claude.ai/code"
- moai-adk: "Install with: npm install -g moai-adk"
- moai-worktree: "Install with: npm install -g moai-worktree"

## Risk Analysis

| Risk | Mitigation |
|------|------------|
| CLI not in PATH | Check multiple locations |
| Version parsing fails | Graceful fallback |
| Network check for updates | Skip if offline |

## Success Criteria

- Bootstrap check completes in under 3 seconds
- All three dependencies checked correctly
- Status icons update appropriately
- Missing dependency shows guidance
- Config persists between sessions
