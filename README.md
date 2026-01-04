# ClaudeParallelRunner (CPR)

A cross-platform Electron desktop application for parallel SPEC implementation using Claude Code CLI.

## Overview

ClaudeParallelRunner enables developers to execute multiple Claude Code sessions simultaneously, dramatically accelerating development workflows by running parallel SPEC implementations.

## Features

- **Parallel Execution**: Run multiple Claude Code CLI sessions concurrently
- **Real-time Terminal**: Integrated xterm.js terminals with WebGL acceleration
- **Project Management**: Manage multiple projects and SPECs from a unified interface
- **Git Integration**: Built-in Git support via simple-git for version control operations
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Internationalization**: Multi-language support via i18next
- **Modern UI**: Glassmorphism design with Tailwind CSS and Framer Motion animations
- **Persistent Storage**: Electron-store for secure local configuration

## Tech Stack

- **Runtime**: Electron 28+
- **Language**: TypeScript 5.x
- **UI Framework**: React 18
- **Styling**: Tailwind CSS 3.4
- **Terminal**: xterm.js with WebGL addon
- **State Management**: Zustand 4.4
- **Build Tool**: electron-vite 2.0
- **Testing**: Vitest with React Testing Library

## Installation

### Prerequisites

- Node.js 20.x or higher
- npm 10.x or higher
- Claude Code CLI installed and configured

### Setup

```bash
# Clone the repository
git clone https://github.com/your-org/claude-parallel-runner.git
cd claude-parallel-runner

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Edit .env with your settings
# Add your ANTHROPIC_API_KEY if required
```

## Development

```bash
# Start development server with hot reload
npm run dev

# Run type checking
npm run typecheck

# Run linting
npm run lint

# Run tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Building

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
claude-parallel-runner/
├── src/
│   ├── main/           # Electron main process
│   │   └── index.ts    # Main entry point
│   ├── preload/        # Preload scripts
│   │   └── index.ts    # Context bridge
│   └── renderer/       # React application
│       ├── index.html  # HTML entry
│       ├── index.tsx   # React entry
│       ├── components/ # UI components
│       ├── hooks/      # Custom React hooks
│       ├── stores/     # Zustand stores
│       └── styles/     # CSS/Tailwind styles
├── electron.vite.config.ts  # Vite configuration
├── tailwind.config.js       # Tailwind configuration
├── tsconfig.json            # Base TypeScript config
├── tsconfig.node.json       # Node.js TypeScript config
├── tsconfig.web.json        # Web TypeScript config
└── package.json             # Project manifest
```

## Architecture

### Main Process

The Electron main process handles:
- Window management
- IPC communication
- File system operations
- Claude CLI process spawning
- System-level operations

### Preload Scripts

Secure bridge between main and renderer:
- Exposes safe APIs to renderer
- Handles IPC message passing
- Maintains security isolation

### Renderer Process

React-based UI with:
- Terminal components (xterm.js)
- Project/SPEC management views
- Real-time output streaming
- State management via Zustand

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude | - |
| `NODE_ENV` | Environment mode | development |
| `DEBUG_MODE` | Enable verbose logging | false |

### Application Settings

Settings are stored using electron-store in the user's application data directory.

## License

MIT License

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

---

Built with Claude Code
