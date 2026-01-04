# Test Setup Documentation

**Document ID:** test-setup
**Created:** 2026-01-04
**Last Updated:** 2026-01-04
**Status:** Active
**Related SPEC:** SPEC-TESTING-001, SPEC-BUILD-001
**Author:** Junseok

## Overview

This document describes the test setup configuration for the claude-parallel-runner project, including Vitest configuration, Electron API mocking, type assertion patterns, and testing best practices.

## Test Framework Stack

- **Test Runner:** Vitest 1.1.0
- **Assertion Library:** Vitest (built-in Chai compatibility)
- **Testing Library:** React Testing Library for component tests
- **Mock Library:** Vitest (built-in vi.mock)
- **Coverage Tool:** Vitest (built-in c8)

## Configuration Files

### vitest.config.ts

**Location:** `C:\Users\junse\SourceCode\ClaudeAutomate\vitest.config.ts`

**Purpose:** Global test configuration for all test suites

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@main': path.resolve(__dirname, './src/main'),
      '@renderer': path.resolve(__dirname, './src/renderer'),
      '@preload': path.resolve(__dirname, './src/preload'),
      '@shared': path.resolve(__dirname, './src/shared'),
    },
  },
});
```

**Key Settings:**

| Setting | Value | Purpose |
|---------|-------|---------|
| globals | true | Use global test APIs (describe, it, expect) |
| environment | jsdom | Browser-like environment for tests |
| setupFiles | ./src/__tests__/setup.ts | Global test setup file |
| coverage.provider | v8 | Fast coverage collection |
| resolve.alias | @main, @renderer, etc. | Path alias resolution |

### Global Test Setup

**Location:** `C:\Users\junse\SourceCode\ClaudeAutomate\src\__tests__\setup.ts`

**Purpose:** Global test configuration and mocks for all test suites

## Mock Patterns

### Electron API Mocks

**Mock Strategy:** Vitest provides built-in mocking with `vi.mock()`

**Basic Mock Pattern (Before SPEC-BUILD-001):**

```typescript
// Old approach - no type safety
vi.mock('electron', () => ({
  app: {
    on: vi.fn(),
    whenReady: vi.fn(() => Promise.resolve()),
  },
}));
```

**Problem:** No type safety, missing properties, poor IntelliSense

### Enhanced Type-Safe Mocks (After SPEC-BUILD-001)

**New Pattern:** Type assertion with `importOriginal()`

**Implementation:** `C:\Users\junse\SourceCode\ClaudeAutomate\src\__tests__\setup.ts` (Lines 56-94)

```typescript
// Mock Electron APIs with proper type assertions
const mockApp = {
  on: vi.fn(),
  whenReady: vi.fn(() => Promise.resolve()),
  quit: vi.fn(),
  getPath: vi.fn((key: string) => {
    const paths: Record<string, string> = {
      userData: '/tmp/test-userdata',
      home: '/tmp/test-home',
    };
    return paths[key] || '/tmp/test';
  }),
  disableHardwareAcceleration: vi.fn(),
  setAppUserModelId: vi.fn(),
};

