import { EventEmitter } from "../../core/events/EventEmitter";
import { SelectedSimulationState } from "./StateTypes";
import { DEFAULT_SELECTED_SIMULATION_STATE } from "./SelectedSimulationDefaults";
import { ISelectedSimulationStateManager } from "./ISelectedSimulationStateManager";
import { IEventEmitter } from "../../core/events/IEventEmitter";

export class SelectedSimulationStateManager extends EventEmitter implements ISelectedSimulationStateManager {
  private _state: SelectedSimulationState = { ...DEFAULT_SELECTED_SIMULATION_STATE };

  constructor() {
    super();
  }

  public get state(): SelectedSimulationState {
    return this._state;
  }

  public setSimulation(name: string | null): void {
    const newName = name || DEFAULT_SELECTED_SIMULATION_STATE.name;
    if (this._state.name !== newName) {
      this._state.name = newName;
      this.emit("change", this._state);
    }
  }

  public getSimulationName(): string | null {
    return this._state.name;
  }

  public onChange(callback: (state: SelectedSimulationState) => void): void {
    this.on("change", callback);
  }
}
