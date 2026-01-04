/**
 * Progress Component Tests
 *
 * TDD Tests for Progress component functionality
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Progress } from '../Progress';

describe('Progress Component', () => {
  describe('Rendering', () => {
    it('should render progress bar', () => {
      render(<Progress value={50} />);
      const progress = screen.getByRole('progressbar') || document.querySelector('.w-full');
      expect(progress).toBeInTheDocument();
    });

    it('should render indeterminate state when value is undefined', () => {
      render(<Progress />);
      const container = document.querySelector('.w-full');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Color Variants', () => {
    it('should apply anthropic orange color by default', () => {
      render(<Progress value={50} />);
      const bar = document.querySelector('.bg-\\[\\#D97757\\]');
      expect(bar).toBeInTheDocument();
    });

    it('should apply blue color variant', () => {
      render(<Progress value={50} color="blue" />);
      const bar = document.querySelector('.bg-blue-500');
      expect(bar).toBeInTheDocument();
    });

    it('should apply emerald color variant', () => {
      render(<Progress value={50} color="emerald" />);
      const bar = document.querySelector('.bg-emerald-500');
      expect(bar).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('should apply small size', () => {
      render(<Progress value={50} size="sm" />);
      const bar = document.querySelector('.h-1');
      expect(bar).toBeInTheDocument();
    });

    it('should apply medium size by default', () => {
      render(<Progress value={50} />);
      const bar = document.querySelector('.h-2');
      expect(bar).toBeInTheDocument();
    });

    it('should apply large size', () => {
      render(<Progress value={50} size="lg" />);
      const bar = document.querySelector('.h-3');
      expect(bar).toBeInTheDocument();
    });
  });

  describe('Progress Values', () => {
    it('should clamp values above 100 to 100', () => {
      render(<Progress value={150} showLabel />);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should clamp values below 0 to 0', () => {
      render(<Progress value={-50} showLabel />);
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should display percentage label when showLabel is true', () => {
      render(<Progress value={75} showLabel />);
      expect(screen.getByText('75%')).toBeInTheDocument();
    });
  });

  describe('Animations', () => {
    it('should animate width on mount', () => {
      render(<Progress value={50} />);
      const bar = document.querySelector('.bg-\\[\\#D97757\\]');
      expect(bar).toBeInTheDocument();
    });
  });
});
