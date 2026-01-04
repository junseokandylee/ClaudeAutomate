# Implementation Plan: SPEC-SECURITY-001

## Overview

Implement security best practices for Electron application.

## Task Breakdown

### Task 1: Secure Credential Storage

```typescript
// src/main/services/keychain.service.ts
import keytar from 'keytar'
import crypto from 'crypto'

const SERVICE_NAME = 'ClaudeParallelRunner'

export class KeychainService {
  async storeApiKey(modelId: string, apiKey: string): Promise<void> {
    await keytar.setPassword(SERVICE_NAME, `api-key-${modelId}`, apiKey)
  }

  async getApiKey(modelId: string): Promise<string | null> {
    return keytar.getPassword(SERVICE_NAME, `api-key-${modelId}`)
  }

  async deleteApiKey(modelId: string): Promise<boolean> {
    return keytar.deletePassword(SERVICE_NAME, `api-key-${modelId}`)
  }

  async listStoredKeys(): Promise<string[]> {
    const credentials = await keytar.findCredentials(SERVICE_NAME)
    return credentials
      .filter(c => c.account.startsWith('api-key-'))
      .map(c => c.account.replace('api-key-', ''))
  }

  // For data that can't use keychain (e.g., large configs)
  encryptData(data: string, key: Buffer): string {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
    const encrypted = Buffer.concat([
      cipher.update(data, 'utf8'),
      cipher.final()
    ])
    const tag = cipher.getAuthTag()
    return Buffer.concat([iv, tag, encrypted]).toString('base64')
  }

  decryptData(encryptedData: string, key: Buffer): string {
    const buffer = Buffer.from(encryptedData, 'base64')
    const iv = buffer.subarray(0, 16)
    const tag = buffer.subarray(16, 32)
    const encrypted = buffer.subarray(32)
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(tag)
    return decipher.update(encrypted) + decipher.final('utf8')
  }
}
```

### Task 2: IPC Validation Schema

```typescript
// src/main/ipc/validators.ts
import { z } from 'zod'

// Define schemas for all IPC messages
export const IPCSchemas = {
  'spec:scan': z.object({
    projectPath: z.string().min(1).max(1000)
  }),

  'session:start': z.object({
    plan: z.object({
      waves: z.array(z.object({
        waveNumber: z.number().int().positive(),
        specs: z.array(z.object({
          id: z.string().regex(/^SPEC-[A-Z0-9-]+$/),
          title: z.string().max(200),
          filePath: z.string(),
          status: z.enum(['pending', 'running', 'completed', 'failed']),
          dependencies: z.array(z.string())
        }))
      })),
      totalSpecs: z.number().int().nonnegative(),
      estimatedParallelism: z.number().int().positive()
    })
  }),

  'config:set': z.object({
    key: z.string().regex(/^[a-zA-Z0-9_.]+$/),
    value: z.unknown()
  })
}

export function validateIPCMessage<T extends keyof typeof IPCSchemas>(
  channel: T,
  data: unknown
): z.infer<typeof IPCSchemas[T]> {
  const schema = IPCSchemas[channel]
  if (!schema) {
    throw new Error(`Unknown IPC channel: ${channel}`)
  }
  return schema.parse(data)
}
```

### Task 3: Secure IPC Handler Wrapper

```typescript
// src/main/ipc/secure-handler.ts
import { ipcMain, IpcMainInvokeEvent } from 'electron'
import { validateIPCMessage, IPCSchemas } from './validators'
import { auditLog } from '../services/audit.service'

export function secureHandle<T extends keyof typeof IPCSchemas>(
  channel: T,
  handler: (
    event: IpcMainInvokeEvent,
    data: z.infer<typeof IPCSchemas[T]>
  ) => Promise<unknown>
): void {
  ipcMain.handle(channel, async (event, rawData) => {
    try {
      // Validate sender
      if (!isValidSender(event)) {
        auditLog.warn('IPC from invalid sender', { channel })
        throw new Error('Invalid sender')
      }

      // Validate and sanitize data
      const validatedData = validateIPCMessage(channel, rawData)

      // Log for audit
      auditLog.info('IPC call', { channel, sanitizedData: sanitize(validatedData) })

      // Execute handler
      return await handler(event, validatedData)
    } catch (error) {
      auditLog.error('IPC handler error', { channel, error })
      throw error
    }
  })
}

function isValidSender(event: IpcMainInvokeEvent): boolean {
  // Verify the sender is from our application
  const url = event.sender.getURL()
  return url.startsWith('app://') || url.startsWith('file://')
}

function sanitize(data: unknown): unknown {
  // Remove sensitive fields for logging
  if (typeof data === 'object' && data !== null) {
    const sanitized = { ...data } as Record<string, unknown>
    if ('apiKey' in sanitized) sanitized.apiKey = '[REDACTED]'
    if ('password' in sanitized) sanitized.password = '[REDACTED]'
    return sanitized
  }
  return data
}
```

