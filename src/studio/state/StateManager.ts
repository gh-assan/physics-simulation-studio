import { EventEmitter } from '../../core/events/EventEmitter';
import { AppState } from './StateTypes';

export class StateManager extends EventEmitter {
  private static instance: StateManager;
  private state: AppState;

  private constructor() {
    super();
    this.state = {
      selectedSimulation: {
        simulationId: null,
      },
    };
  }

  public static getInstance(): StateManager {
    if (!StateManager.instance) {
      StateManager.instance = new StateManager();
    }
    return StateManager.instance;
  }

  public getState(): AppState {
    return this.state;
  }

  public setState(newState: Partial<AppState>): void {
    this.state = { ...this.state, ...newState };
    this.emit('stateChange', this.state);
  }

  public subscribe<K extends keyof AppState>(
    stateKey: K,
    callback: (value: AppState[K]) => void
  ): () => void {
    const handler = (newState: AppState) => {
      callback(newState[stateKey]);
    };
    this.on('stateChange', handler);
    return () => this.off('stateChange', handler);
  }
}
