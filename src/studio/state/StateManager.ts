import { AppState } from "./StateTypes";
import { SelectedSimulationStateManager } from "./SelectedSimulationState";

export class StateManager {
  private static _instance: StateManager;
  public selectedSimulation: SelectedSimulationStateManager;

  private constructor() {
    this.selectedSimulation = new SelectedSimulationStateManager();
  }

  public static getInstance(): StateManager {
    if (!StateManager._instance) {
      StateManager._instance = new StateManager();
    }
    return StateManager._instance;
  }

  public getAppState(): AppState {
    return {
      selectedSimulation: this.selectedSimulation.state,
    };
  }
}
