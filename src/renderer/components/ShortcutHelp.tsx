/**
 * ShortcutHelp Component
 *
 * TAG-FUNC-007: ShortcutHelp Component Implementation
 * SPEC-HOTKEYS-001
 *
 * Displays keyboard shortcut help overlay.
 * Shows all shortcuts grouped by category with platform-specific key display.
 *
 * Features:
 * - Overlay dialog with all shortcuts
 * - Grouped by category (Global, Navigation, Execution, etc.)
 * - Platform-aware modifier key display (Cmd/Ctrl)
 * - Close on Escape or click outside
 * - Accessible with proper ARIA attributes
 */

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog } from './Dialog';
import { Button } from './Button';
import { getHotkeysByCategory, formatHotkey, type HotkeyCategory } from '@/renderer/config/hotkeys';
import { useHotkeys } from '@/renderer/hooks/useHotkeys';
import { cn } from '@/shared/lib/utils';

/**
 * Category display names
 */
const CATEGORIES: Record<HotkeyCategory, string> = {
  global: 'Global',
  navigation: 'Navigation',
  execution: 'Execution',
  'spec-list': 'SPEC List',
  help: 'Help',
};

/**
 * ShortcutHelp Component Props
 */
export interface ShortcutHelpProps {
  /** Controlled open state */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
}

/**
 * ShortcutHelp Component
 *
 * Displays keyboard shortcuts in an overlay dialog.
 *
 * @example
 * ```tsx
 * function App() {
 *   const [open, setOpen] = useState(false);
 *   useHotkeys('ctrl+/', () => setOpen(true));
 *
 *   return <ShortcutHelp open={open} onOpenChange={setOpen} />;
 * }
 * ```
 */
export const ShortcutHelp = ({ open, onOpenChange }: ShortcutHelpProps) => {
  const { t } = useTranslation();

  // Close on Escape key
  useHotkeys('escape', () => {
    if (open) {
      onOpenChange(false);
    }
  }, { enabled: open });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content
        data-testid="shortcut-help"
        size="lg"
        className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto"
      >
        <Dialog.Header>
          <Dialog.Title>Keyboard Shortcuts</Dialog.Title>
        </Dialog.Header>

        <div className="space-y-6 py-4">
          {(Object.keys(CATEGORIES) as HotkeyCategory[]).map((category) => {
            const hotkeys = getHotkeysByCategory(category);

            if (hotkeys.length === 0) return null;

            return (
              <section
                key={category}
                data-category={category}
                className="space-y-3"
              >
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {CATEGORIES[category]}
                </h3>

                <div className="grid grid-cols-1 gap-2">
                  {hotkeys.map((hotkey) => (
                    <div
                      key={hotkey.id}
                      className="flex items-center justify-between py-2 px-3 rounded-md bg-zinc-50 dark:bg-zinc-800"
                    >
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">
                        {t(hotkey.description)}
                      </span>

                      <div className="flex items-center gap-1">
                        {formatHotkey(hotkey.keys).split('+').map((key, index) => (
                          <kbd
                            key={index}
                            className={cn(
                              'kbd',
                              'px-2 py-1 text-xs font-semibold',
                              'bg-white dark:bg-zinc-900',
                              'border border-zinc-300 dark:border-zinc-700',
                              'rounded shadow-sm',
                              'text-zinc-900 dark:text-zinc-100'
                            )}
                          >
                            {key}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <Dialog.Footer>
          <Button variant="primary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
};

ShortcutHelp.displayName = 'ShortcutHelp';
