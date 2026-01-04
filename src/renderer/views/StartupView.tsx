/**
 * StartupView Component
 *
 * TAG-FUNC-004: StartupView Component Implementation
 *
 * REQ-001: StartupView Component
 * - Displays application logo and title
 * - Shows version number
 * - Contains DependencyCheck component
 * - Animates on initial render
 * - Transitions to MainView when bootstrap passes
 *
 * This is the initial view shown when the application starts.
 * It checks dependencies and guides users through any missing installations.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DependencyCheck } from '../components/DependencyCheck';
import type { BootstrapCheckResult } from '@shared/types';

export interface StartupViewProps {
  /** Callback when bootstrap check passes (all dependencies installed) */
  onComplete: () => void;
}

/**
 * StartupView Component
 *
 * Displays the startup screen with dependency checking.
 * Automatically transitions to main view when all dependencies are verified.
 *
 * @example
 * ```tsx
 * <StartupView
 *   onComplete={() => navigateToMainView()}
 * />
 * ```
 */
export const StartupView: React.FC<StartupViewProps> = ({ onComplete }) => {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<BootstrapCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get app version from package.json
  const appVersion = '2.5.0'; // This should be imported from package.json

  useEffect(() => {
    checkDependencies();
  }, []);

  /**
   * Check dependencies via IPC
   */
  const checkDependencies = async () => {
    try {
      setLoading(true);
      setError(null);

      const bootstrapResult = await window.electronAPI.checkDependencies();
      setResult(bootstrapResult);

      // Check if all dependencies are installed
      const allInstalled =
        bootstrapResult.claude.installed &&
        bootstrapResult.moaiAdk.installed &&
        bootstrapResult.moaiWorktree.installed;

      if (allInstalled) {
        // Wait a moment to show success state before transitioning
        setTimeout(() => {
          onComplete();
        }, 1500);
      }
    } catch (err) {
      console.error('Bootstrap check failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle retry button click
   */
  const handleRetry = () => {
    checkDependencies();
  };

  return (
    <motion.div
      data-testid="startup-view"
      className="min-h-screen bg-gradient-to-br from-background to-secondary flex items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="w-full max-w-4xl"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <motion.div
            className="mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            {/* Logo */}
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-[#D97757] to-[#c96a4f] rounded-2xl flex items-center justify-center shadow-xl">
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
          </motion.div>

          <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-[#D97757] to-[#c96a4f]">
            ClaudeParallelRunner
          </h1>

          <p className="text-sm text-muted-foreground">
            Version {appVersion}
          </p>
        </div>

        {/* Error State */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            >
              <p className="text-sm text-red-700 dark:text-red-300">
                Error checking dependencies: {error}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dependency Check Component */}
        <DependencyCheck
          result={result}
          loading={loading}
          onRetry={handleRetry}
        />
      </motion.div>
    </motion.div>
  );
};
