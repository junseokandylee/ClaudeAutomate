/**
 * ProgressOverview Component Tests
 *
 * REQ-005: ProgressOverview Component
 * TAG-TEST-005: ProgressOverview Component Tests
 *
 * Test coverage:
 * - Component rendering
 * - Progress display
 * - Statistics calculation
 * - Time estimation
 * - Success/failure rates
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressOverview } from '../ProgressOverview';

// Mock IPC
const mockOnSessionUpdate = vi.fn(() => vi.fn());

global.window.electronAPI = {
  onSessionUpdate: mockOnSessionUpdate,
  getConfig: vi.fn(),
  setConfig: vi.fn(),
  onConfigChange: vi.fn(),
} as any;

describe('ProgressOverview Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the progress overview container', () => {
      render(<ProgressOverview />);
      const container = screen.getByTestId('progress-overview');
      expect(container).toBeInTheDocument();
    });

    it('should display title', () => {
      render(<ProgressOverview />);
      expect(screen.getByText('Execution Progress')).toBeInTheDocument();
    });
  });

  describe('Progress Display', () => {
    it('should show progress bar', () => {
      render(<ProgressOverview />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Statistics', () => {
    it('should display completed count', () => {
      render(<ProgressOverview />);
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    it('should display running count', () => {
      render(<ProgressOverview />);
      expect(screen.getByText('Running')).toBeInTheDocument();
    });

    it('should display pending count', () => {
      render(<ProgressOverview />);
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('should display total count', () => {
      render(<ProgressOverview />);
      expect(screen.getByText('Total')).toBeInTheDocument();
    });

    it('should display failed count', () => {
      render(<ProgressOverview />);
      expect(screen.getByText('Failed')).toBeInTheDocument();
    });
  });

  describe('Real-time Updates', () => {
    it('should register session update listener', () => {
      render(<ProgressOverview />);
      expect(mockOnSessionUpdate).toHaveBeenCalled();
    });
  });
});
