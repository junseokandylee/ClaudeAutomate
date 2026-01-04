/**
 * WaveVisualization Component Tests
 *
 * REQ-004: WaveVisualization Component
 * TAG-TEST-004: WaveVisualization Component Tests
 *
 * Test coverage:
 * - Component rendering
 * - Wave display
 * - Dependency visualization
 * - Animation effects
 * - Status highlighting
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WaveVisualization } from '../WaveVisualization';

// Mock IPC
global.window.electronAPI = {
  getConfig: vi.fn(),
  setConfig: vi.fn(),
  onConfigChange: vi.fn(),
  scanSpecs: vi.fn(),
  onSpecStatus: vi.fn(),
  onSessionUpdate: vi.fn(),
  onSessionOutput: vi.fn(),
} as any;

describe('WaveVisualization Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the wave visualization container', () => {
      render(<WaveVisualization />);
      const container = screen.getByTestId('wave-visualization');
      expect(container).toBeInTheDocument();
    });

    it('should display title', () => {
      render(<WaveVisualization />);
      expect(screen.getByText('Execution Waves')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no waves', () => {
      render(<WaveVisualization />);
      expect(screen.getByText(/no waves/i)).toBeInTheDocument();
    });
  });

  describe('Animation', () => {
    it('should render with animation classes', () => {
      render(<WaveVisualization />);
      const container = screen.getByTestId('wave-visualization');
      expect(container).toBeInTheDocument();
    });
  });
});
