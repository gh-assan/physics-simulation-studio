import { SelectedSimulationState } from "./StateTypes";

export interface ISelectedSimulationStateManager {
  getSimulationName(): string;
  setSimulation(name: string): void;
  state: { name: string };
  onChange(callback: (state: SelectedSimulationState) => void): void;
}
