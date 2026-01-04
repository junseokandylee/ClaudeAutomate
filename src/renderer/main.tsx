/**
 * React Entry Point
 *
 * REQ-002: React Entry Point
 * - Import React and ReactDOM (React 18)
 * - Import i18n configuration
 * - Import global CSS
 * - Render App component to root element
 * - Use React.StrictMode
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './i18n'; // Initialize i18n
import './index.css'; // Import global styles

/**
 * Get the root DOM element
 */
const container = document.getElementById('root');

if (!container) {
  throw new Error('Failed to find the root element');
}

/**
 * Create React root and render the App
 */
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