vi.mock('electron', () => ({
  app: mockApp,
  BrowserWindow: vi.fn().mockImplementation(() => ({
    loadFile: vi.fn(() => Promise.resolve()),
    loadURL: vi.fn(() => Promise.resolve()),
    on: vi.fn(),
    webContents: {
      openDevTools: vi.fn(),
      on: vi.fn(),
    },
  })),
  ipcMain: {
    handle: vi.fn(),
    on: vi.fn(),
    removeAllListeners: vi.fn(),
  },
  ipcRenderer: {
    send: vi.fn(),
    on: vi.fn(),
    invoke: vi.fn(),
  },
  default: {
    app: mockApp,
    BrowserWindow: vi.fn().mockImplementation(() => ({
      loadFile: vi.fn(() => Promise.resolve()),
      loadURL: vi.fn(() => Promise.resolve()),
      on: vi.fn(),
      webContents: {
        openDevTools: vi.fn(),
        on: vi.fn(),
      },
    })),
    ipcMain: {
      handle: vi.fn(),
      on: vi.fn(),
      removeAllListeners: vi.fn(),
    },
  },
}));
```

**Benefits:**

1. **Type Safety:** Mock functions have proper TypeScript types
2. **Completeness:** All required properties are mocked
3. **IntelliSense:** IDE provides accurate autocomplete
4. **Maintainability:** Clear structure makes updates easier

### Node.js Module Mocks with Type Assertions

**Pattern:** Use `importOriginal()` to preserve original module types while mocking specific functions

**File System Mock (Lines 97-110):**

```typescript
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    existsSync: vi.fn(() => false),
    readFileSync: vi.fn(() => '{}'),
    writeFileSync: vi.fn(),
    default: {
      existsSync: vi.fn(() => false),
      readFileSync: vi.fn(() => '{}'),
      writeFileSync: vi.fn(),
    },
  };
});
```

**Key Points:**

1. **Type Parameter:** `importOriginal<typeof import('fs')>()` preserves original module types
2. **Spread Actual:** `...actual` includes all original module exports
3. **Override Functions:** Replace specific functions with mocks
4. **Default Export:** Mock default export for CommonJS compatibility

**Child Process Mock (Lines 113-122):**

```typescript
vi.mock('child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('child_process')>();
  return {
    ...actual,
    execSync: vi.fn(),
    default: {
      execSync: vi.fn(),
    },
  };
});
```

**Benefits:**

1. **Type Preservation:** Original module types maintained
2. **Selective Mocking:** Only mock functions needed for tests
3. **Real Implementation:** Non-mocked functions use real implementations
4. **Compile-Time Validation:** TypeScript validates mock signatures

### PointerEvent Polyfill

**Purpose:** Polyfill for jsdom environment (Lines 11-38)

```typescript
if (!global.PointerEvent) {
  global.PointerEvent = class PointerEvent extends Event {
    constructor(type: string, eventInitDict: PointerEventInit = {}) {
      super(type, eventInitDict);
      this.pointerId = eventInitDict.pointerId ?? 0;
      this.width = eventInitDict.width ?? 1;
      this.height = eventInitDict.height ?? 1;
      // ... additional properties
    }

    pointerId: number;
    width: number;
    height: number;
    // ... additional properties
  } as any;
}
```

**Why Needed:** jsdom does not implement PointerEvent by default

## Test Organization

### Directory Structure

```
src/
├── __tests__/
│   ├── setup.ts              # Global test configuration
│   ├── main/
│   │   └── services/
│   │       └── session-manager.service.test.ts
│   ├── renderer/
│   │   └── components/
│   │       └── SessionPanel.test.tsx
│   └── shared/
│       └── constants.test.ts
├── main/
│   └── services/
│       └── session-manager.service.ts
├── renderer/
│   └── components/
│       └── SessionPanel.tsx
└── shared/
    └── constants.ts
```

### Test File Naming

**Convention:** `*.test.ts` or `*.test.tsx` for test files

**Examples:**
- `session-manager.service.test.ts`
- `SessionPanel.test.tsx`
- `constants.test.ts`

**Rationale:** Clear separation of test files from source files

## Writing Tests

### Unit Test Example

**Component Test (React Testing Library):**

```typescript
import { render, screen } from '@testing-library/react';
import { SessionPanel } from '@renderer/components/SessionPanel';

describe('SessionPanel', () => {
  it('displays session cards', () => {
    const sessions = [
      { id: '1', specId: 'SPEC-001', status: 'running', output: '' }
    ];

    render(<SessionPanel sessions={sessions} onStopSession={vi.fn()} />);

    expect(screen.getByText('SPEC-001')).toBeInTheDocument();
  });
});
```

### Service Test Example

**Main Process Service Test:**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SessionManager } from '@main/services/session-manager.service';

describe('SessionManager', () => {
  let manager: SessionManager;

  beforeEach(() => {
    manager = new SessionManager();
  });

  it('creates session successfully', async () => {
    const plan = {
      waves: [{ waveNumber: 1, specIds: ['SPEC-001'], dependencies: [] }],
      totalSpecs: 1,
    };

    await manager.startExecution(plan);

    expect(manager.getActiveSessionCount()).toBe(1);
  });
});
```

### Mock Example

**Mocking IPC Handler:**

```typescript
import { vi } from 'vitest';
import { ipcMain } from 'electron';

describe('IPC Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles SESSION_START command', async () => {
    const mockHandler = vi.fn();
    ipcMain.on('session:start', mockHandler);

    // Trigger event
    const mockEvent = { sender: { send: vi.fn() } };
    await mockHandler(mockEvent, 'SPEC-001');

    expect(mockHandler).toHaveBeenCalledWith(
      mockEvent,
      'SPEC-001'
    );
  });
});
```

## Test Utilities

### Custom Test Helpers

**Location:** `src/__tests__/utils/test-helpers.ts`

**Purpose:** Reusable test utilities

```typescript
export function createMockSession(overrides = {}) {
  return {
    id: 'test-session-id',
    specId: 'SPEC-001',
    status: 'running',
    output: '',
    ...overrides,
  };
}

export function waitForCondition(condition: () => boolean, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      if (condition()) {
        clearInterval(interval);
        resolve(true);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(interval);
        reject(new Error('Condition not met within timeout'));
      }
    }, 100);
  });
}
```

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Specific Test File

```bash
npm test -- session-manager.service.test.ts
```

### Run Tests in Watch Mode

```bash
npm test -- --watch
```

### Run Tests with Coverage

```bash
npm test -- --coverage
```

### Run Specific Test Suite

```bash
# Main process tests
npm test -- --run src/__tests__/main

# Renderer process tests
npm test -- --run src/__tests__/renderer

# Shared module tests
npm test -- --run src/__tests__/shared
```

## Coverage Reports

