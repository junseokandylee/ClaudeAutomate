/**
 * SessionPanel Component
 *
 * REQ-003: Session Panel Component
 * TAG-DESIGN-003: SessionPanel Design
 * TAG-FUNC-003: SessionPanel Implementation
 *
 * Displays active session cards in a responsive grid layout.
 * Features:
 * - Display active session cards in responsive grid
 * - Show session output in mini-terminal view
 * - Provide stop button per session
 * - Indicate session status visually (pending=gray, running=blue, completed=green, failed=red)
 * - Show session ID and SPEC name
 * - Auto-scroll to bottom on new output
 *
 * @example
 * ```tsx
 * function MainView() {
 *   return <SessionPanel />;
 * }
 * ```
 */

import { useEffect, useRef } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { useSession } from '@/renderer/hooks/useSession';
import { cn } from '@/shared/lib/utils';

/**
 * Status color mapping for visual indicators
 */
const statusColors = {
  pending: 'border-gray-500',
  running: 'border-blue-500',
  completed: 'border-green-500',
  failed: 'border-red-500',
  idle: 'border-gray-400',
  cancelled: 'border-gray-400',
};

/**
 * Status badge color classes
 */
const statusBadgeColors = {
  pending: 'bg-gray-500/20 text-gray-300',
  running: 'bg-blue-500/20 text-blue-300',
  completed: 'bg-green-500/20 text-green-300',
  failed: 'bg-red-500/20 text-red-300',
  idle: 'bg-gray-400/20 text-gray-300',
  cancelled: 'bg-gray-400/20 text-gray-300',
};

/**
 * MiniTerminal Component
 *
 * Displays session output in a compact terminal view with auto-scroll.
 */
interface MiniTerminalProps {
  /** Session output to display */
  output: string;
  /** Test ID for testing */
  'data-testid'?: string;
}

function MiniTerminal({ output, 'data-testid': dataTestId }: MiniTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when output changes
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]);

  return (
    <div
      ref={terminalRef}
      data-testid={dataTestId || 'mini-terminal'}
      data-output={output}
      className={cn(
        'terminal-output',
        'bg-black/80 rounded',
        'p-2 font-mono text-xs',
        'h-32 overflow-y-auto',
        'text-gray-300 whitespace-pre-wrap break-words'
      )}
    >
      {output || 'Terminal output'}
    </div>
  );
}

/**
 * SessionCard Component
 *
 * Displays individual session information with controls.
 */
interface SessionCardProps {
  /** Session information */
  session: {
    id: string;
    specId: string;
    status: string;
    output: string;
    error: string | null;
  };
  /** Stop session handler */
  onStop: (sessionId: string) => void;
  /** Test ID for testing */
  'data-testid'?: string;
}

function SessionCard({ session, onStop, 'data-testid': dataTestId }: SessionCardProps) {
  const statusColor = statusColors[session.status as keyof typeof statusColors] || statusColors.idle;
  const badgeColor = statusBadgeColors[session.status as keyof typeof statusBadgeColors] || statusBadgeColors.idle;

  // Determine if stop button should be disabled
  const isStopDisabled = session.status === 'completed' || session.status === 'failed' || session.status === 'cancelled';

  return (
    <Card
      data-testid={dataTestId || `session-card-${session.id}`}
      className={cn(
        'session-card',
        'flex flex-col gap-3',
        'border-2',
        statusColor
      )}
    >
      {/* Header with session info and stop button */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold truncate">{session.specId}</h3>
          <p className="text-sm text-gray-400 truncate">{session.id}</p>
        </div>

        <Button
          variant="destructive"
          size="sm"
          onClick={() => onStop(session.id)}
          disabled={isStopDisabled}
          aria-label={`Stop session ${session.id}`}
        >
          Stop
        </Button>
      </div>

      {/* Status badge */}
      <div>
        <span
          className={cn(
            'status-badge',
            'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
            badgeColor
          )}
        >
          {session.status}
        </span>
      </div>

      {/* Error message if failed */}
      {session.error && (
        <div className="text-sm text-red-400 bg-red-500/10 p-2 rounded">
          <span className="font-semibold">Error:</span> {session.error}
        </div>
      )}

      {/* Mini-terminal for output */}
      <MiniTerminal output={session.output} />
    </Card>
  );
}

/**
 * SessionPanel Component
 *
 * Main component for displaying active sessions.
 */
export function SessionPanel() {
  const { sessions, stopSession } = useSession();

  // Empty state when no sessions
  if (sessions.length === 0) {
    return (
      <div
        data-testid="session-panel"
        className={cn(
          'session-panel',
          'flex items-center justify-center',
          'min-h-[400px]',
          'border border-dashed border-white/20 rounded-lg',
          'bg-white/5'
        )}
      >
        <div className="text-center text-gray-400">
          <p className="text-lg">No active sessions</p>
          <p className="text-sm">Start a SPEC execution to see sessions here</p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="session-panel" className="session-panel w-full">
      {/* Responsive grid layout */}
      <div
        data-testid="session-grid"
        className={cn(
          'session-grid',
          'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
          'gap-4'
        )}
      >
        {sessions.map((session) => (
          <SessionCard
            key={session.id}
            session={session}
            onStop={stopSession}
          />
        ))}
      </div>
    </div>
  );
}
