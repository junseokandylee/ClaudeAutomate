# Implementation Plan: SPEC-TESTING-001

## Overview

Set up comprehensive testing infrastructure with Vitest, React Testing Library, and Playwright.

## Task Breakdown

### Task 1: Configure Vitest

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        'dist/'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    alias: {
      '@': path.resolve(__dirname, './src/renderer'),
      '@main': path.resolve(__dirname, './src/main'),
      '@shared': path.resolve(__dirname, './src/shared')
    }
  }
})
```

### Task 2: Test Setup File

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Electron APIs
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/mock/path'),
    quit: vi.fn()
  },
  ipcMain: {
    on: vi.fn(),
    handle: vi.fn()
  },
  ipcRenderer: {
    on: vi.fn(),
    invoke: vi.fn(),
    send: vi.fn()
  },
  BrowserWindow: vi.fn(() => ({
    loadURL: vi.fn(),
    webContents: { send: vi.fn() }
  }))
}))

// Mock window.electronAPI
Object.defineProperty(window, 'electronAPI', {
  value: {
    checkBootstrap: vi.fn(),
    scanSpecs: vi.fn(),
    analyzeSpecs: vi.fn(),
    startExecution: vi.fn(),
    stopExecution: vi.fn(),
    getConfig: vi.fn(),
    setConfig: vi.fn(),
    onSessionStatus: vi.fn(),
    onProgressUpdate: vi.fn()
  },
  writable: true
})

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks()
})
```

### Task 3: Mock Factories

```typescript
// src/test/factories/index.ts
import { faker } from '@faker-js/faker'
import type { SpecInfo, SessionInfo, Wave, ExecutionPlan } from '@shared/types'

export const createMockSpec = (overrides?: Partial<SpecInfo>): SpecInfo => ({
  id: `SPEC-${faker.string.alphanumeric(3).toUpperCase()}-001`,
  title: faker.lorem.sentence(3),
  filePath: faker.system.filePath(),
  status: 'pending',
  dependencies: [],
  ...overrides
})

export const createMockSession = (overrides?: Partial<SessionInfo>): SessionInfo => ({
  id: faker.string.uuid(),
  specId: `SPEC-${faker.string.alphanumeric(3).toUpperCase()}-001`,
  status: 'idle',
  worktreePath: faker.system.directoryPath(),
  output: [],
  ...overrides
})

export const createMockWave = (specCount = 3, overrides?: Partial<Wave>): Wave => ({
  waveNumber: 1,
  specs: Array.from({ length: specCount }, () => createMockSpec()),
  ...overrides
})

export const createMockPlan = (waveCount = 2): ExecutionPlan => ({
  waves: Array.from({ length: waveCount }, (_, i) =>
    createMockWave(3, { waveNumber: i + 1 })
  ),
  totalSpecs: waveCount * 3,
  estimatedParallelism: 3
})
```

### Task 4: Service Unit Tests

```typescript
// src/main/services/__tests__/spec-scanner.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SpecScannerService } from '../spec-scanner.service'
import fs from 'fs/promises'

vi.mock('fs/promises')

describe('SpecScannerService', () => {
  let service: SpecScannerService

  beforeEach(() => {
    service = new SpecScannerService()
    vi.clearAllMocks()
  })

  describe('scan', () => {
    it('should find all SPEC directories', async () => {
      vi.mocked(fs.readdir).mockResolvedValue([
        { name: 'SPEC-AUTH-001', isDirectory: () => true },
        { name: 'SPEC-API-001', isDirectory: () => true }
      ] as any)

      vi.mocked(fs.readFile).mockResolvedValue(`
        ---
        id: SPEC-AUTH-001
        title: Authentication
        ---
      `)

      const specs = await service.scan('/project')

      expect(specs).toHaveLength(2)
      expect(specs[0].id).toBe('SPEC-AUTH-001')
    })

    it('should skip non-SPEC directories', async () => {
      vi.mocked(fs.readdir).mockResolvedValue([
        { name: 'SPEC-AUTH-001', isDirectory: () => true },
        { name: 'other-folder', isDirectory: () => true }
      ] as any)

      const specs = await service.scan('/project')

      expect(specs).toHaveLength(1)
    })

    it('should handle empty directory', async () => {
      vi.mocked(fs.readdir).mockResolvedValue([])

      const specs = await service.scan('/project')

      expect(specs).toHaveLength(0)
    })
  })
})
```

### Task 5: React Component Tests

