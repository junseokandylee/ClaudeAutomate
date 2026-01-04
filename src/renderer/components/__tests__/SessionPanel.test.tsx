/**
 * SessionPanel Component Tests
 *
 * REQ-003: Session Panel Component
 * TAG-TEST-003: SessionPanel Test Suite
 *
 * Test coverage:
 * - Display active session cards in responsive grid
 * - Show session output in mini-terminal view
 * - Provide stop button per session
 * - Indicate session status visually
 * - Show session ID and SPEC name
 * - Auto-scroll to bottom on new output
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionPanel } from '../SessionPanel';
import { useSession } from '@/renderer/hooks/useSession';
import type { SessionInfo } from '@/shared/types';

// Mock dependencies
vi.mock('@/renderer/hooks/useSession');
vi.mock('../Terminal', () => ({
  Terminal: ({ output }: { output: string }) => (
    <div data-testid="mini-terminal" data-output={output}>
      {output || 'Terminal output'}
    </div>
  ),
}));

const mockUseSession = useSession as vi.MockedFunction<typeof useSession>;

describe('SessionPanel', () => {
  const mockStopSession = vi.fn();
  const mockSessions: SessionInfo[] = [
    {
      id: 'session-1',
      specId: 'SPEC-001',
      status: 'running',
      worktreePath: '/worktrees/SPEC-001',
      startedAt: '2025-01-04T10:00:00Z',
      output: 'Starting SPEC-001 execution...\n',
      error: null,
    },
    {
      id: 'session-2',
      specId: 'SPEC-002',
      status: 'pending',
      worktreePath: '/worktrees/SPEC-002',
      startedAt: '2025-01-04T10:01:00Z',
      output: '',
      error: null,
    },
    {
      id: 'session-3',
      specId: 'SPEC-003',
      status: 'completed',
      worktreePath: '/worktrees/SPEC-003',
      startedAt: '2025-01-04T09:00:00Z',
      completedAt: '2025-01-04T09:30:00Z',
      output: 'SPEC-003 completed successfully!\n',
      error: null,
    },
    {
      id: 'session-4',
      specId: 'SPEC-004',
      status: 'failed',
      worktreePath: '/worktrees/SPEC-004',
      startedAt: '2025-01-04T09:15:00Z',
      completedAt: '2025-01-04T09:20:00Z',
      output: 'Error during execution...\n',
      error: 'Test execution failed',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSession.mockReturnValue({
      sessions: mockSessions,
      isExecuting: true,
      executionPlan: null,
      startExecution: vi.fn(),
      stopExecution: vi.fn(),
      stopSession: mockStopSession,
      retrySession: vi.fn(),
    });
  });

  describe('REQ-003.1: Display active session cards in responsive grid', () => {
    it('should render session cards for all active sessions', () => {
      render(<SessionPanel />);

      expect(screen.getByTestId('session-panel')).toBeInTheDocument();
      expect(screen.getAllByTestId(/session-card-/)).toHaveLength(4);
    });

    it('should display empty state when no sessions exist', () => {
      mockUseSession.mockReturnValue({
        sessions: [],
        isExecuting: false,
        executionPlan: null,
        startExecution: vi.fn(),
        stopExecution: vi.fn(),
        stopSession: mockStopSession,
        retrySession: vi.fn(),
      });

      render(<SessionPanel />);

      expect(screen.getByTestId('session-panel')).toBeInTheDocument();
      expect(screen.getByText(/no active sessions/i)).toBeInTheDocument();
      expect(screen.queryAllByTestId(/session-card-/)).toHaveLength(0);
    });

    it('should use responsive grid layout', () => {
      const { container } = render(<SessionPanel />);

      const gridContainer = container.querySelector('[data-testid="session-grid"]');
      expect(gridContainer).toBeInTheDocument();
      expect(gridContainer).toHaveClass('grid');
    });
  });

  describe('REQ-003.2: Show session output in mini-terminal view', () => {
    it('should display mini-terminal for each session', () => {
      render(<SessionPanel />);

      const terminals = screen.getAllByTestId('mini-terminal');
      expect(terminals).toHaveLength(4);
    });

    it('should display session output in terminal', () => {
      render(<SessionPanel />);

      const session1Card = screen.getByTestId('session-card-session-1');
      const terminal = session1Card.querySelector('[data-testid="mini-terminal"]');

      expect(terminal).toBeInTheDocument();
      expect(terminal).toHaveAttribute('data-output', 'Starting SPEC-001 execution...\n');
    });

    it('should show placeholder for sessions without output', () => {
      render(<SessionPanel />);

      const session2Card = screen.getByTestId('session-card-session-2');
      const terminal = session2Card.querySelector('[data-testid="mini-terminal"]');

      expect(terminal).toBeInTheDocument();
      expect(terminal).toHaveTextContent('Terminal output');
    });
  });

  describe('REQ-003.3: Provide stop button per session', () => {
    it('should display stop button for each session', () => {
      render(<SessionPanel />);

      const stopButtons = screen.getAllByRole('button', { name: /stop/i });
      expect(stopButtons.length).toBeGreaterThan(0);
    });

    it('should call stopSession when stop button is clicked', async () => {
      const user = userEvent.setup();
      render(<SessionPanel />);

      const stopButton = screen.getAllByRole('button', { name: /stop/i })[0];
      await user.click(stopButton);

      expect(mockStopSession).toHaveBeenCalledTimes(1);
      expect(mockStopSession).toHaveBeenCalledWith('session-1');
    });

    it('should disable stop button for completed sessions', () => {
      render(<SessionPanel />);

      const completedSessionCard = screen.getByTestId('session-card-session-3');
      const stopButton = completedSessionCard.querySelector('button[aria-label*="stop"]');

      expect(stopButton).toBeDisabled();
    });

    it('should disable stop button for failed sessions', () => {
      render(<SessionPanel />);

      const failedSessionCard = screen.getByTestId('session-card-session-4');
      const stopButton = failedSessionCard.querySelector('button[aria-label*="stop"]');

      expect(stopButton).toBeDisabled();
    });
  });

  describe('REQ-003.4: Indicate session status visually', () => {
    it('should apply gray styling for pending status', () => {
      render(<SessionPanel />);

      const pendingCard = screen.getByTestId('session-card-session-2');
      expect(pendingCard).toHaveClass('border-gray-500');
    });

    it('should apply blue styling for running status', () => {
      render(<SessionPanel />);

      const runningCard = screen.getByTestId('session-card-session-1');
      expect(runningCard).toHaveClass('border-blue-500');
    });

    it('should apply green styling for completed status', () => {
      render(<SessionPanel />);

      const completedCard = screen.getByTestId('session-card-session-3');
      expect(completedCard).toHaveClass('border-green-500');
    });

    it('should apply red styling for failed status', () => {
      render(<SessionPanel />);

      const failedCard = screen.getByTestId('session-card-session-4');
      expect(failedCard).toHaveClass('border-red-500');
    });

    it('should display status badge for each session', () => {
      render(<SessionPanel />);

      expect(screen.getByText('running')).toBeInTheDocument();
      expect(screen.getByText('pending')).toBeInTheDocument();
      expect(screen.getByText('completed')).toBeInTheDocument();
      expect(screen.getByText('failed')).toBeInTheDocument();
    });
  });

  describe('REQ-003.5: Show session ID and SPEC name', () => {
    it('should display session ID on card', () => {
      render(<SessionPanel />);

      const card1 = screen.getByTestId('session-card-session-1');
      expect(card1.textContent).toContain('session-1');
      expect(card1.textContent).toContain('SPEC-001');
    });

    it('should display SPEC name prominently', () => {
      render(<SessionPanel />);

      const specNames = screen.getAllByText(/SPEC-\d+/);
      expect(specNames.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('REQ-003.6: Auto-scroll to bottom on new output', () => {
    it('should scroll terminal to bottom when output updates', async () => {
      const { rerender } = render(<SessionPanel />);

      const session1Card = screen.getByTestId('session-card-session-1');
      const terminal = session1Card.querySelector('[data-testid="mini-terminal"]') as HTMLElement;

      // Verify initial output
      expect(terminal).toHaveAttribute('data-output', 'Starting SPEC-001 execution...\n');

      // Simulate output update
      const updatedSession: SessionInfo = {
        ...mockSessions[0],
        output: 'Starting SPEC-001 execution...\nNew line of output\n',
      };

      mockUseSession.mockReturnValue({
        sessions: [updatedSession, ...mockSessions.slice(1)],
        isExecuting: true,
        executionPlan: null,
        startExecution: vi.fn(),
        stopExecution: vi.fn(),
        stopSession: mockStopSession,
        retrySession: vi.fn(),
      });

      // Re-render with updated output
      rerender(<SessionPanel />);

      await waitFor(() => {
        const updatedTerminal = screen.getByTestId('session-card-session-1').querySelector('[data-testid="mini-terminal"]') as HTMLElement;
        expect(updatedTerminal).toHaveAttribute('data-output', 'Starting SPEC-001 execution...\nNew line of output\n');
      });
    });

    it('should have scrollHeight set for auto-scroll functionality', () => {
      render(<SessionPanel />);

      const session1Card = screen.getByTestId('session-card-session-1');
      const terminal = session1Card.querySelector('[data-testid="mini-terminal"]') as HTMLElement;

      // Terminal should have overflow-y-auto for scrolling
      expect(terminal).toHaveClass('overflow-y-auto');
    });
  });

  describe('Edge Cases', () => {
    it('should handle sessions with very long output', () => {
      const longOutput = 'A'.repeat(10000);
      const longOutputSession: SessionInfo = {
        ...mockSessions[0],
        output: longOutput,
      };

      mockUseSession.mockReturnValue({
        sessions: [longOutputSession],
        isExecuting: true,
        executionPlan: null,
        startExecution: vi.fn(),
        stopExecution: vi.fn(),
        stopSession: mockStopSession,
        retrySession: vi.fn(),
      });

      render(<SessionPanel />);

      const terminal = screen.getByTestId('mini-terminal');
      expect(terminal).toBeInTheDocument();
      expect(terminal).toHaveAttribute('data-output', longOutput);
    });

    it('should handle concurrent sessions efficiently', () => {
      const manySessions = Array.from({ length: 20 }, (_, i) => ({
        id: `session-${i}`,
        specId: `SPEC-${i.toString().padStart(3, '0')}`,
        status: 'running' as const,
        worktreePath: `/worktrees/SPEC-${i}`,
        startedAt: '2025-01-04T10:00:00Z',
        output: `Output for session ${i}\n`,
        error: null,
      }));

      mockUseSession.mockReturnValue({
        sessions: manySessions,
        isExecuting: true,
        executionPlan: null,
        startExecution: vi.fn(),
        stopExecution: vi.fn(),
        stopSession: mockStopSession,
        retrySession: vi.fn(),
      });

      render(<SessionPanel />);

      expect(screen.getAllByTestId(/session-card-/)).toHaveLength(20);
    });
  });
});