### Task 4: Content Security Policy

```typescript
// src/main/security/csp.ts
import { session } from 'electron'

export function setupContentSecurityPolicy(): void {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self';",
          "script-src 'self';",
          "style-src 'self' 'unsafe-inline';",  // Required for styled-components
          "img-src 'self' data:;",
          "font-src 'self';",
          "connect-src 'self';",
          "frame-ancestors 'none';",
          "form-action 'self';",
          "base-uri 'self';"
        ].join(' ')
      }
    })
  })
}
```

### Task 5: Secure BrowserWindow Configuration

```typescript
// src/main/window.ts
import { BrowserWindow, shell } from 'electron'
import path from 'path'

export function createSecureWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      // Security settings
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,

      // Preload script
      preload: path.join(__dirname, '../preload/index.js')
    }
  })

  // Prevent navigation to external URLs
  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('app://') && !url.startsWith('file://')) {
      event.preventDefault()
      shell.openExternal(url)
    }
  })

  // Prevent new windows
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Disable remote module
  win.webContents.on('did-attach-webview', (_, wc) => {
    wc.session.setPermissionRequestHandler((_, permission, callback) => {
      callback(false)
    })
  })

  return win
}
```

### Task 6: Dependency Vulnerability Scanner

```json
// package.json scripts
{
  "scripts": {
    "audit": "npm audit --production",
    "audit:fix": "npm audit fix",
    "security:check": "npx snyk test",
    "security:monitor": "npx snyk monitor"
  }
}
```

```yaml
# .github/workflows/security.yml
name: Security Scan

on:
  push:
    branches: [main]
  pull_request:
  schedule:
    - cron: '0 0 * * *'  # Daily

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm audit --production --audit-level=high
      - name: Snyk Security Scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

### Task 7: Audit Logging Service

```typescript
// src/main/services/audit.service.ts
import fs from 'fs/promises'
import path from 'path'
import { app } from 'electron'

type LogLevel = 'info' | 'warn' | 'error'

interface AuditEntry {
  timestamp: string
  level: LogLevel
  event: string
  details: Record<string, unknown>
  pid: number
}

class AuditLogger {
  private logPath: string
  private maxFileSize = 10 * 1024 * 1024  // 10MB

  constructor() {
    this.logPath = path.join(app.getPath('userData'), 'audit.log')
  }

  private async write(entry: AuditEntry): Promise<void> {
    const line = JSON.stringify(entry) + '\n'
    await fs.appendFile(this.logPath, line)
    await this.rotateIfNeeded()
  }

  private async rotateIfNeeded(): Promise<void> {
    try {
      const stats = await fs.stat(this.logPath)
      if (stats.size > this.maxFileSize) {
        const archivePath = `${this.logPath}.${Date.now()}.old`
        await fs.rename(this.logPath, archivePath)

        // Keep only last 5 archives
        const dir = path.dirname(this.logPath)
        const files = await fs.readdir(dir)
        const archives = files
          .filter(f => f.endsWith('.old'))
          .sort()
          .slice(0, -5)

        for (const file of archives) {
          await fs.unlink(path.join(dir, file))
        }
      }
    } catch {
      // Ignore rotation errors
    }
  }

  async info(event: string, details: Record<string, unknown> = {}): Promise<void> {
    await this.write({
      timestamp: new Date().toISOString(),
      level: 'info',
      event,
      details,
      pid: process.pid
    })
  }

  async warn(event: string, details: Record<string, unknown> = {}): Promise<void> {
    await this.write({
      timestamp: new Date().toISOString(),
      level: 'warn',
      event,
      details,
      pid: process.pid
    })
  }

  async error(event: string, details: Record<string, unknown> = {}): Promise<void> {
    await this.write({
      timestamp: new Date().toISOString(),
      level: 'error',
      event,
      details,
      pid: process.pid
    })
  }
}

export const auditLog = new AuditLogger()
```

## Security Checklist

| Category | Requirement | Implementation |
|----------|-------------|----------------|
| Storage | API keys in keychain | keytar |
| IPC | Schema validation | Zod |
| CSP | Script restrictions | Headers |
| Sandbox | Renderer isolation | Electron config |
| Updates | Signature verification | electron-updater |
| Audit | Security logging | Custom logger |

## Risk Analysis

| Risk | Mitigation |
|------|------------|
| Key exposure | OS keychain, encryption |
| XSS attacks | CSP, input validation |
| Code injection | No eval, sandbox |
| Supply chain | Dependency scanning |

## Success Criteria

- No plaintext secrets in code
- All IPC messages validated
- CSP headers enforced
- Sandbox enabled
- Audit logs for security events
