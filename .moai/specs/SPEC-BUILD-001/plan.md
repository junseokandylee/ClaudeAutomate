# Implementation Plan: SPEC-BUILD-001

## Overview

Configure electron-builder and CI/CD pipeline for cross-platform distribution.

## Task Breakdown

### Task 1: electron-builder Configuration

```javascript
// electron-builder.config.js
module.exports = {
  appId: 'com.moai.claude-parallel-runner',
  productName: 'Claude Parallel Runner',
  copyright: 'Copyright 2026 MoAI-ADK',

  directories: {
    output: 'release/${version}'
  },

  files: [
    'dist/**/*',
    '!**/*.map'
  ],

  mac: {
    category: 'public.app-category.developer-tools',
    target: [
      { target: 'dmg', arch: ['x64', 'arm64'] },
      { target: 'zip', arch: ['x64', 'arm64'] }
    ],
    hardenedRuntime: true,
    gatekeeperAssess: false,
    entitlements: 'build/entitlements.mac.plist',
    entitlementsInherit: 'build/entitlements.mac.plist',
    notarize: {
      teamId: process.env.APPLE_TEAM_ID
    }
  },

  win: {
    target: [
      { target: 'nsis', arch: ['x64', 'arm64'] }
    ],
    sign: './scripts/sign-windows.js',
    signingHashAlgorithms: ['sha256']
  },

  linux: {
    target: [
      { target: 'AppImage', arch: ['x64', 'arm64'] },
      { target: 'deb', arch: ['x64', 'arm64'] },
      { target: 'rpm', arch: ['x64', 'arm64'] }
    ],
    category: 'Development'
  },

  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    installerIcon: 'build/icon.ico',
    uninstallerIcon: 'build/icon.ico'
  },

  publish: {
    provider: 'github',
    owner: 'moai-adk',
    repo: 'claude-parallel-runner',
    releaseType: 'release'
  }
}
```

### Task 2: macOS Entitlements

```xml
<!-- build/entitlements.mac.plist -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.cs.allow-jit</key>
    <true/>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    <key>com.apple.security.cs.disable-library-validation</key>
    <true/>
    <key>com.apple.security.network.client</key>
    <true/>
    <key>com.apple.security.files.user-selected.read-write</key>
    <true/>
</dict>
</plist>
```

### Task 3: Auto-Update Configuration

```typescript
// src/main/services/updater.service.ts
import { autoUpdater, UpdateInfo } from 'electron-updater'
import { BrowserWindow, dialog } from 'electron'
import log from 'electron-log'

export class UpdaterService {
  private mainWindow: BrowserWindow | null = null

  constructor() {
    autoUpdater.logger = log
    autoUpdater.autoDownload = false
    autoUpdater.autoInstallOnAppQuit = true

    this.setupListeners()
  }

  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window
  }

  async checkForUpdates(): Promise<void> {
    try {
      await autoUpdater.checkForUpdates()
    } catch (error) {
      log.error('Update check failed:', error)
    }
  }

  private setupListeners(): void {
    autoUpdater.on('update-available', (info: UpdateInfo) => {
      this.notifyUpdateAvailable(info)
    })

    autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
      this.promptInstall(info)
    })

    autoUpdater.on('error', (error) => {
      log.error('Auto-updater error:', error)
    })
  }

  private async notifyUpdateAvailable(info: UpdateInfo): Promise<void> {
    const response = await dialog.showMessageBox({
      type: 'info',
      title: 'Update Available',
      message: `Version ${info.version} is available. Download now?`,
      buttons: ['Download', 'Later']
    })

    if (response.response === 0) {
      autoUpdater.downloadUpdate()
    }
  }

  private async promptInstall(info: UpdateInfo): Promise<void> {
    const response = await dialog.showMessageBox({
      type: 'info',
      title: 'Update Ready',
      message: `Version ${info.version} is ready to install.`,
      buttons: ['Install Now', 'Install on Quit']
    })

    if (response.response === 0) {
      autoUpdater.quitAndInstall()
    }
  }
}
```

### Task 4: GitHub Actions Workflow

```yaml
# .github/workflows/build.yml
name: Build and Release

on:
  push:
    tags:
      - 'v*'
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage

  build:
    needs: test
    strategy:
      matrix:
        os: [macos-latest, windows-latest, ubuntu-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci

      - name: Build
        run: npm run build

      - name: Package (macOS)
        if: matrix.os == 'macos-latest'
        env:
          CSC_LINK: ${{ secrets.MAC_CERTIFICATE }}
          CSC_KEY_PASSWORD: ${{ secrets.MAC_CERTIFICATE_PASSWORD }}
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_APP_SPECIFIC_PASSWORD: ${{ secrets.APPLE_APP_PASSWORD }}
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
        run: npm run package:mac

      - name: Package (Windows)
        if: matrix.os == 'windows-latest'
        env:
          WIN_CSC_LINK: ${{ secrets.WIN_CERTIFICATE }}
          WIN_CSC_KEY_PASSWORD: ${{ secrets.WIN_CERTIFICATE_PASSWORD }}
        run: npm run package:win

      - name: Package (Linux)
        if: matrix.os == 'ubuntu-latest'
        run: npm run package:linux

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: ${{ matrix.os }}-build
          path: release/*

  release:
    needs: build
    if: startsWith(github.ref, 'refs/tags/')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          files: |
            macos-latest-build/**/*
            windows-latest-build/**/*
            ubuntu-latest-build/**/*
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Task 5: Build Scripts

```json
// package.json scripts
{
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "preview": "electron-vite preview",
    "package": "npm run build && electron-builder",
    "package:mac": "npm run build && electron-builder --mac",
    "package:win": "npm run build && electron-builder --win",
    "package:linux": "npm run build && electron-builder --linux",
    "package:all": "npm run build && electron-builder -mwl",
    "release": "npm run build && electron-builder --publish always",
    "version:patch": "npm version patch && git push --follow-tags",
    "version:minor": "npm version minor && git push --follow-tags",
    "version:major": "npm version major && git push --follow-tags"
  }
}
```

### Task 6: Changelog Generation

```javascript
// scripts/changelog.js
const conventionalChangelog = require('conventional-changelog')
const fs = require('fs')

const stream = conventionalChangelog({
  preset: 'angular',
  releaseCount: 0
})

stream.pipe(fs.createWriteStream('CHANGELOG.md'))

console.log('Changelog generated!')
```

## Build Matrix

| Platform | Architecture | Format | Signing |
|----------|--------------|--------|---------|
| Windows | x64, arm64 | NSIS | Authenticode |
| macOS | x64, arm64 | DMG, pkg | Developer ID + Notarize |
| Linux | x64, arm64 | AppImage, deb, rpm | N/A |

## Risk Analysis

| Risk | Mitigation |
|------|------------|
| Signing failures | Test in staging |
| Large bundle size | Tree shaking, compression |
| Notarization timeout | Retry logic |

## Success Criteria

- Builds succeed for all platforms
- Code signing works correctly
- Auto-update downloads and installs
- CI/CD pipeline fully automated
- Release artifacts under 200MB
