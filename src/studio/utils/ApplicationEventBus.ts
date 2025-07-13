// Simple event bus for UI events
export class ApplicationEventBus {
  private listeners: { [event: string]: Array<(payload: any) => void> } = {};

  emit(event: string, payload: any): void {
    if (this.listeners[event]) {
      this.listeners[event].forEach((cb) => cb(payload));
    }
  }

  on(event: string, callback: (payload: any) => void): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: string, callback: (payload: any) => void): void {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
    }
  }
}
