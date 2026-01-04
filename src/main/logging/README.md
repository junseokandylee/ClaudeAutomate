# Logging and Diagnostics Module

**SPEC-LOGGING-001** - Centralized logging system with configurable levels, file rotation, diagnostic bundle generation, and debug mode support.

## Overview

This module provides a comprehensive logging solution for Electron applications with the following features:

- **Log Levels**: DEBUG, INFO, WARN, ERROR, FATAL
- **Centralized Logger**: Singleton pattern with structured logging
- **File Logging**: Automatic rotation by size, configurable retention, compression support
- **Console Logging**: Color-coded output, level filtering, source location in development
- **Diagnostic Bundle**: System information, log files, sanitized configuration, error stack traces
- **Debug Mode**: Enhanced logging with performance metrics and IPC tracing

## Installation

Dependencies are already installed:
```bash
npm install electron-log winston
```

## Quick Start

```typescript
import { LoggerService, FileTransport, ConsoleTransport, LogLevel } from '@main/logging';

// Get logger instance
const logger = LoggerService.getInstance();

// Add transports
const fileTransport = new FileTransport({
  logDir: app.getPath('userData'),
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5,
});

const consoleTransport = new ConsoleTransport({
  colors: true,
  showSource: true,
});

logger.addTransport((entry) => fileTransport.write(entry));
logger.addTransport((entry) => consoleTransport.write(entry));

// Use the logger
logger.info('Application started');
logger.warn('Warning message', { userId: '123' });
logger.error('Error occurred', { error: new Error('Test error') });
```

## Log Levels

```typescript
enum LogLevel {
  DEBUG = 'debug',  // Detailed debugging information
  INFO = 'info',    // General informational messages
  WARN = 'warn',    // Warning conditions
  ERROR = 'error',  // Error events
  FATAL = 'fatal',  // Critical failures
}

// Set log level
logger.setLevel(LogLevel.DEBUG);

// Get current level
const currentLevel = logger.getLevel();
```

## File Logging

### Configuration

```typescript
import { FileTransport } from '@main/logging';

const fileTransport = new FileTransport({
  logDir: '/path/to/logs',        // Directory for log files
  maxFileSize: 10 * 1024 * 1024, // Maximum size before rotation (bytes)
  maxFiles: 5,                    // Number of archived files to keep
  compress: false,                // Enable compression (optional)
});
```

### Features

- **Automatic Rotation**: Files rotate when size exceeds `maxFileSize`
- **Timestamp Suffixes**: Rotated files have format `app.log.YYYY-MM-DDTHH-MM-SS-msZ`
- **Archive Cleanup**: Oldest files deleted when `maxFiles` exceeded
- **JSON Format**: All logs written as JSON for easy parsing

## Console Logging

### Configuration

```typescript
import { ConsoleTransport } from '@main/logging';

const consoleTransport = new ConsoleTransport({
  colors: true,        // Enable ANSI colors
  showSource: false,   // Show source location (optional)
});
```

### Features

- **Color-Coded Output**: Different colors for each log level
- **Level Filtering**: Only logs at or above current level
- **Readable Format**: `[timestamp] [level] message context`

## Debug Mode

### Enable Debug Mode

```typescript
import { DebugMode } from '@main/logging';

const debugMode = DebugMode.getInstance(logger);

debugMode.enable({
  ipcTracing: true,         // Enable IPC message tracing
  performanceMetrics: true,  // Enable performance tracking
  verboseOutput: true,       // Enable verbose output
});
```

### Performance Metrics

```typescript
// Record performance metrics
debugMode.recordMetric('database-query', 125); // milliseconds
debugMode.recordMetric('database-query', 98);
debugMode.recordMetric('database-query', 142);

// Get metrics
const metrics = debugMode.getMetrics('database-query');
console.log(metrics);
// { avg: 121.67, min: 98, max: 142, count: 3 }

// Get all metrics
const allMetrics = debugMode.getAllMetrics();

// Clear metrics
debugMode.clearMetrics();
```

### IPC Tracing

```typescript
// Trace IPC messages (when enabled)
debugMode.logIpc('channel-name', { data: 'example' });
// Output: [timestamp] [DEBUG] IPC: channel-name {"data":"example"}
```

## Diagnostic Bundle

