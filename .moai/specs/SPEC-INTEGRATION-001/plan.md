# Implementation Plan: SPEC-INTEGRATION-001

## Overview

Complete the application with dialogs, stores, hooks, and final assets.

## Task Breakdown

### Task 1: Create Settings Dialog

```typescript
// src/renderer/components/dialogs/SettingsDialog.tsx
import { Dialog, Select, Button } from '@/components/ui'
import { useConfig } from '@/hooks/useConfig'
import { useI18n } from '@/hooks/useI18n'

interface SettingsDialogProps {
  open: boolean
  onClose: () => void
}

export default function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const { config, setConfig } = useConfig()
  const { t, changeLocale, locale } = useI18n()

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <Dialog.Content className="glass-panel">
        <Dialog.Title>{t('settings.title')}</Dialog.Title>

        {/* Language Selection */}
        <div className="mt-4">
          <label>{t('settings.language')}</label>
          <Select
            value={locale}
            onValueChange={changeLocale}
            options={[
              { value: 'ko', label: '한국어' },
              { value: 'en', label: 'English' },
              { value: 'ja', label: '日本語' },
              { value: 'zh', label: '中文' }
            ]}
          />
        </div>

        {/* Max Parallel Sessions */}
        <div className="mt-4">
          <label>{t('settings.maxSessions')}</label>
          <input
            type="number"
            min={1}
            max={10}
            value={config.maxParallelSessions}
            onChange={(e) => setConfig('maxParallelSessions', Number(e.target.value))}
          />
        </div>

        {/* Worktree Root */}
        <div className="mt-4">
          <label>{t('settings.worktreeRoot')}</label>
          <input
            type="text"
            value={config.worktreeRoot}
            onChange={(e) => setConfig('worktreeRoot', e.target.value)}
          />
        </div>

        <Dialog.Footer>
          <Button variant="primary" onClick={onClose}>
            {t('common.save')}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  )
}
```

### Task 2: Create Confirm Dialog

```typescript
// src/renderer/components/dialogs/ConfirmDialog.tsx
import { Dialog, Button } from '@/components/ui'
import { useI18n } from '@/hooks/useI18n'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  const { t } = useI18n()

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <Dialog.Content className="glass-panel max-w-md">
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Description>{message}</Dialog.Description>

        <Dialog.Footer className="mt-4 flex gap-2 justify-end">
          <Button variant="ghost" onClick={onCancel}>
            {cancelLabel || t('common.cancel')}
          </Button>
          <Button variant="primary" onClick={onConfirm}>
            {confirmLabel || t('common.confirm')}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  )
}
```

### Task 3: Create Error Dialog

```typescript
// src/renderer/components/dialogs/ErrorDialog.tsx
import { useState } from 'react'
import { Dialog, Button } from '@/components/ui'
import { useI18n } from '@/hooks/useI18n'

interface ErrorDialogProps {
  open: boolean
  error: Error | string
  onClose: () => void
  onRetry?: () => void
}

export default function ErrorDialog({
  open,
  error,
  onClose,
  onRetry
}: ErrorDialogProps) {
  const { t } = useI18n()
  const [showDetails, setShowDetails] = useState(false)

  const errorMessage = typeof error === 'string' ? error : error.message
  const errorStack = typeof error === 'string' ? null : error.stack

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <Dialog.Content className="glass-panel border-red-500/50">
        <Dialog.Title className="text-red-400">
          {t('errors.title')}
        </Dialog.Title>
        <Dialog.Description>
          {errorMessage}
        </Dialog.Description>

        {errorStack && (
          <>
            <button
              className="text-sm text-slate-400 mt-2"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? t('errors.hideDetails') : t('errors.showDetails')}
            </button>
            {showDetails && (
              <pre className="mt-2 p-2 bg-slate-800 rounded text-xs overflow-auto max-h-40">
                {errorStack}
              </pre>
            )}
          </>
        )}

        <Dialog.Footer className="mt-4 flex gap-2 justify-end">
          <Button variant="ghost" onClick={onClose}>
            {t('common.close')}
          </Button>
          {onRetry && (
            <Button variant="primary" onClick={onRetry}>
              {t('common.retry')}
            </Button>
          )}
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  )
}
```

