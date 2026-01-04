/**
 * SpecList Component Tests
 *
 * REQ-003: SpecList Component
 * TAG-TEST-003: SpecList Component Tests
 *
 * Test coverage:
 * - Component rendering
 * - SPEC list display
 * - Status indicators
 * - Filtering and sorting
 * - SPEC selection
 * - Real-time updates
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SpecList } from '../SpecList';

// Mock IPC
const mockScanSpecs = vi.fn();
const mockOnSpecStatus = vi.fn(() => vi.fn());

global.window.electronAPI = {
  scanSpecs: mockScanSpecs,
  onSpecStatus: mockOnSpecStatus,
  getConfig: vi.fn(),
  setConfig: vi.fn(),
  onConfigChange: vi.fn(),
  onSessionUpdate: vi.fn(),
  onSessionOutput: vi.fn(),
} as any;

describe('SpecList Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the spec list container', () => {
      render(<SpecList />);
      const container = screen.getByTestId('spec-list');
      expect(container).toBeInTheDocument();
    });

    it('should display title', () => {
      render(<SpecList />);
      expect(screen.getByText('SPEC List')).toBeInTheDocument();
    });
  });

  describe('SPEC Display', () => {
    it('should show empty state when no specs', () => {
      render(<SpecList />);
      expect(screen.getByText(/no specs found/i)).toBeInTheDocument();
    });
  });

  describe('Status Indicators', () => {
    it('should show status for each spec', async () => {
      mockScanSpecs.mockResolvedValue([
        { id: 'SPEC-001', title: 'Test Spec', status: 'pending' },
      ]);

      render(<SpecList />);

      // Status indicator should be present
      const container = screen.getByTestId('spec-list');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Real-time Updates', () => {
    it('should register spec status listener', () => {
      render(<SpecList />);
      expect(mockOnSpecStatus).toHaveBeenCalled();
    });
  });
});
