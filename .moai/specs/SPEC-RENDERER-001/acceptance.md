# Acceptance Criteria: SPEC-RENDERER-001

## Test Scenarios

### Scenario 1: React App Mounting

**Given** index.html and main.tsx are created
**When** Electron loads the renderer
**Then** React mounts to the root element
**And** App component renders without errors

### Scenario 2: Language Detection

**Given** i18n is configured with browser detection
**When** user's browser is set to Korean
**Then** Korean translations are loaded by default
**And** UI displays in Korean

### Scenario 3: Language Switching

**Given** i18n is initialized
**When** user changes language to Japanese
**Then** all UI strings update to Japanese
**And** the change persists across navigation

### Scenario 4: Fallback Language

**Given** i18n fallback is set to English
**When** a translation key is missing in Korean
**Then** the English translation is used
**And** no error is displayed to user

### Scenario 5: Tailwind CSS Loading

**Given** index.css includes Tailwind directives
**When** the app renders
**Then** Tailwind utility classes work
**And** custom colors (anthropic, slate) are available

### Scenario 6: Glassmorphism Styling

**Given** glass-panel class is defined
**When** a component uses class="glass-panel"
**Then** the element has translucent background
**And** backdrop blur effect is visible
**And** border and shadow are applied

### Scenario 7: Dark Mode Default

**Given** the app starts
**When** no theme preference is set
**Then** dark mode is active by default
**And** background is slate-900 (#0F172A)

## Quality Gates

- [ ] index.html created with proper structure
- [ ] main.tsx mounts React app
- [ ] App.tsx implements view switching
- [ ] index.css includes Tailwind and custom classes
- [ ] i18n/index.ts configures 4 languages
- [ ] 24 translation JSON files created (4 langs x 6 namespaces)
- [ ] Language switching works correctly
- [ ] Glassmorphism effects render properly
