/**
 * A simple event emitter for implementing the observer pattern.
 * Allows objects to subscribe to events and be notified when those events occur.
 */
export class EventEmitter {
  /**
   * Map of event names to arrays of listener functions.
   */
  private listeners: { [event: string]: Function[] } = {};

  /**
   * Registers a listener function for a specific event.
   *
   * @param event The name of the event to listen for
   * @param listener The function to call when the event is emitted
   * @returns A function that can be called to remove the listener
   */
  public on(event: string, listener: Function): () => void {
    this.ensureEventExists(event);
    this.listeners[event].push(listener);

    // Return a function that can be called to remove the listener
    return () => this.off(event, listener);
  }

  /**
   * Emits an event, calling all registered listeners with the provided arguments.
   *
   * @param event The name of the event to emit
   * @param args The arguments to pass to the listener functions
   */
  public emit(event: string, ...args: any[]): void {
    if (this.hasListeners(event)) {
      this.notifyListeners(event, args);
    }
  }

  /**
   * Removes a listener function for a specific event.
   *
   * @param event The name of the event
   * @param listener The listener function to remove
   */
  public off(event: string, listener: Function): void {
    if (this.hasListeners(event)) {
      this.removeListener(event, listener);
    }
  }

  /**
   * Removes all listeners for a specific event.
   *
   * @param event The name of the event
   */
  public removeAllListeners(event?: string): void {
    if (event) {
      // Remove all listeners for the specified event
      delete this.listeners[event];
    } else {
      // Remove all listeners for all events
      this.listeners = {};
    }
  }

  /**
   * Gets the number of listeners for a specific event.
   *
   * @param event The name of the event
   * @returns The number of listeners
   */
  public listenerCount(event: string): number {
    return this.hasListeners(event) ? this.listeners[event].length : 0;
  }

  /**
   * Ensures that an event exists in the listeners map.
   *
   * @param event The name of the event
   * @private
   */
  private ensureEventExists(event: string): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
  }

  /**
   * Checks if an event has any listeners.
   *
   * @param event The name of the event
   * @returns True if the event has listeners, false otherwise
   * @private
   */
  private hasListeners(event: string): boolean {
    return !!this.listeners[event] && this.listeners[event].length > 0;
  }

  /**
   * Notifies all listeners for a specific event.
   *
   * @param event The name of the event
   * @param args The arguments to pass to the listener functions
   * @private
   */
  private notifyListeners(event: string, args: any[]): void {
    // Create a copy of the listeners array to avoid issues if listeners are added or removed during iteration
    const listeners = [...this.listeners[event]];
    listeners.forEach(listener => {
      try {
        listener(...args);
      } catch (error) {
        console.error(`Error in event listener for "${event}":`, error);
      }
    });
  }

  /**
   * Removes a listener function for a specific event.
   *
   * @param event The name of the event
   * @param listener The listener function to remove
   * @private
   */
  private removeListener(event: string, listener: Function): void {
    this.listeners[event] = this.listeners[event].filter(l => l !== listener);

    // Clean up empty listener arrays
    if (this.listeners[event].length === 0) {
      delete this.listeners[event];
    }
  }
}