```typescript
// src/renderer/components/main/__tests__/SpecList.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SpecList } from '../SpecList'
import { createMockSpec } from '@/test/factories'

describe('SpecList', () => {
  const mockSpecs = [
    createMockSpec({ id: 'SPEC-AUTH-001', title: 'Authentication' }),
    createMockSpec({ id: 'SPEC-API-001', title: 'API Integration' })
  ]

  it('should render all specs', () => {
    render(
      <SpecList
        specs={mockSpecs}
        selectedIds={new Set()}
        onSelect={vi.fn()}
      />
    )

    expect(screen.getByText('SPEC-AUTH-001')).toBeInTheDocument()
    expect(screen.getByText('SPEC-API-001')).toBeInTheDocument()
  })

  it('should highlight selected specs', () => {
    render(
      <SpecList
        specs={mockSpecs}
        selectedIds={new Set(['SPEC-AUTH-001'])}
        onSelect={vi.fn()}
      />
    )

    const authItem = screen.getByText('SPEC-AUTH-001').closest('li')
    expect(authItem).toHaveClass('selected')
  })

  it('should call onSelect when spec clicked', () => {
    const onSelect = vi.fn()
    render(
      <SpecList
        specs={mockSpecs}
        selectedIds={new Set()}
        onSelect={onSelect}
      />
    )

    fireEvent.click(screen.getByText('SPEC-AUTH-001'))

    expect(onSelect).toHaveBeenCalledWith('SPEC-AUTH-001')
  })
})
```

### Task 6: Zustand Store Tests

```typescript
// src/renderer/stores/__tests__/sessionStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useSessionStore } from '../sessionStore'
import { createMockSession } from '@/test/factories'

describe('sessionStore', () => {
  beforeEach(() => {
    useSessionStore.setState({ sessions: [], isExecuting: false })
  })

  it('should add session', () => {
    const session = createMockSession()

    useSessionStore.getState().addSession(session)

    expect(useSessionStore.getState().sessions).toContainEqual(session)
  })

  it('should update session status', () => {
    const session = createMockSession({ status: 'idle' })
    useSessionStore.setState({ sessions: [session] })

    useSessionStore.getState().updateSessionStatus(session.id, 'running')

    const updated = useSessionStore.getState().sessions.find(
      s => s.id === session.id
    )
    expect(updated?.status).toBe('running')
  })

  it('should clear all sessions', () => {
    useSessionStore.setState({
      sessions: [createMockSession(), createMockSession()]
    })

    useSessionStore.getState().clearSessions()

    expect(useSessionStore.getState().sessions).toHaveLength(0)
  })
})
```

### Task 7: Custom Hook Tests

```typescript
// src/renderer/hooks/__tests__/useProgress.test.ts
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useProgress } from '../useProgress'

describe('useProgress', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should calculate progress correctly', () => {
    const { result } = renderHook(() => useProgress({
      total: 10,
      completed: 5,
      failed: 1
    }))

    expect(result.current.percentage).toBe(60)
    expect(result.current.successRate).toBe(83.33)
  })

  it('should update elapsed time', () => {
    const { result } = renderHook(() => useProgress({
      total: 10,
      completed: 0,
      startTime: Date.now()
    }))

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(result.current.elapsed).toBeGreaterThanOrEqual(5)
  })
})
```

### Task 8: E2E Test Setup

```typescript
// e2e/app.spec.ts
import { test, expect, _electron as electron } from '@playwright/test'

test.describe('ClaudeParallelRunner', () => {
  test('should launch application', async () => {
    const app = await electron.launch({
      args: ['.']
    })

    const window = await app.firstWindow()
    await expect(window.title()).resolves.toBe('Claude Parallel Runner')

    await app.close()
  })

  test('should pass bootstrap checks', async () => {
    const app = await electron.launch({ args: ['.'] })
    const window = await app.firstWindow()

    // Wait for bootstrap to complete
    await window.waitForSelector('[data-testid="bootstrap-complete"]')

    const status = await window.locator('[data-testid="claude-status"]')
    await expect(status).toContainText('Installed')

    await app.close()
  })
})
```

## Test Script Configuration

```json
// package.json scripts
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest watch",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "test:all": "npm run test:coverage && npm run test:e2e"
  }
}
```

## Risk Analysis

| Risk | Mitigation |
|------|------------|
| Flaky tests | Proper async handling, retry |
| Slow tests | Parallel execution, mocking |
| Low coverage | Coverage thresholds, PR checks |

## Success Criteria

- 80% code coverage achieved
- All tests pass in CI
- E2E tests cover critical paths
- Test utilities are reusable
- No flaky tests in suite
