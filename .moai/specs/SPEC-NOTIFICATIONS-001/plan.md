# Implementation Plan: SPEC-NOTIFICATIONS-001

## Overview

Implement native system notifications using Electron's Notification API.

## Task Breakdown

### Task 1: Create Notification Service

```typescript
// src/main/services/notification.service.ts
import { Notification, nativeImage } from 'electron'
import path from 'path'

export interface NotificationOptions {
  title: string
  body: string
  silent?: boolean
  urgency?: 'normal' | 'critical' | 'low'
  actions?: NotificationAction[]
}

interface NotificationAction {
  type: 'button'
  text: string
}

export class NotificationService {
  private enabled = true
  private soundEnabled = true
  private icon: Electron.NativeImage

  constructor() {
    this.icon = nativeImage.createFromPath(
      path.join(__dirname, '../../resources/icon.png')
    )
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled
  }

  show(options: NotificationOptions): void {
    if (!this.enabled || !Notification.isSupported()) return

    const notification = new Notification({
      title: options.title,
      body: options.body,
      icon: this.icon,
      silent: !this.soundEnabled || options.silent,
      urgency: options.urgency || 'normal',
      actions: options.actions
    })

    notification.on('click', () => {
      this.bringWindowToFront()
    })

    notification.show()
  }

  private bringWindowToFront(): void {
    const { BrowserWindow } = require('electron')
    const win = BrowserWindow.getAllWindows()[0]
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  }
}
```

### Task 2: Create Notification Types

```typescript
// src/main/services/notification-types.ts
import { NotificationService } from './notification.service'

export class ExecutionNotifications {
  constructor(private notificationService: NotificationService) {}

  executionStarted(specCount: number, waveCount: number): void {
    this.notificationService.show({
      title: 'Execution Started',
      body: `Processing ${specCount} SPECs in ${waveCount} waves`,
      urgency: 'low'
    })
  }

  executionCompleted(successful: number, total: number, duration: string): void {
    this.notificationService.show({
      title: 'Execution Complete',
      body: `${successful}/${total} SPECs completed in ${duration}`,
      urgency: 'normal'
    })
  }

  specFailed(specId: string, error: string): void {
    this.notificationService.show({
      title: `SPEC Failed: ${specId}`,
      body: error.slice(0, 100),
      urgency: 'critical'
    })
  }

  waveCompleted(waveNumber: number, remaining: number): void {
    this.notificationService.show({
      title: `Wave ${waveNumber} Complete`,
      body: remaining > 0 ? `${remaining} waves remaining` : 'All waves finished',
      urgency: 'low',
      silent: true
    })
  }
}
```

### Task 3: Integrate with Execution Events

```typescript
// src/main/handlers/notification.handlers.ts
import { ipcMain } from 'electron'
import { NotificationService } from '../services/notification.service'
import { ExecutionNotifications } from '../services/notification-types'

export function registerNotificationHandlers(
  notificationService: NotificationService
): void {
  const execNotifications = new ExecutionNotifications(notificationService)

  ipcMain.on('notification:execution-started', (_, data) => {
    execNotifications.executionStarted(data.specCount, data.waveCount)
  })

  ipcMain.on('notification:execution-completed', (_, data) => {
    execNotifications.executionCompleted(
      data.successful,
      data.total,
      data.duration
    )
  })

  ipcMain.on('notification:spec-failed', (_, data) => {
    execNotifications.specFailed(data.specId, data.error)
  })

  ipcMain.on('notification:wave-completed', (_, data) => {
    execNotifications.waveCompleted(data.waveNumber, data.remaining)
  })

  // Settings handlers
  ipcMain.handle('notification:set-enabled', (_, enabled: boolean) => {
    notificationService.setEnabled(enabled)
  })

  ipcMain.handle('notification:set-sound', (_, enabled: boolean) => {
    notificationService.setSoundEnabled(enabled)
  })
}
```

### Task 4: Create Settings Integration

```typescript
// Add to src/renderer/components/settings/NotificationSettings.tsx
import { useState, useEffect } from 'react'
import { Switch } from '@/components/ui'

interface NotificationSettings {
  enabled: boolean
  soundEnabled: boolean
  showOnStart: boolean
  showOnComplete: boolean
  showOnError: boolean
  showWaveProgress: boolean
}

export default function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    soundEnabled: true,
    showOnStart: true,
    showOnComplete: true,
    showOnError: true,
    showWaveProgress: false
  })

  const updateSetting = <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    window.electronAPI.setNotificationSetting(key, value)
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Notifications</h3>

      <div className="flex items-center justify-between">
        <label>Enable Notifications</label>
        <Switch
          checked={settings.enabled}
          onCheckedChange={v => updateSetting('enabled', v)}
        />
      </div>

      <div className="flex items-center justify-between">
        <label>Sound</label>
        <Switch
          checked={settings.soundEnabled}
          onCheckedChange={v => updateSetting('soundEnabled', v)}
          disabled={!settings.enabled}
        />
      </div>

      <div className="border-t border-slate-700 pt-4 mt-4">
        <h4 className="text-sm font-medium mb-2">Notification Types</h4>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm">Execution Start</label>
            <Switch
              checked={settings.showOnStart}
              onCheckedChange={v => updateSetting('showOnStart', v)}
              disabled={!settings.enabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm">Execution Complete</label>
            <Switch
              checked={settings.showOnComplete}
              onCheckedChange={v => updateSetting('showOnComplete', v)}
              disabled={!settings.enabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm">Error Alerts</label>
            <Switch
              checked={settings.showOnError}
              onCheckedChange={v => updateSetting('showOnError', v)}
              disabled={!settings.enabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm">Wave Progress</label>
            <Switch
              checked={settings.showWaveProgress}
              onCheckedChange={v => updateSetting('showWaveProgress', v)}
              disabled={!settings.enabled}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
```

### Task 5: Add Preload API

```typescript
// Add to src/preload/index.ts
contextBridge.exposeInMainWorld('electronAPI', {
  // ... existing APIs

  // Notification APIs
  notifyExecutionStarted: (specCount: number, waveCount: number) =>
    ipcRenderer.send('notification:execution-started', { specCount, waveCount }),

  notifyExecutionCompleted: (successful: number, total: number, duration: string) =>
    ipcRenderer.send('notification:execution-completed', { successful, total, duration }),

  notifySpecFailed: (specId: string, error: string) =>
    ipcRenderer.send('notification:spec-failed', { specId, error }),

  notifyWaveCompleted: (waveNumber: number, remaining: number) =>
    ipcRenderer.send('notification:wave-completed', { waveNumber, remaining }),

  setNotificationSetting: (key: string, value: boolean) =>
    ipcRenderer.invoke('notification:set-' + key, value)
})
```

## Platform Considerations

| Platform | API | Notes |
|----------|-----|-------|
| macOS | Notification Center | Full support |
| Windows | Toast Notifications | Requires app ID |
| Linux | libnotify | May need fallback |

## Risk Analysis

| Risk | Mitigation |
|------|------------|
| Permission denied | Graceful fallback |
| Notification spam | Rate limiting |
| DND mode active | Respect system settings |

## Success Criteria

- Notifications appear on all platforms
- Click brings window to front
- Settings persist correctly
- No notification spam
- Graceful handling when unavailable
