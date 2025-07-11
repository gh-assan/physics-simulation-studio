import { StateManager } from './StateManager';
import { SelectedSimulationState as ISelectedSimulationState } from './StateTypes';

export class SelectedSimulationState {
  private static instance: SelectedSimulationState;
  private stateManager: StateManager;

  private constructor() {
    this.stateManager = StateManager.getInstance();
  }

  public static getInstance(): SelectedSimulationState {
    if (!SelectedSimulationState.instance) {
      SelectedSimulationState.instance = new SelectedSimulationState();
    }
    return SelectedSimulationState.instance;
  }

  public getSimulationId(): string | null {
    return this.stateManager.getState().selectedSimulation.simulationId;
  }

  public setSimulationId(id: string | null): void {
    this.stateManager.setState({
      selectedSimulation: { simulationId: id },
    });
  }

  public subscribe(callback: (state: ISelectedSimulationState) => void): () => void {
    return this.stateManager.subscribe('selectedSimulation', callback);
  }
}

