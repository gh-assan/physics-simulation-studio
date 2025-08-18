import { SimulationManager } from '../../studio/simulation/SimulationManager';

/**
 * Interface for simulation algorithm - handles physics/logic without rendering
 */
export interface ISimulationAlgorithm {
  /**
   * Initialize the algorithm with the simulation manager
   */
  initialize(simulationManager: SimulationManager): void;

  /**
   * Update the simulation state for one timestep
   */
  update(timestep: number): void;
  step(state: ISimulationState, fixedDeltaTime: number): ISimulationState;

  /**
   * Reset the simulation to initial state
   */
  reset(): void;

  /**
   * Get current simulation state (for renderer)
   */
  getState(): ISimulationState;

  /**
   * Set simulation state (for loading/restoring)
   */
  setState(state: ISimulationState): void;
}

/**
 * Interface for simulation renderer - handles visual representation
 */
export interface ISimulationRenderer {
  /**
   * Initialize the renderer with the simulation manager
   */
  initialize(simulationManager: SimulationManager): void;

  /**
   * Render the current simulation state
   */
  render(state: ISimulationState): void;

  /**
   * Update visual elements from simulation state
   */
  updateFromState(state: ISimulationState): void;

  /**
   * Clean up renderer resources
   */
  dispose(): void;
}

/**
 * Base interface for simulation state
 */
export interface ISimulationState {
  readonly entities: ReadonlySet<any>;
  readonly time: number;
  readonly deltaTime: number;
  readonly isRunning: boolean;
  readonly metadata: ReadonlyMap<string, any>;
  [key: string]: any;
}

/**
 * Enhanced plugin interface with algorithm/renderer separation
 */
export interface IEnhancedSimulationPlugin {
  /**
   * Get the simulation algorithm
   */
  getAlgorithm(): ISimulationAlgorithm;

  /**
   * Get the simulation renderer
   */
  getRenderer(): ISimulationRenderer;

  /**
   * Get plugin name
   */
  getName(): string;

  /**
   * Get plugin dependencies
   */
  getDependencies(): string[];
}
