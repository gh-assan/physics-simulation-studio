export class EventEmitter {
    private listeners: { [event: string]: Function[] } = {};

    on(event: string, listener: Function): void {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(listener);
    }

    emit(event: string, ...args: any[]): void {
        if (this.listeners[event]) {
            this.listeners[event].forEach(listener => listener(...args));
        }
    }

    off(event: string, listener: Function): void {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(l => l !== listener);
        }
    }
}