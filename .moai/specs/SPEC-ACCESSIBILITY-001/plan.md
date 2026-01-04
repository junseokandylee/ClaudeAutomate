# Implementation Plan: SPEC-ACCESSIBILITY-001

## Overview

Implement WCAG 2.1 AA compliant accessibility features throughout the application.

## Task Breakdown

### Task 1: Accessibility Provider

```typescript
// src/renderer/providers/AccessibilityProvider.tsx
import { createContext, useContext, useEffect, useState } from 'react'

interface AccessibilityContext {
  reducedMotion: boolean
  highContrast: boolean
  fontSize: 'normal' | 'large' | 'x-large'
  screenReaderActive: boolean
}

const AccessibilityContext = createContext<AccessibilityContext>({
  reducedMotion: false,
  highContrast: false,
  fontSize: 'normal',
  screenReaderActive: false
})

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AccessibilityContext>({
    reducedMotion: false,
    highContrast: false,
    fontSize: 'normal',
    screenReaderActive: false
  })

  useEffect(() => {
    // Detect reduced motion preference
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setState(s => ({ ...s, reducedMotion: motionQuery.matches }))

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setState(s => ({ ...s, reducedMotion: e.matches }))
    }
    motionQuery.addEventListener('change', handleMotionChange)

    // Detect high contrast preference
    const contrastQuery = window.matchMedia('(prefers-contrast: more)')
    setState(s => ({ ...s, highContrast: contrastQuery.matches }))

    return () => {
      motionQuery.removeEventListener('change', handleMotionChange)
    }
  }, [])

  return (
    <AccessibilityContext.Provider value={state}>
      {children}
    </AccessibilityContext.Provider>
  )
}

export const useAccessibility = () => useContext(AccessibilityContext)
```

### Task 2: Skip Link Component

```typescript
// src/renderer/components/a11y/SkipLink.tsx
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="
        sr-only focus:not-sr-only
        focus:absolute focus:top-4 focus:left-4
        focus:z-50 focus:bg-anthropic focus:text-white
        focus:px-4 focus:py-2 focus:rounded-md
      "
    >
      Skip to main content
    </a>
  )
}
```

### Task 3: Focus Trap Hook

```typescript
// src/renderer/hooks/useFocusTrap.ts
import { useEffect, useRef } from 'react'

export function useFocusTrap(active: boolean) {
  const containerRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!active || !containerRef.current) return

    // Store current focus
    previousFocusRef.current = document.activeElement as HTMLElement

    // Find focusable elements
    const focusableElements = containerRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    // Focus first element
    firstElement?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previousFocusRef.current?.focus()
    }
  }, [active])

  return containerRef
}
```

### Task 4: Live Region Component

```typescript
// src/renderer/components/a11y/LiveRegion.tsx
import { useEffect, useState } from 'react'

interface Props {
  message: string
  politeness?: 'polite' | 'assertive'
  clearAfter?: number
}

export function LiveRegion({
  message,
  politeness = 'polite',
  clearAfter = 5000
}: Props) {
  const [announcement, setAnnouncement] = useState('')

  useEffect(() => {
    if (message) {
      setAnnouncement(message)

      if (clearAfter > 0) {
        const timer = setTimeout(() => setAnnouncement(''), clearAfter)
        return () => clearTimeout(timer)
      }
    }
  }, [message, clearAfter])

  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  )
}
```

### Task 5: Accessible List Item

```typescript
// src/renderer/components/main/AccessibleSpecItem.tsx
import { useId } from 'react'

interface Props {
  spec: SpecInfo
  selected: boolean
  onSelect: () => void
  onActivate: () => void
}

export function AccessibleSpecItem({
  spec,
  selected,
  onSelect,
  onActivate
}: Props) {
  const labelId = useId()
  const descId = useId()

  return (
    <li
      role="option"
      aria-selected={selected}
      aria-labelledby={labelId}
      aria-describedby={descId}
      tabIndex={0}
      className={`
        focus:outline-none focus:ring-2 focus:ring-anthropic
        ${selected ? 'bg-anthropic/20' : ''}
      `}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onActivate()
        }
      }}
    >
      <span id={labelId} className="font-medium">
        {spec.id}
      </span>
      <span id={descId} className="text-sm text-slate-400">
        {spec.title} - Status: {spec.status}
      </span>
    </li>
  )
}
```

### Task 6: Focus Visible Styles

```css
/* src/renderer/index.css */

/* Remove default focus outline, use custom */
*:focus {
  outline: none;
}

/* Visible focus for keyboard navigation */
*:focus-visible {
  outline: 2px solid #FF6B35;
  outline-offset: 2px;
}

/* Skip link styling */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.sr-only:focus {
  position: static;
  width: auto;
  height: auto;
  margin: 0;
  overflow: visible;
  clip: auto;
  white-space: normal;
}

/* High contrast mode */
@media (prefers-contrast: more) {
  :root {
    --contrast-text: #000;
    --contrast-bg: #fff;
    --contrast-border: 3px solid #000;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  ::before,
  ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Task 7: Accessible Button Component

```typescript
// src/renderer/components/ui/accessible-button.tsx
import { forwardRef } from 'react'
import { Button, ButtonProps } from './button'

interface AccessibleButtonProps extends ButtonProps {
  ariaLabel?: string
  ariaDescribedBy?: string
  ariaExpanded?: boolean
  ariaHaspopup?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog'
}

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({ ariaLabel, ariaDescribedBy, ariaExpanded, ariaHaspopup, children, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-expanded={ariaExpanded}
        aria-haspopup={ariaHaspopup}
        {...props}
      >
        {children}
      </Button>
    )
  }
)
```

### Task 8: Status Announcer Hook

```typescript
// src/renderer/hooks/useStatusAnnouncer.ts
import { useCallback, useState } from 'react'

export function useStatusAnnouncer() {
  const [message, setMessage] = useState('')

  const announce = useCallback((text: string, options?: { clear?: number }) => {
    setMessage(text)

    if (options?.clear) {
      setTimeout(() => setMessage(''), options.clear)
    }
  }, [])

  const announceProgress = useCallback((current: number, total: number) => {
    announce(`Progress: ${current} of ${total} complete`)
  }, [announce])

  const announceError = useCallback((error: string) => {
    announce(`Error: ${error}`, { clear: 10000 })
  }, [announce])

  return { message, announce, announceProgress, announceError }
}
```

## Accessibility Checklist

| Category | Requirement | Status |
|----------|-------------|--------|
| Perceivable | Alt text for images | Required |
| Perceivable | Color contrast 4.5:1 | Required |
| Operable | Keyboard accessible | Required |
| Operable | Skip navigation | Required |
| Understandable | Consistent navigation | Required |
| Robust | Valid HTML | Required |

## Risk Analysis

| Risk | Mitigation |
|------|------------|
| Screen reader incompatibility | Test with NVDA, VoiceOver |
| Focus trapping bugs | Comprehensive testing |
| Contrast issues | Use contrast checker tools |

## Success Criteria

- WCAG 2.1 AA compliance verified
- Screen reader testing passed
- Keyboard-only navigation works
- Focus management correct
- Reduced motion respected
