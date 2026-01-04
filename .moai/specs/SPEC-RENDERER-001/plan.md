# Implementation Plan: SPEC-RENDERER-001

## Overview

Create React Renderer foundation with complete i18n support for 4 languages.

## Task Breakdown

### Task 1: Create HTML Template

```html
<!-- src/renderer/index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Claude Parallel Runner</title>
</head>
<body class="bg-slate-900 text-white">
  <div id="root"></div>
  <script type="module" src="./main.tsx"></script>
</body>
</html>
```

### Task 2: Create React Entry Point

```typescript
// src/renderer/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import './i18n'  // Initialize i18n
import './index.css'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

### Task 3: Create App Component

```typescript
// src/renderer/App.tsx
import { useAppStore } from './stores/appStore'
import StartupView from './components/startup/StartupView'
import MainView from './components/main/MainView'

function App() {
  const { isBootstrapComplete } = useAppStore()

  return (
    <div className="min-h-screen bg-slate-900">
      {isBootstrapComplete ? <MainView /> : <StartupView />}
    </div>
  )
}

export default App
```

### Task 4: Create Global Styles

```css
/* src/renderer/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-anthropic: #FF6B35;
  --color-slate: #0F172A;
  --color-blue: #3B82F6;
  --color-emerald: #10B981;
}

@layer components {
  .glass-panel {
    @apply bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl shadow-black/20 rounded-xl;
  }
}
```

### Task 5: Create i18n Configuration

```typescript
// src/renderer/i18n/index.ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import all translation files
import koCommon from './locales/ko/common.json'
import enCommon from './locales/en/common.json'
// ... more imports

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ko: { common: koCommon, /* ... */ },
      en: { common: enCommon, /* ... */ },
      ja: { /* ... */ },
      zh: { /* ... */ }
    },
    fallbackLng: 'en',
    ns: ['common', 'startup', 'main', 'settings', 'dialogs', 'errors'],
    defaultNS: 'common'
  })
```

### Task 6: Create Translation Files (24 files total)

Create JSON files for each locale and namespace:

```
src/renderer/i18n/locales/
├── ko/
│   ├── common.json
│   ├── startup.json
│   ├── main.json
│   ├── settings.json
│   ├── dialogs.json
│   └── errors.json
├── en/
│   └── (same 6 files)
├── ja/
│   └── (same 6 files)
└── zh/
    └── (same 6 files)
```

## Translation Key Structure

### common.json
- app.title, app.version
- actions.save, actions.cancel, actions.confirm
- status.loading, status.success, status.error

### startup.json
- title, subtitle
- dependencies.claude, dependencies.moaiAdk, dependencies.moaiWorktree
- status.checking, status.installed, status.missing

### main.json
- terminal.title, terminal.placeholder
- specs.title, specs.scan, specs.analyze
- sessions.title, sessions.start, sessions.stop
- waves.title, waves.current

## Risk Analysis

| Risk | Mitigation |
|------|------------|
| Missing translations | Fallback to English |
| Large bundle size | Lazy load translations |
| Inconsistent keys | Share key constants |

## Success Criteria

- React app renders in Electron window
- All 4 languages switchable
- Tailwind styles work correctly
- Glassmorphism effects render properly