### Task 4: Create Config Store

```typescript
// src/renderer/stores/configStore.ts
import { create } from 'zustand'
import type { AppConfig, SupportedLocale } from '@/shared/types'

interface ConfigState {
  config: AppConfig
  isLoading: boolean
  loadConfig: () => Promise<void>
  setConfigValue: <K extends keyof AppConfig>(key: K, value: AppConfig[K]) => Promise<void>
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  config: {
    locale: 'en',
    theme: 'dark',
    maxParallelSessions: 10,
    worktreeRoot: '~/worktrees'
  },
  isLoading: true,

  loadConfig: async () => {
    set({ isLoading: true })
    const config = await window.electronAPI.getConfig('all')
    set({ config, isLoading: false })
  },

  setConfigValue: async (key, value) => {
    await window.electronAPI.setConfig(key, value)
    set((state) => ({
      config: { ...state.config, [key]: value }
    }))
  }
}))
```

### Task 5: Create App Store

```typescript
// src/renderer/stores/appStore.ts
import { create } from 'zustand'

interface AppState {
  isBootstrapComplete: boolean
  currentView: 'startup' | 'main'
  activeDialog: string | null

  setBootstrapComplete: (complete: boolean) => void
  setCurrentView: (view: 'startup' | 'main') => void
  openDialog: (dialogId: string) => void
  closeDialog: () => void
}

export const useAppStore = create<AppState>((set) => ({
  isBootstrapComplete: false,
  currentView: 'startup',
  activeDialog: null,

  setBootstrapComplete: (complete) => set({
    isBootstrapComplete: complete,
    currentView: complete ? 'main' : 'startup'
  }),

  setCurrentView: (view) => set({ currentView: view }),
  openDialog: (dialogId) => set({ activeDialog: dialogId }),
  closeDialog: () => set({ activeDialog: null })
}))
```

### Task 6: Create useConfig Hook

```typescript
// src/renderer/hooks/useConfig.ts
import { useEffect } from 'react'
import { useConfigStore } from '@/stores/configStore'

export function useConfig() {
  const store = useConfigStore()

  useEffect(() => {
    store.loadConfig()
  }, [])

  return {
    config: store.config,
    isLoading: store.isLoading,
    setConfig: store.setConfigValue
  }
}
```

### Task 7: Create useI18n Hook

```typescript
// src/renderer/hooks/useI18n.ts
import { useTranslation } from 'react-i18next'
import type { SupportedLocale } from '@/shared/types'

export function useI18n() {
  const { t, i18n } = useTranslation()

  const changeLocale = (locale: SupportedLocale) => {
    i18n.changeLanguage(locale)
  }

  return {
    t,
    locale: i18n.language as SupportedLocale,
    changeLocale
  }
}
```

### Task 8: Create Application Icon

Create icon.png in resources folder:
- Base size: 512x512 pixels
- Design: Stylized "CPR" or parallel bars
- Primary color: #FF6B35 (Anthropic Orange)
- Background: Transparent or #0F172A (Slate)

## File Structure

```
src/renderer/
├── components/dialogs/
│   ├── SettingsDialog.tsx    (~100 lines)
│   ├── ConfirmDialog.tsx     (~50 lines)
│   └── ErrorDialog.tsx       (~80 lines)
├── stores/
│   ├── configStore.ts        (~50 lines)
│   └── appStore.ts           (~40 lines)
└── hooks/
    ├── useConfig.ts          (~20 lines)
    └── useI18n.ts            (~20 lines)

resources/
└── icon.png                  (512x512)
```

## Risk Analysis

| Risk | Mitigation |
|------|------------|
| Icon size issues | Generate all required sizes |
| Config persistence | Test across restarts |
| Dialog stacking | Single active dialog |
| i18n missing keys | Fallback to English |

## Success Criteria

- All 3 dialogs work correctly
- Settings persist across restarts
- Language switching works immediately
- App icon displays on all platforms
- All stores and hooks function properly
- Application is feature-complete
