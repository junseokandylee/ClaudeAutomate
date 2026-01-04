/**
 * Settings Dialog Component
 *
 * REQ-001: Settings Dialog
 * TAG-DESIGN-001: Settings Dialog Design
 * TAG-FUNC-001: Settings Dialog Implementation
 *
 * Displays application settings and allows configuration:
 * - Language selection (ko, en, ja, zh)
 * - Maximum parallel sessions
 * - Worktree root directory
 * - Persist settings via config service
 *
 * Technical Constraints:
 * - Uses Dialog component from SPEC-UI-001
 * - Uses Button component from SPEC-UI-001
 * - Integrates with i18n from SPEC-RENDERER-001
 * - Uses ConfigService from SPEC-STARTUP-001 via IPC
 */

import { type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog } from './Dialog';
import { Button } from './Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './Select';
import { cn } from '@/shared/lib/utils';
import type { AppConfig } from '@/shared/types';

/**
 * Language option mapping
 */
const LANGUAGE_OPTIONS: Record<string, string> = {
  ko: 'settings.languages.ko',
  en: 'settings.languages.en',
  ja: 'settings.languages.ja',
  zh: 'settings.languages.zh',
};

/**
 * Settings Dialog Props
 */
export interface SettingsDialogProps {
  /** Controlled open state */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Current application configuration */
  config: AppConfig;
  /** Callback when configuration changes */
  onConfigChange: <K extends keyof AppConfig>(key: K, value: AppConfig[K]) => void;
}

/**
 * Settings Dialog Component
 *
 * Displays and allows modification of application settings.
 *
 * @example
 * ```tsx
 * <SettingsDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   config={config}
 *   onConfigChange={handleConfigChange}
 * />
 * ```
 */
export const SettingsDialog = ({
  open,
  onOpenChange,
  config,
  onConfigChange,
}: SettingsDialogProps) => {
  const { t } = useTranslation();

  /**
   * Handle language change
   */
  const handleLanguageChange = (value: string) => {
    onConfigChange('locale', value as AppConfig['locale']);
  };

  /**
   * Handle parallel sessions change
   */
  const handleParallelSessionsChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 1 && value <= 10) {
      onConfigChange('maxParallelSessions', value);
    }
  };

  /**
   * Handle save button click
   */
  const handleSave = () => {
    onOpenChange(false);
  };

  /**
   * Handle cancel button click
   */
  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content size="lg" className="sm:max-w-[500px]">
        <Dialog.Header>
          <Dialog.Title>{t('settings.title')}</Dialog.Title>
        </Dialog.Header>

        <div className="space-y-6 py-4">
          {/* General Settings */}
          <section className="space-y-4">
            <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {t('settings.general.title')}
            </h3>

            {/* Language Selection */}
            <div className="space-y-2">
              <label htmlFor="language-select" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {t('settings.general.language')}
              </label>
              <Select
                value={config.locale}
                onValueChange={handleLanguageChange}
              >
                <SelectTrigger id="language-select" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LANGUAGE_OPTIONS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {t(label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Worktree Root Directory */}
            <div className="space-y-2">
              <label htmlFor="project-root" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {t('settings.general.projectRoot')}
              </label>
              <input
                id="project-root"
                type="text"
                readOnly
                value={config.projectRoot}
                className={cn(
                  'flex h-10 w-full rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2',
                  'text-sm text-zinc-700 placeholder:text-zinc-400',
                  'focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                  'dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200',
                  'dark:focus:ring-zinc-300 dark:focus:ring-offset-zinc-950'
                )}
              />
            </div>
          </section>

          {/* Advanced Settings */}
          <section className="space-y-4">
            <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {t('settings.advanced.title')}
            </h3>

            {/* Max Parallel Sessions */}
            <div className="space-y-2">
              <label htmlFor="parallel-sessions" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {t('settings.advanced.parallelSessions')}
              </label>
              <input
                id="parallel-sessions"
                type="number"
                min="1"
                max="10"
                value={config.maxParallelSessions}
                onChange={handleParallelSessionsChange}
                className={cn(
                  'flex h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2',
                  'text-sm text-zinc-700 placeholder:text-zinc-400',
                  'focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                  'dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200',
                  'dark:focus:ring-zinc-300 dark:focus:ring-offset-zinc-950'
                )}
              />
            </div>
          </section>
        </div>

        <Dialog.Footer>
          <Button variant="ghost" onClick={handleCancel}>
            {t('cancel')}
          </Button>
          <Button variant="primary" onClick={handleSave}>
            {t('save')}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
};

SettingsDialog.displayName = 'SettingsDialog';
