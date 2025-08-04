import { ILogger } from "./ILogger";

export class Logger implements ILogger {
  private static instance: Logger;
  private enabled = false; // Instance-specific switch to enable/disable logging

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public enable(): void {
    this.enabled = true;
  }

  public disable(): void {
    this.enabled = false;
  }

  public log(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.log(message, ...args);
    }
  }

  public warn(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.warn(message, ...args);
    }
  }

  public error(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.error(message, ...args);
    }
  }

  public debug(message: string, ...args: any[]): void {
    // For now, debug logs are treated as regular logs, but can be controlled separately later
    if (this.enabled) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }
}

