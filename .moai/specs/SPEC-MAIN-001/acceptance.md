# Acceptance Criteria: SPEC-MAIN-001

## Test Scenarios

### Scenario 1: Application Launch

**Given** the Main process files are created
**When** the developer runs `npm run dev`
**Then** an Electron window opens
**And** the window has the correct dimensions (1400x900)
**And** the window has dark background (#0F172A)

### Scenario 2: Window Minimum Size

**Given** the application window is open
**When** the user attempts to resize below 1024x768
**Then** the window stops at the minimum size
**And** cannot be resized smaller

### Scenario 3: IPC Handler Registration

**Given** the Main process is running
**When** IPC handlers are registered during app ready
**Then** all bootstrap handlers are available
**And** all spec handlers are available
**And** all session handlers are available
**And** all config handlers are available

### Scenario 4: IPC Communication

**Given** IPC handlers are registered
**When** Renderer sends 'bootstrap:check' request
**Then** Main process receives the request
**And** Main process returns BootstrapResult

### Scenario 5: Context Isolation Security

**Given** the BrowserWindow is created
**When** inspecting webPreferences
**Then** contextIsolation is true
**And** nodeIntegration is false
**And** preload script path is correctly set

### Scenario 6: App Lifecycle - Close

**Given** the application is running on Windows/Linux
**When** all windows are closed
**Then** the application quits

## Quality Gates

- [ ] Main entry point (index.ts) created
- [ ] IPC index (ipc/index.ts) created
- [ ] IPC handlers (ipc/handlers.ts) created
- [ ] Window opens with correct configuration
- [ ] Context isolation enabled
- [ ] All IPC handlers respond correctly
