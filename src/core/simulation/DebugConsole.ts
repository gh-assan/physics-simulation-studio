/**
 * Debug Console - Phase 5
 *
 * Real-time debugging and inspection interface for simulation development.
 * Provides command execution, state monitoring, and interactive debugging.
 */

import { ISimulationState, EntityId } from './interfaces';

export interface IDebugCommand {
  name: string;
  description: string;
  usage: string;
  handler: (args: string[], context: IDebugContext) => Promise<string> | string;
}

export interface IDebugContext {
  simulationState?: ISimulationState;
  entityId?: EntityId;
  metadata: Map<string, any>;
}

export interface ILogEntry {
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error';
  source: string;
  message: string;
  data?: any;
}

export interface IDebugConsoleConfig {
  maxLogEntries?: number;
  enableCommandHistory?: boolean;
  maxCommandHistory?: number;
  autoScrollLogs?: boolean;
}

/**
 * Debug Console
 *
 * Interactive debugging interface for real-time simulation inspection.
 * Provides command execution, logging, and state monitoring capabilities.
 */
export class DebugConsole {
  private readonly config: Required<IDebugConsoleConfig>;
  private commands: Map<string, IDebugCommand> = new Map();
  private logEntries: ILogEntry[] = [];
  private commandHistory: string[] = [];
  private context: IDebugContext;

  // Event handlers
  private onLogCallbacks: ((entry: ILogEntry) => void)[] = [];
  private onCommandCallbacks: ((command: string, result: string) => void)[] = [];

  constructor(config: IDebugConsoleConfig = {}) {
    this.config = {
      maxLogEntries: config.maxLogEntries ?? 1000,
      enableCommandHistory: config.enableCommandHistory ?? true,
      maxCommandHistory: config.maxCommandHistory ?? 50,
      autoScrollLogs: config.autoScrollLogs ?? true
    };

    this.context = {
      metadata: new Map()
    };

    this.initializeBuiltinCommands();

    console.log('[DebugConsole] Console initialized with config:', this.config);
  }

  /**
   * Execute a debug command
   */
  async executeCommand(commandLine: string): Promise<string> {
    const trimmed = commandLine.trim();
    if (!trimmed) return '';

    // Add to history
    if (this.config.enableCommandHistory) {
      this.commandHistory.push(trimmed);
      if (this.commandHistory.length > this.config.maxCommandHistory) {
        this.commandHistory.shift();
      }
    }

    // Parse command and arguments
    const parts = this.parseCommandLine(trimmed);
    const commandName = parts[0].toLowerCase();
    const args = parts.slice(1);

    try {
      const command = this.commands.get(commandName);
      if (!command) {
        return `Unknown command: ${commandName}. Type 'help' for available commands.`;
      }

      const result = await command.handler(args, this.context);

      // Notify callbacks
      this.onCommandCallbacks.forEach(callback => {
        callback(commandLine, result);
      });

      this.log('debug', 'Console', `Command executed: ${commandLine}`, { result });

      return result;
    } catch (error) {
      const errorMessage = `Error executing command '${commandName}': ${
        error instanceof Error ? error.message : error
      }`;

      this.log('error', 'Console', errorMessage);
      return errorMessage;
    }
  }

  /**
   * Register a custom debug command
   */
  registerCommand(command: IDebugCommand): void {
    this.commands.set(command.name.toLowerCase(), command);
    this.log('debug', 'Console', `Command registered: ${command.name}`);
  }

  /**
   * Unregister a debug command
   */
  unregisterCommand(commandName: string): boolean {
    const removed = this.commands.delete(commandName.toLowerCase());
    if (removed) {
      this.log('debug', 'Console', `Command unregistered: ${commandName}`);
    }
    return removed;
  }

