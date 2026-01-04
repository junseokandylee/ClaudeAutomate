/**
 * StatusBar Component
 *
 * REQ-006: StatusBar Component
 * TAG-DESIGN-006: StatusBar Design
 * TAG-FUNC-006: StatusBar Implementation
 *
 * Displays application status and quick settings access.
 * Features:
 * - Application status display
 * - Active session count
 * - Current locale display
 * - Quick settings button
 *
 * @example
 * ```tsx
 * function MainView() {
 *   return <StatusBar />;
 * }
 * ```
 */

import { useState, useEffect } from 'react';
import { Button } from '@/renderer/components/Button';
import { useAppStore } from '@/renderer/stores/appStore';
import { useConfigStore } from '@/renderer/stores/configStore';
import { cn } from '@/shared/lib/utils';

/**
 * StatusBar Component
 */
export function StatusBar() {
  const [sessionCount, setSessionCount] = useState(0);
  const openDialog = useAppStore((state) => state.openDialog);
  const locale = useConfigStore((state) => state.config.locale);

  useEffect(() => {
    // Register for session updates
    const cleanup = window.electronAPI.onSessionUpdate((event, sessions) => {
      setSessionCount(sessions.length);
    });

    return cleanup;
  }, []);

  const handleSettingsClick = () => {
    openDialog('settings');
  };

  return (
    <div
      data-testid="status-bar"
      className={cn(
        'status-bar',
        'flex items-center justify-between',
        'px-4 py-2',
        'bg-black/20 backdrop-blur-lg',
        'border-t border-white/10',
        'rounded-lg'
      )}
    >
      {/* Left Side - Status */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-muted-foreground">Ready</span>
        </div>

        <div className="text-muted-foreground">
          Active Sessions: <span className="font-semibold">{sessionCount}</span>
        </div>
      </div>

      {/* Right Side - Info and Actions */}
      <div className="flex items-center gap-4">
        {/* Locale */}
        <div className="text-sm text-muted-foreground">
          Locale: <span className="font-semibold uppercase">{locale}</span>
        </div>

        {/* Settings Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSettingsClick}
          aria-label="Open Settings"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </Button>
      </div>
    </div>
  );
}
