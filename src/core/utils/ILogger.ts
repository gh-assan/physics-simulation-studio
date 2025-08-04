export interface ILogger {
  log(...args: any[]): void;
  warn(...args: any[]): void;
  error(...args: any[]): void;
  enable(): void;
  disable(): void;
}
