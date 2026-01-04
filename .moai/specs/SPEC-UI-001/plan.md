# Implementation Plan: SPEC-UI-001

## Overview

Create 7 reusable UI components following shadcn/ui patterns.

## Task Breakdown

### Task 1: Create Button Component

```typescript
// src/renderer/components/ui/button.tsx
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  children: React.ReactNode
  // ...other props
}

export function Button({ variant = 'primary', size = 'md', ...props }: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'rounded-lg font-medium transition-colors',
        variants[variant],
        sizes[size]
      )}
      {...props}
    />
  )
}
```

### Task 2: Create Card Component

```typescript
// src/renderer/components/ui/card.tsx
interface CardProps {
  className?: string
  children: React.ReactNode
}

export function Card({ className, children }: CardProps) {
  return (
    <motion.div
      className={cn('glass-panel p-4', className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {children}
    </motion.div>
  )
}

export function CardHeader({ children }) { /* ... */ }
export function CardContent({ children }) { /* ... */ }
export function CardFooter({ children }) { /* ... */ }
```

### Task 3: Create Dialog Component

Features:
- Portal rendering to body
- Backdrop with blur effect
- Focus trap using focus-trap-react
- Escape key to close
- Framer Motion animations

### Task 4: Create Progress Component

Features:
- Determinate mode with percentage
- Indeterminate mode with animation
- Color variants matching theme
- Smooth value transitions

### Task 5: Create Select Component

Features:
- Dropdown with Radix UI primitives
- Search filter input
- Multi-select support
- Custom option renderer

### Task 6: Create Tabs Component

Features:
- Tab list with sliding indicator
- AnimatePresence for panel transitions
- Keyboard navigation
- Controlled/uncontrolled modes

### Task 7: Create Tooltip Component

Features:
- Radix UI Tooltip primitives
- Configurable delay and placement
- Dark themed content
- Arrow indicator

## File Structure

```
src/renderer/components/ui/
├── button.tsx      (~80 lines)
├── card.tsx        (~60 lines)
├── dialog.tsx      (~120 lines)
├── progress.tsx    (~50 lines)
├── select.tsx      (~100 lines)
├── tabs.tsx        (~90 lines)
└── tooltip.tsx     (~40 lines)
```

## Component Styling

### Color Variants

| Variant | Background | Text | Border |
|---------|------------|------|--------|
| Primary | anthropic (#FF6B35) | white | none |
| Secondary | slate-700 | white | slate-600 |
| Ghost | transparent | slate-300 | none |
| Destructive | red-600 | white | none |

### Glassmorphism Base

All cards and panels use:
- bg-slate-900/80
- backdrop-blur-xl
- border border-slate-700/50
- shadow-xl shadow-black/20
- rounded-xl

## Risk Analysis

| Risk | Mitigation |
|------|------------|
| Accessibility issues | Use Radix UI primitives |
| Animation performance | Use will-change sparingly |
| Bundle size | Tree-shake unused components |

## Success Criteria

- All 7 components created and exported
- All components are accessible
- Animations are smooth (60fps)
- Components work in dark theme
- TypeScript types are complete
