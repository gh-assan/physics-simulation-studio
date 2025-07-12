import { EventEmitter } from "../../core/events/EventEmitter";
import { SelectedSimulationState } from "./StateTypes";

export class SelectedSimulationStateManager extends EventEmitter {
  private _state: SelectedSimulationState = { name: null };

  constructor() {
    super();
  }

  public get state(): SelectedSimulationState {
    return this._state;
  }

  public setSimulation(name: string | null): void {
    if (this._state.name !== name) {
      this._state.name = name;
      this.emit("change", this._state);
    }
  }

  public getSimulationName(): string | null {
    return this._state.name;
  }
}
