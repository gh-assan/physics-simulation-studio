import { AppState } from "./StateTypes";
import { SelectedSimulationStateManager } from "./SelectedSimulationState";
import { IStateManager } from "./IStateManager";
import { ISelectedSimulationStateManager } from "./ISelectedSimulationStateManager";

export class StateManager implements IStateManager {
  private static _instance: StateManager;
  public selectedSimulation: ISelectedSimulationStateManager;

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