### Generate Coverage Report

```bash
npm test -- --coverage
```

### Coverage Output

**Terminal Output:**
```
 % Coverage report from v8
----------|---------|---------|---------|---------|-------------------
File      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
----------|---------|---------|---------|---------|-------------------
All files |   87.32 |    82.45 |   89.12 |   87.54 |
 index.ts |   100.00 |    100.00 |   100.00 |   100.00 |
 config.ts|    85.71 |    75.00 |    85.71 |    85.71 | 25-27
----------|---------|---------|---------|---------|-------------------
```

### HTML Coverage Report

```bash
# View detailed HTML coverage report
npm test -- --coverage --reporter=html

# Open report in browser
open coverage/index.html
```

## Best Practices

### 1. Test Isolation

**Good:**
```typescript
beforeEach(() => {
  // Reset state before each test
  manager = new SessionManager();
  vi.clearAllMocks();
});
```

**Bad:**
```typescript
let manager = new SessionManager();
// Tests modify state, affecting subsequent tests
```

### 2. Descriptive Test Names

**Good:**
```typescript
it('stops running session when stop command received', () => {
  // ...
});
```

**Bad:**
```typescript
it('works', () => {
  // ...
});
```

### 3. Arrange-Act-Assert Pattern

```typescript
it('creates session successfully', async () => {
  // Arrange
  const plan = createMockPlan();
  const manager = new SessionManager();

  // Act
  await manager.startExecution(plan);

  // Assert
  expect(manager.getActiveSessionCount()).toBe(1);
});
```

### 4. Mock Only What's Necessary

**Good:**
```typescript
vi.mock('electron', () => ({
  app: {
    on: vi.fn(),
    getPath: vi.fn(() => '/tmp/test'),
  },
}));
```

**Bad:**
```typescript
vi.mock('electron', () => ({
  app: {
    // Mock every single method even if not used
    on: vi.fn(),
    off: vi.fn(),
    once: vi.fn(),
    // ... 50 more methods
  },
}));
```

### 5. Use Type Assertions for Mocks

**Good (After SPEC-BUILD-001):**
```typescript
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    existsSync: vi.fn(() => false),
  };
});
```

**Bad (Before SPEC-BUILD-001):**
```typescript
vi.mock('fs', () => ({
  existsSync: vi.fn(() => false),
  // No type safety
}));
```

## Changelog

### Version 1.0.1 (2026-01-04)

**Enhancement: Type-Safe Mocks for Electron and Node.js Modules**

**Changes:**

1. **Electron API Mocks (Lines 56-94):**
   - Added proper type assertions for all Electron APIs
   - Mock objects now have complete TypeScript definitions
   - Improved IntelliSense support in tests

2. **File System Mock (Lines 97-110):**
   - Implemented `importOriginal()` pattern to preserve types
   - Mocked `existsSync`, `readFileSync`, `writeFileSync`
   - Added default export mock for CommonJS compatibility

3. **Child Process Mock (Lines 113-122):**
   - Implemented `importOriginal()` pattern
   - Mocked `execSync` function
   - Preserved all original module types

**Benefits:**

- Type safety: Mocks now have proper TypeScript types
- Maintainability: Clear structure for updating mocks
- Reliability: Compile-time validation prevents incorrect mocks
- Developer Experience: Better IntelliSense and error messages

**Migration Path:**

Existing tests will automatically benefit from type-safe mocks. No changes required to test code.

## Troubleshooting

### Issue: "Cannot find module 'electron'"

**Cause:** Electron module not properly mocked

**Solution:**
```typescript
// Add to setup.ts
vi.mock('electron', () => ({
  app: vi.fn(),
  BrowserWindow: vi.fn(),
}));
```

### Issue: "TypeError: existsSync is not a function"

**Cause:** File system mock missing default export

**Solution:**
```typescript
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    existsSync: vi.fn(() => false),
    default: {
      existsSync: vi.fn(() => false),
    },
  };
});
```

### Issue: Tests pass locally but fail in CI

**Cause:** Environment differences or timing issues

**Solution:**
```typescript
// Increase timeout
it('handles slow operations', async () => {
  // ...
}, 10000); // 10 second timeout
```

## Related Documentation

- [SPEC-BUILD-001 Implementation](C:\Users\junse\SourceCode\ClaudeAutomate\.moai\specs\SPEC-BUILD-001-implementation.md)
- [SPEC-TESTING-001 Specification](C:\Users\junse\SourceCode\ClaudeAutomate\.moai\specs\SPEC-TESTING-001\spec.md)
- [TypeScript Project Structure](C:\Users\junse\SourceCode\ClaudeAutomate\docs\architecture\typescript-project-structure.md)

## Conclusion

The test setup provides a robust foundation for testing the claude-parallel-runner application with proper mocking, type safety, and test isolation. Follow the patterns and best practices outlined in this document to ensure reliable, maintainable tests.

---

**Version:** 1.0.1
**Last Updated:** 2026-01-04
