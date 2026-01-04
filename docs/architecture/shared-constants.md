# Shared Constants Documentation

**Document ID:** shared-constants
**Created:** 2026-01-04
**Last Updated:** 2026-01-04
**Status:** Active
**Related SPEC:** SPEC-SHARED-001, SPEC-BUILD-001
**Author:** Junseok

## Overview

This document describes the shared constants module (`src/shared/constants.ts`), which provides canonical definitions for IPC channels, error codes, configuration defaults, and application constants used across Main and Renderer processes.

## Module Purpose

The shared constants module serves as the single source of truth for all constant values used throughout the application. This prevents typos, ensures consistency, and enables compile-time validation.

## Location

**File:** `C:\Users\junse\SourceCode\ClaudeAutomate\src\shared\constants.ts`

**Type Definitions:** `C:\Users\junse\SourceCode\ClaudeAutomate\src\shared\types.ts`

## Constants Categories

### 1. IPC Channel Constants

**Export:** `IPC_CHANNELS`

**Purpose:** Canonical mapping of all IPC channels used for Main <-> Renderer communication

**Usage:**
```typescript
// Main process (send event)
ipcMain.on(IPC_CHANNELS.SESSION_START, (event, specId: string) => {
  // Handle session start
});

// Renderer process (send command)
ipcRenderer.send(IPC_CHANNELS.SESSION_START, 'SPEC-001');
```

**Channels Defined:**

| Channel Name | Type | Direction | Description |
|--------------|------|-----------|-------------|
| SESSION_CREATED | Event | Main → Renderer | New session created |
| SESSION_STARTED | Event | Main → Renderer | Session started running |
| SESSION_COMPLETED | Event | Main → Renderer | Session completed successfully |
| SESSION_FAILED | Event | Main → Renderer | Session failed |
| SESSION_OUTPUT | Event | Main → Renderer | Session output data |
| PROGRESS_UPDATE | Event | Main → Renderer | Progress percentage |
| SESSION_START | Command | Renderer → Main | Start a session |
| SESSION_CANCEL | Command | Renderer → Main | Cancel a session |
| SESSION_RETRY | Command | Renderer → Main | Retry failed session |
| PLAN_GENERATE | Command | Renderer → Main | Generate execution plan |
| CONFIG_GET | Command | Renderer → Main | Get configuration value |
| CONFIG_SET | Command | Renderer → Main | Set configuration value |
| BOOTSTRAP_CHECK | Command | Renderer → Main | Check bootstrap status |

### 2. Default Configuration Constants

**Export:** `DEFAULT_CONFIG`

**Purpose:** Sensible defaults for all configurable application settings

**Usage:**
```typescript
import { DEFAULT_CONFIG } from '@shared/constants';

const userConfig = loadUserConfig();
const config = { ...DEFAULT_CONFIG, ...userConfig };
```

**Configuration Values:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| claudePath | string | '' | Path to Claude CLI (detected during bootstrap) |
| projectRoot | string | '' | Project root directory |
| maxParallelSessions | number | 10 | Maximum parallel sessions |
| locale | SupportedLocale | 'en' | Application language |
| autoCleanup | boolean | true | Auto cleanup after sessions |

### 3. Maximum Parallel Sessions

**Export:** `MAX_PARALLEL_SESSIONS`

**Value:** `10`

**Purpose:** Hard upper limit to prevent system overload regardless of user configuration

**Usage:**
```typescript
import { MAX_PARALLEL_SESSIONS } from '@shared/constants';

const effectiveMax = Math.min(userConfig.maxParallelSessions, MAX_PARALLEL_SESSIONS);
```

### 4. Supported Locales

**Export:** `SUPPORTED_LOCALES`

**Value:** `['ko', 'en', 'ja', 'zh']`

**Purpose:** Ordered list of available languages for the user interface

**Usage:**
```typescript
import { SUPPORTED_LOCALES } from '@shared/constants';

if (!SUPPORTED_LOCALES.includes(userLocale)) {
  console.error('Unsupported locale');
}
```

**Locale Codes:**
- `ko` - Korean
- `en` - English
- `ja` - Japanese
- `zh` - Chinese

