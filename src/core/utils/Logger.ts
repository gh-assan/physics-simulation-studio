export class Logger {
  private static enabled: boolean = true; // Global switch to enable/disable logging

  public static enable(): void {
    Logger.enabled = true;
  }

  public static disable(): void {
    Logger.enabled = false;
  }

  public static log(message: string, ...args: any[]): void {
    if (Logger.enabled) {
      console.log(message, ...args);
    }
  }

  public static warn(message: string, ...args: any[]): void {
    if (Logger.enabled) {
      console.warn(message, ...args);
    }
  }

  public static error(message: string, ...args: any[]): void {
    if (Logger.enabled) {
      console.error(message, ...args);
    }
  }

  public static debug(message: string, ...args: any[]): void {
    // For now, debug logs are treated as regular logs, but can be controlled separately later
    if (Logger.enabled) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }
}
