export interface ISelectedSimulationStateManager {
  getSimulationName(): string | null;
  setSimulation(name: string | null): void;
  state: { name: string | null };
}