### 5. Color Scheme Constants

**Export:** `COLORS`

**Purpose:** Centralized color definitions for consistent UI across the application

**Color Palettes:**

**Anthropic Brand:**
- `ANTHROPIC: '#D97757'` - Official brand color

**Slate Palette (Neutrals):**
- 50-900 scale from lightest (#F8FAFC) to darkest (#0F172A)

**Blue Palette (Primary Actions):**
- 50-900 scale from lightest (#EFF6FF) to darkest (#1E3A8A)

**Emerald Palette (Success States):**
- 50-900 scale from lightest (#ECFDF5) to darkest (#064E3B)

**Amber Palette (Warnings):**
- 50-900 scale from lightest (#FFFBEB) to darkest (#78350F)

**Red Palette (Errors):**
- 50-900 scale from lightest (#FEF2F2) to darkest (#7F1D1D)

**Usage:**
```typescript
import { COLORS } from '@shared/constants';

const style = { color: COLORS.ANTHROPIC };
const errorStyle = { backgroundColor: COLORS.RED.100 };
```

### 6. Error Code Constants

**Export:** `ERROR_CODES`

**Purpose:** Canonical error codes used throughout the application for consistent error handling

**Error Code Ranges:**

| Range | Category | Description |
|-------|----------|-------------|
| E0001-E0010 | Bootstrap | Claude CLI, MoAI-ADK, Git errors |
| E0011-E0020 | Session | Session lifecycle errors |
| E0021-E0030 | Worktree | Git worktree management errors |
| E0031-E0040 | Config | Configuration errors |
| E0041-E0050 | Analysis | SPEC analysis errors |

**Error Codes:**

**Bootstrap Errors:**
- `E0001` - Claude CLI not found
- `E0002` - MoAI-ADK not found
- `E0003` - Git worktree not supported
- `E0004` - Git not found

**Session Errors:**
- `E0011` - Session creation failed
- `E0012` - Session start failed
- `E0013` - Session cancel failed
- `E0014` - Session timeout
- `E0015` - Worktree cleanup failed

**Worktree Errors:**
- `E0021` - Worktree creation failed
- `E0022` - Worktree removal failed
- `E0023` - Worktree already exists
- `E0024` - Worktree not found

**Config Errors:**
- `E0031` - Invalid config path
- `E0032` - Invalid config value
- `E0033` - Config load failed
- `E0034` - Config save failed

**Analysis Errors:**
- `E0041` - Parse failed
- `E0042` - Dependency cycle detected
- `E0043` - Invalid SPEC
- `E0044` - No SPECs found

**Usage:**
```typescript
import { ERROR_CODES } from '@shared/constants';

throw new BootstrapError(
  ERROR_CODES.BOOTSTRAP_CLAUDE_NOT_FOUND,
  'Claude CLI not found'
);
```

### 7. Error Message Templates

**Export:** `ERROR_MESSAGES`

**Purpose:** Human-readable error messages for each error code with placeholders

**Usage:**
```typescript
import { ERROR_CODES, ERROR_MESSAGES } from '@shared/constants';

const message = ERROR_MESSAGES[ERROR_CODES.BOOTSTRAP_CLAUDE_NOT_FOUND];
const formatted = message.replace('{path}', '/usr/local/bin/claude');
console.error(formatted);
```

**Message Placeholders:**

| Placeholder | Description | Example |
|-------------|-------------|---------|
| `{path}` | File system path | `/usr/local/bin/claude` |
| `{specId}` | SPEC identifier | `SPEC-001` |
| `{sessionId}` | Session identifier | `abc-123-def` |
| `{reason}` | Error reason | `Permission denied` |
| `{duration}` | Time duration | `30000` |
| `{key}` | Configuration key | `maxParallelSessions` |
| `{value}` | Configuration value | `10` |
| `{cycle}` | Dependency cycle | `A → B → A` |

## TypeScript Type Definitions

### IpcChannels Type

**Location:** `src/shared/types.ts`

```typescript
export type IpcChannels =
  | 'session:created'
  | 'session:started'
  | 'session:completed'
  | 'session:failed'
  | 'session:output'
  | 'progress:update'
  | 'session:start'
  | 'session:cancel'
  | 'session:retry'
  | 'plan:generate'
  | 'config:get'
  | 'config:set'
  | 'bootstrap:check';
```

### SupportedLocale Type

```typescript
export type SupportedLocale = 'ko' | 'en' | 'ja' | 'zh';
```

## Changelog

### Version 1.0.1 (2026-01-04)

**Bug Fix: SESSION_TIMEOUT Error Code Typo**

**Issue:** Error code constant was incorrectly named `_SESSION_TIMEOUT` with leading underscore

**Impact:** Constant was inaccessible to consumers due to underscore prefix convention (typically used for private members)

**Fix Applied:**
- **Before:** `_SESSION_TIMEOUT: 'E0014'`
- **After:** `SESSION_TIMEOUT: 'E0014'`

**File Modified:** `C:\Users\junse\SourceCode\ClaudeAutomate\src\shared\constants.ts` (Line 203)

**Backward Compatibility:** Breaking change - code referencing `_SESSION_TIMEOUT` must update to `SESSION_TIMEOUT`

**Migration Path:**
```typescript
// Old (incorrect)
const errorCode = ERROR_CODES._SESSION_TIMEOUT; // Error: Property does not exist

// New (correct)
const errorCode = ERROR_CODES.SESSION_TIMEOUT; // Correct
```

**Verification:**
```bash
# Run type checking to verify no references to old constant
npx tsc --noEmit

# Run tests to ensure error handling still works
npm test
```

## Best Practices

### 1. Always Import from @shared

```typescript
// ✅ Correct
import { IPC_CHANNELS, ERROR_CODES } from '@shared/constants';

// ❌ Incorrect - hardcoded string
ipcMain.on('session:start', handler);

// ❌ Incorrect - magic number
if (errorCode === 'E0014') {
  // Handle session timeout
}
```

### 2. Use Constants for Type Safety

```typescript
// ✅ Correct - type-safe channel name
const channel: IpcChannels = IPC_CHANNELS.SESSION_START;

// ❌ Incorrect - string literal
const channel = 'session:start';
```

### 3. Validate Locale

```typescript
// ✅ Correct - validate before use
function setLocale(locale: string): void {
  if (SUPPORTED_LOCALES.includes(locale as SupportedLocale)) {
    currentLocale = locale as SupportedLocale;
  } else {
    console.error(`Unsupported locale: ${locale}`);
  }
}

// ❌ Incorrect - no validation
function setLocale(locale: string): void {
  currentLocale = locale as SupportedLocale; // May fail at runtime
}
```

### 4. Use Color Constants

```typescript
// ✅ Correct - use color constants
const successStyle = {
  color: COLORS.EMERALD.600,
  backgroundColor: COLORS.EMERALD.100,
};

// ❌ Incorrect - hardcoded colors
const successStyle = {
  color: '#059669',
  backgroundColor: '#D1FAE5',
};
```

## Testing

### Unit Tests

**Location:** `src/__tests__/shared/constants.test.ts`

**Test Coverage:**
- IPC channel uniqueness
- Error code format validation
- Error message template completeness
- Color palette consistency
- Locale validation

**Run Tests:**
```bash
npm test -- shared/constants
```

## Related Documentation

- [SPEC-BUILD-001 Implementation](C:\Users\junse\SourceCode\ClaudeAutomate\.moai\specs\SPEC-BUILD-001-implementation.md)
- [SPEC-SESSION-001 Implementation](C:\Users\junse\SourceCode\ClaudeAutomate\.moai\docs\SPEC-SESSION-001-implementation.md)
- [TypeScript Project Structure](C:\Users\junse\SourceCode\ClaudeAutomate\docs\architecture\typescript-project-structure.md)

## Conclusion

The shared constants module provides a centralized, type-safe foundation for all constant values used across the application. By using these constants consistently, developers can prevent typos, ensure consistency, and enable compile-time validation.

---

**Version:** 1.0.1
**Last Updated:** 2026-01-04
