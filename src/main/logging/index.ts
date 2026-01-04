/**
 * Main logging module exports
 * SPEC-LOGGING-001: Logging and Diagnostics
 */

// Core components
export { LogLevel, LogLevels } from './log-levels';
export { LoggerService } from './logger.service';

// Transports
export { FileTransport, type FileTransportConfig } from './file-transport';
export { ConsoleTransport, type ConsoleTransportConfig } from './console-transport';

// Services
export { DiagnosticService, type DiagnosticServiceConfig } from './diagnostic.service';
export { DebugMode, type DebugModeConfig } from './debug-mode';

// Types
export type { LogEntry } from './file-transport';
