# Acceptance Criteria: SPEC-BUILD-001

## Test Scenarios

### Scenario 1: Development Build

**Given** source code is ready
**When** running `npm run dev`
**Then** Vite dev server starts
**And** Electron window opens
**And** hot reload works correctly

### Scenario 2: Production Build

**Given** source code is ready
**When** running `npm run build`
**Then** TypeScript compiles without errors
**And** assets are optimized
**And** output is in dist/ directory

### Scenario 3: Windows Packaging

**Given** production build exists
**When** running `npm run package:win`
**Then** NSIS installer is created
**And** both x64 and arm64 are built
**And** installer runs correctly

### Scenario 4: macOS Packaging

**Given** production build exists
**When** running `npm run package:mac`
**Then** DMG is created
**And** app is signed with Developer ID
**And** app is notarized successfully

### Scenario 5: Linux Packaging

**Given** production build exists
**When** running `npm run package:linux`
**Then** AppImage is created
**And** deb package is created
**And** rpm package is created

### Scenario 6: Code Signing Verification

**Given** signed Windows installer
**When** checking digital signature
**Then** certificate is valid
**And** timestamp is present
**And** hash algorithm is SHA256

### Scenario 7: Auto-Update Check

**Given** app is running version 1.0.0
**When** version 1.1.0 is published
**Then** update notification appears
**And** download option is offered
**And** install option is available

### Scenario 8: Auto-Update Installation

**Given** update is downloaded
**When** user clicks Install Now
**Then** app quits gracefully
**And** installer runs automatically
**And** new version launches

### Scenario 9: CI/CD Pipeline

**Given** tag v1.0.0 is pushed
**When** GitHub Actions runs
**Then** tests pass
**And** builds for all platforms
**And** release is created

### Scenario 10: Version Bump

**Given** current version is 1.0.0
**When** running `npm run version:minor`
**Then** version becomes 1.1.0
**And** git tag v1.1.0 is created
**And** pushed to remote

## Quality Gates

- [ ] electron-builder configured
- [ ] macOS entitlements set
- [ ] Auto-updater service works
- [ ] GitHub Actions workflow complete
- [ ] Build scripts in package.json
- [ ] Code signing configured
- [ ] Changelog generation works
- [ ] All platform builds succeed
- [ ] Artifacts under 200MB
- [ ] Auto-update flow works
