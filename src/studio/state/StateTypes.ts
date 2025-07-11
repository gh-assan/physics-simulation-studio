export interface SelectedSimulationState {
  simulationId: string | null;
}

export interface AppState {
  selectedSimulation: SelectedSimulationState;
  // Add other global states here as needed
}
