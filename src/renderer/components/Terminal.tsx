/**
 * Terminal Component
 *
 * REQ-002: Terminal Component
 * TAG-DESIGN-002: Terminal Component Design
 * TAG-FUNC-002: Terminal Implementation
 *
 * Embeds xterm.js terminal emulator for Claude Code CLI interaction.
 * Features:
 * - xterm.js with fit addon for auto-resize
 * - Custom Anthropic-themed colors
 * - IPC communication for session output
 * - Responsive to container size changes
 *
 * @example
 * ```tsx
 * function MainView() {
 *   return <Terminal />;
 * }
 * ```
 */

import { useEffect, useRef } from 'react';
import { Terminal as XTerminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { cn } from '@/shared/lib/utils';

/**
 * Terminal Component
 */
export function Terminal() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm.js terminal
    const xterm = new XTerminal({
      theme: {
        // Anthropic-inspired theme colors
        background: '#1a1a1a',
        foreground: '#e0e0e0',
        cursor: '#D97757', // Anthropic orange
        black: '#1a1a1a',
        red: '#ff6b6b',
        green: '#51cf66',
        yellow: '#ffd93d',
        blue: '#339af0',
        magenta: '#cc5de8',
        cyan: '#22b8cf',
        white: '#e0e0e0',
        brightBlack: '#495057',
        brightRed: '#ff8787',
        brightGreen: '#69db7c',
        brightYellow: '#ffe066',
        brightBlue: '#4dabf7',
        brightMagenta: '#e599f7',
        brightCyan: '#66d9e8',
        brightWhite: '#ffffff',
      },
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: 14,
      lineHeight: 1.2,
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 1000,
      tabStopWidth: 4,
    });

    // Initialize fit addon
    const fitAddon = new FitAddon();
    xterm.loadAddon(fitAddon);

    // Open terminal in container
    xterm.open(terminalRef.current);
    fitAddon.fit();

    // Store refs
    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;

    // Welcome message
    xterm.write('\r\n\x1b[1;36mClaude Parallel Runner - Terminal\x1b[0m\r\n');
    xterm.write('Ready for SPEC execution...\r\n\r\n');

    // Register IPC listener for session output
    const cleanup = window.electronAPI.onSessionOutput((event, data) => {
      if (xtermRef.current && data.output) {
        xtermRef.current.write(data.output);
      }
    });

    // Handle window resize
    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup on unmount
    return () => {
      cleanup();
      window.removeEventListener('resize', handleResize);
      xterm.dispose();
    };
  }, []);

  return (
    <div
      data-testid="terminal-container"
      className={cn(
        'terminal-container',
        'rounded-lg border border-white/20',
        'bg-black/40 backdrop-blur-lg',
        'overflow-hidden',
        'h-full min-h-[400px]'
      )}
    >
      <div
        ref={terminalRef}
        className="w-full h-full"
        style={{ padding: '8px' }}
      />
    </div>
  );
}
