/**
 * Root App Component
 *
 * REQ-003: Root App Component
 * - Main application routing
 * - Provide Zustand store context
 * - Handle startup vs main view switching
 * - Apply global layout styles
 */

import React from 'react';

/**
 * Main application component
 *
 * Serves as the root component for the entire application.
 * Handles view switching and provides global context.
 */
const App: React.FC = () => {
  return (
    <div className="app-container">
      <h1>ClaudeParallelRunner</h1>
    </div>
  );
};

export default App;