### Generate Bundle

```typescript
import { DiagnosticService } from '@main/logging';

const diagnosticService = new DiagnosticService({
  logDir: app.getPath('userData'),
  outputDir: app.getPath('temp'),
});

// Generate diagnostic bundle
const bundlePath = await diagnosticService.generateBundle();
console.log(`Bundle created at: ${bundlePath}`);
```

### Bundle Contents

```
diagnostic-2026-01-04T07-00-00-000Z/
├── system-info.json    # System information (OS, arch, versions)
├── logs/               # All log files
│   ├── app.log
│   ├── app.log.2026-01-04T06-55-00-000Z
│   └── ...
└── config.json         # Sanitized configuration
```

## Structured Logging

### Basic Logging

```typescript
logger.info('Simple message');
logger.warn('Warning with context', { userId: '123' });
logger.error('Error with details', { error: new Error('Test') });
```

### Context Objects

```typescript
logger.info('User action', {
  userId: '123',
  action: 'login',
  ip: '192.168.1.1',
  timestamp: Date.now(),
});
```

### Error Handling

```typescript
try {
  await riskyOperation();
} catch (error) {
  logger.error('Operation failed', {
    error,
    context: { operation: 'riskyOperation' },
  });
}
```

## API Reference

### LoggerService

| Method | Description |
|--------|-------------|
| `getInstance()` | Get singleton instance |
| `setLevel(level)` | Set log level |
| `getLevel()` | Get current log level |
| `debug(message, context?)` | Log debug message |
| `info(message, context?)` | Log info message |
| `warn(message, context?)` | Log warning message |
| `error(message, context?)` | Log error message |
| `fatal(message, context?)` | Log fatal message |
| `addTransport(transport)` | Add transport function |
| `clearTransports()` | Clear all transports |

### DebugMode

| Method | Description |
|--------|-------------|
| `getInstance(logger?)` | Get singleton instance |
| `enable(config?)` | Enable debug mode |
| `disable()` | Disable debug mode |
| `isEnabled()` | Check if enabled |
| `isIpcTracingEnabled()` | Check if IPC tracing enabled |
| `isPerformanceMetricsEnabled()` | Check if metrics enabled |
| `isVerboseOutputEnabled()` | Check if verbose output enabled |
| `recordMetric(name, duration)` | Record performance metric |
| `getMetrics(name)` | Get metrics for name |
| `getAllMetrics()` | Get all metrics |
| `clearMetrics()` | Clear all metrics |
| `logIpc(channel, ...args)` | Log IPC message |

### FileTransport

| Method | Description |
|--------|-------------|
| `constructor(config)` | Create file transport |
| `write(entry)` | Write log entry to file |
| `forceRotation()` | Force log rotation (testing) |

### ConsoleTransport

| Method | Description |
|--------|-------------|
| `constructor(config?)` | Create console transport |
| `write(entry)` | Write log entry to console |

### DiagnosticService

| Method | Description |
|--------|-------------|
| `constructor(config)` | Create diagnostic service |
| `generateBundle()` | Generate diagnostic bundle |

## Testing

```bash
# Run all logging tests
npm test -- src/main/logging/__tests__/

# Run with coverage
npm test -- src/main/logging/__tests__/ --coverage
```

## Test Coverage

- **Statements**: 92.07%
- **Branches**: 78.84%
- **Functions**: 89.83%
- **Lines**: 92.07%

## Files

```
src/main/logging/
├── __tests__/
│   ├── console-transport.test.ts   # Console transport tests
│   ├── debug-mode.test.ts          # Debug mode tests
│   ├── diagnostic.service.test.ts  # Diagnostic service tests
│   ├── file-transport.test.ts      # File transport tests
│   ├── integration.test.ts         # Integration tests
│   ├── log-levels.test.ts          # Log level tests
│   └── logger.service.test.ts      # Logger service tests
├── console-transport.ts            # Console transport implementation
├── debug-mode.ts                   # Debug mode implementation
├── diagnostic.service.ts           # Diagnostic service implementation
├── file-transport.ts               # File transport implementation
├── index.ts                        # Main exports
├── log-levels.ts                   # Log level definitions
├── logger.service.ts               # Logger service implementation
└── README.md                       # This file
```

## License

MIT
