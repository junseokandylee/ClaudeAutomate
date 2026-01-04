/**
 * AppStore Tests
 *
 * TDD RED Phase: Failing tests for AppStore functionality
 * Testing: bootstrap status tracking, view management, UI state
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { appStore, useAppStore } from '../appStore';

describe('AppStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state before each test
    appStore.setState({
      currentView: 'startup',
      isBootstrapComplete: false,
      dialogs: {
        settings: false,
        confirm: false,
        error: false,
      },
      errorState: null,
    });
  });

  describe('Initial State', () => {
    it('should have initial state', () => {
      const state = appStore.getState();

      expect(state.currentView).toBe('startup');
      expect(state.isBootstrapComplete).toBe(false);
      expect(state.dialogs.settings).toBe(false);
      expect(state.dialogs.confirm).toBe(false);
      expect(state.dialogs.error).toBe(false);
      expect(state.errorState).toBe(null);
    });
  });

  describe('View Management', () => {
    it('should set current view', () => {
      act(() => {
        appStore.getState().setCurrentView('main');
      });

      expect(appStore.getState().currentView).toBe('main');
    });

    it('should support startup view', () => {
      act(() => {
        appStore.getState().setCurrentView('startup');
      });

      expect(appStore.getState().currentView).toBe('startup');
    });

    it('should support main view', () => {
      act(() => {
        appStore.getState().setCurrentView('main');
      });

      expect(appStore.getState().currentView).toBe('main');
    });

    it('should provide view selector', () => {
      const { result } = renderHook(() => useAppStore(state => state.currentView));

      expect(result.current).toBe('startup');

      act(() => {
        appStore.getState().setCurrentView('main');
      });

      expect(result.current).toBe('main');
    });
  });

  describe('Bootstrap Status', () => {
    it('should track bootstrap completion', () => {
      act(() => {
        appStore.getState().setBootstrapComplete(true);
      });

      expect(appStore.getState().isBootstrapComplete).toBe(true);
    });

    it('should provide bootstrap selector', () => {
      const { result } = renderHook(() => useAppStore(state => state.isBootstrapComplete));

      expect(result.current).toBe(false);

      act(() => {
        appStore.getState().setBootstrapComplete(true);
      });

      expect(result.current).toBe(true);
    });

    it('should automatically switch to main view when bootstrap completes', () => {
      expect(appStore.getState().currentView).toBe('startup');

      act(() => {
        appStore.getState().setBootstrapComplete(true);
      });

      expect(appStore.getState().currentView).toBe('main');
    });
  });

  describe('Dialog State', () => {
    it('should open settings dialog', () => {
      act(() => {
        appStore.getState().openDialog('settings');
      });

      expect(appStore.getState().dialogs.settings).toBe(true);
    });

    it('should open confirm dialog', () => {
      act(() => {
        appStore.getState().openDialog('confirm');
      });

      expect(appStore.getState().dialogs.confirm).toBe(true);
    });

    it('should open error dialog', () => {
      act(() => {
        appStore.getState().openDialog('error');
      });

      expect(appStore.getState().dialogs.error).toBe(true);
    });

    it('should close settings dialog', () => {
      act(() => {
        appStore.getState().openDialog('settings');
      });
      expect(appStore.getState().dialogs.settings).toBe(true);

      act(() => {
        appStore.getState().closeDialog('settings');
      });

      expect(appStore.getState().dialogs.settings).toBe(false);
    });

    it('should close confirm dialog', () => {
      act(() => {
        appStore.getState().openDialog('confirm');
      });
      expect(appStore.getState().dialogs.confirm).toBe(true);

      act(() => {
        appStore.getState().closeDialog('confirm');
      });

      expect(appStore.getState().dialogs.confirm).toBe(false);
    });

    it('should close error dialog', () => {
      act(() => {
        appStore.getState().openDialog('error');
      });
      expect(appStore.getState().dialogs.error).toBe(true);

      act(() => {
        appStore.getState().closeDialog('error');
      });

      expect(appStore.getState().dialogs.error).toBe(false);
    });

    it('should provide dialog selector', () => {
      const { result } = renderHook(() => useAppStore(state => state.dialogs.settings));

      expect(result.current).toBe(false);

      act(() => {
        appStore.getState().openDialog('settings');
      });

      expect(result.current).toBe(true);
    });
  });

  describe('Error State', () => {
    it('should set error state', () => {
      const error = {
        title: 'Test Error',
        message: 'Something went wrong',
        details: 'Stack trace here',
      };

      act(() => {
        appStore.getState().setErrorState(error);
      });

      expect(appStore.getState().errorState).toEqual(error);
    });

    it('should clear error state', () => {
      const error = {
        title: 'Test Error',
        message: 'Something went wrong',
      };

      act(() => {
        appStore.getState().setErrorState(error);
      });
      expect(appStore.getState().errorState).not.toBeNull();

      act(() => {
        appStore.getState().clearErrorState();
      });

      expect(appStore.getState().errorState).toBe(null);
    });

    it('should automatically open error dialog when error is set', () => {
      expect(appStore.getState().dialogs.error).toBe(false);

      act(() => {
        appStore.getState().setErrorState({
          title: 'Error',
          message: 'Test',
        });
      });

      expect(appStore.getState().dialogs.error).toBe(true);
    });

    it('should provide error state selector', () => {
      const { result } = renderHook(() => useAppStore(state => state.errorState));

      expect(result.current).toBe(null);

      const error = { title: 'Test', message: 'Error' };
      act(() => {
        appStore.getState().setErrorState(error);
      });

      expect(result.current).toEqual(error);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset to initial state', () => {
      // Change state
      act(() => {
        appStore.getState().setCurrentView('main');
        appStore.getState().setBootstrapComplete(true);
        appStore.getState().openDialog('settings');
      });

      expect(appStore.getState().currentView).toBe('main');
      expect(appStore.getState().isBootstrapComplete).toBe(true);
      expect(appStore.getState().dialogs.settings).toBe(true);

      // Reset
      act(() => {
        appStore.getState().reset();
      });

      expect(appStore.getState().currentView).toBe('startup');
      expect(appStore.getState().isBootstrapComplete).toBe(false);
      expect(appStore.getState().dialogs.settings).toBe(false);
    });
  });

  describe('Reactive Updates', () => {
    it('should trigger re-render when view changes', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        appStore.getState().setCurrentView('main');
      });

      expect(result.current.currentView).toBe('main');
    });

    it('should trigger re-render when bootstrap status changes', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        appStore.getState().setBootstrapComplete(true);
      });

      expect(result.current.isBootstrapComplete).toBe(true);
    });

    it('should trigger re-render when dialog opens', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        appStore.getState().openDialog('confirm');
      });

      expect(result.current.dialogs.confirm).toBe(true);
    });
  });
});