  /**
   * Log a message to the console
   */
  log(level: ILogEntry['level'], source: string, message: string, data?: any): void {
    const entry: ILogEntry = {
      timestamp: performance.now(),
      level,
      source,
      message,
      data
    };

    this.logEntries.push(entry);

    // Limit log history
    if (this.logEntries.length > this.config.maxLogEntries) {
      this.logEntries.shift();
    }

    // Notify callbacks
    this.onLogCallbacks.forEach(callback => {
      callback(entry);
    });

    // Also log to browser console
    const consoleMethod = console[level] || console.log;
    consoleMethod(`[${source}] ${message}`, data || '');
  }

  /**
   * Update simulation context
   */
  updateContext(state: ISimulationState): void {
    this.context.simulationState = state;
  }

  /**
   * Set entity context for debugging
   */
  setEntityContext(entityId: EntityId): void {
    this.context.entityId = entityId;
    this.log('debug', 'Console', `Entity context set to: ${entityId}`);
  }

  /**
   * Clear entity context
   */
  clearEntityContext(): void {
    this.context.entityId = undefined;
    this.log('debug', 'Console', 'Entity context cleared');
  }

  /**
   * Get current context
   */
  getContext(): Readonly<IDebugContext> {
    return { ...this.context };
  }

  /**
   * Get log entries
   */
  getLogs(level?: ILogEntry['level'], source?: string, count?: number): readonly ILogEntry[] {
    let filtered = this.logEntries;

    if (level) {
      filtered = filtered.filter(entry => entry.level === level);
    }

    if (source) {
      filtered = filtered.filter(entry => entry.source === source);
    }

    if (count) {
      filtered = filtered.slice(-count);
    }

    return filtered;
  }

  /**
   * Get command history
   */
  getCommandHistory(): readonly string[] {
    return [...this.commandHistory];
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logEntries = [];
    this.log('debug', 'Console', 'Logs cleared');
  }

  /**
   * Clear command history
   */
  clearCommandHistory(): void {
    this.commandHistory = [];
    this.log('debug', 'Console', 'Command history cleared');
  }

  /**
   * Subscribe to log events
   */
  onLog(callback: (entry: ILogEntry) => void): () => void {
    this.onLogCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.onLogCallbacks.indexOf(callback);
      if (index >= 0) {
        this.onLogCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to command events
   */
  onCommand(callback: (command: string, result: string) => void): () => void {
    this.onCommandCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.onCommandCallbacks.indexOf(callback);
      if (index >= 0) {
        this.onCommandCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Generate debug report
   */
  generateReport(): string {
    const errorCount = this.logEntries.filter(e => e.level === 'error').length;
    const warnCount = this.logEntries.filter(e => e.level === 'warn').length;
    const recentLogs = this.logEntries.slice(-10);

    const report = [
      '=== Debug Console Report ===',
      `Total Log Entries: ${this.logEntries.length}`,
      `Errors: ${errorCount}`,
      `Warnings: ${warnCount}`,
      `Commands Executed: ${this.commandHistory.length}`,
      `Current Entity Context: ${this.context.entityId ?? 'None'}`,
      '',
      '=== Recent Logs ===',
      ...recentLogs.map(log =>
        `${log.timestamp.toFixed(2)}ms [${log.level.toUpperCase()}] ${log.source}: ${log.message}`
      ),
      '',
      '=== Recent Commands ===',
      ...this.commandHistory.slice(-5).map((cmd, i) => `${i + 1}. ${cmd}`)
    ].join('\n');

    return report;
  }

  /**
   * Initialize built-in debug commands
   */
  private initializeBuiltinCommands(): void {
    // Help command
    this.registerCommand({
      name: 'help',
      description: 'Show available commands',
      usage: 'help [command]',
      handler: (args) => {
        if (args.length > 0) {
          const command = this.commands.get(args[0].toLowerCase());
          if (command) {
            return `${command.name}: ${command.description}\nUsage: ${command.usage}`;
          } else {
            return `Unknown command: ${args[0]}`;
          }
        }

        const commandList = Array.from(this.commands.values())
          .map(cmd => `  ${cmd.name.padEnd(15)} - ${cmd.description}`)
          .join('\n');

        return `Available commands:\n${commandList}\n\nType 'help <command>' for detailed usage.`;
      }
    });

    // Clear command
    this.registerCommand({
      name: 'clear',
      description: 'Clear logs or command history',
      usage: 'clear [logs|history|all]',
      handler: (args) => {
        const target = args[0]?.toLowerCase() || 'logs';

        switch (target) {
          case 'logs':
            this.clearLogs();
            return 'Logs cleared';
          case 'history':
            this.clearCommandHistory();
            return 'Command history cleared';
          case 'all':
            this.clearLogs();
            this.clearCommandHistory();
            return 'Logs and command history cleared';
          default:
            return 'Usage: clear [logs|history|all]';
        }
      }
    });

    // State command
    this.registerCommand({
      name: 'state',
      description: 'Show simulation state information',
      usage: 'state [entities|metadata|time]',
      handler: (args, context) => {
        if (!context.simulationState) {
          return 'No simulation state available';
        }

        const state = context.simulationState;
        const target = args[0]?.toLowerCase() || 'summary';

        switch (target) {
          case 'entities':
            return `Entities (${state.entities.size}): [${state.getEntityArray().join(', ')}]`;
          case 'metadata': {
            const metadataEntries = Array.from(state.metadata.entries())
              .map(([key, value]) => `  ${key}: ${JSON.stringify(value)}`)
              .join('\n');
            return `Metadata:\n${metadataEntries}`;
          }
          case 'time':
            return `Time: ${state.time.toFixed(3)}s, Delta: ${state.deltaTime.toFixed(3)}s, Running: ${state.isRunning}`;
          default:
            return [
              `State Summary:`,
              `  Time: ${state.time.toFixed(3)}s (Δ${state.deltaTime.toFixed(3)}s)`,
              `  Entities: ${state.entities.size}`,
              `  Metadata: ${state.metadata.size} keys`,
              `  Running: ${state.isRunning}`
            ].join('\n');
        }
      }
    });

    // Entity command
    this.registerCommand({
      name: 'entity',
      description: 'Set or show entity context',
      usage: 'entity [id]',
      handler: (args, context) => {
        if (args.length === 0) {
          return `Current entity context: ${context.entityId ?? 'None'}`;
        }

        const entityId = parseInt(args[0]);
        if (isNaN(entityId)) {
          return 'Invalid entity ID';
        }

        if (context.simulationState && !context.simulationState.hasEntity(entityId)) {
          return `Entity ${entityId} not found in simulation`;
        }

        this.setEntityContext(entityId);
        return `Entity context set to: ${entityId}`;
      }
    });

    // Logs command
    this.registerCommand({
      name: 'logs',
      description: 'Show log entries',
      usage: 'logs [level] [source] [count]',
      handler: (args) => {
        const level = args[0] as ILogEntry['level'] | undefined;
        const source = args[1];
        const count = args[2] ? parseInt(args[2]) : 10;

        const logs = this.getLogs(level, source, count);

        if (logs.length === 0) {
          return 'No log entries found';
        }

        return logs
          .map(log =>
            `${log.timestamp.toFixed(2)}ms [${log.level.toUpperCase()}] ${log.source}: ${log.message}`
          )
          .join('\n');
      }
    });

    // Report command
    this.registerCommand({
      name: 'report',
      description: 'Generate debug report',
      usage: 'report',
      handler: () => {
        return this.generateReport();
      }
    });
  }

  /**
   * Parse command line into command and arguments
   */
  private parseCommandLine(commandLine: string): string[] {
    // Simple parsing - splits on spaces, respects quotes
    const parts: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < commandLine.length; i++) {
      const char = commandLine[i];

      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        quoteChar = '';
      } else if (char === ' ' && !inQuotes) {
        if (current) {
          parts.push(current);
          current = '';
        }
      } else {
        current += char;
      }
    }

    if (current) {
      parts.push(current);
    }

    return parts;
  }
}
