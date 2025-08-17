import { ISimulationAlgorithm, ISimulationState, ISimulationManager, EntityId } from '../../core/simulation/interfaces';
import { SimulationState } from '../../core/simulation/SimulationState';
import { TimeSteppingEngine, ITimeSteppingEngine } from '../../core/simulation/TimeSteppingEngine';
import { ISimulationRenderer } from '../../core/plugin/EnhancedPluginInterfaces';
import { Logger } from '../../core/utils/Logger';

/**
 * Simulation Manager - Core Algorithm Orchestration
 *
 * This class manages the execution of physics algorithms using fixed timesteps
 * for numerical stability. It follows clean architecture principles with
 * no nested conditions and clear single responsibilities.
 */
export class SimulationManager implements ISimulationManager {
  private static _instance: SimulationManager | undefined;

  public static getInstance(): SimulationManager {
    if (!SimulationManager._instance) {
      SimulationManager._instance = new SimulationManager(1/60);
    }
    return SimulationManager._instance;
  }
  private algorithms: Map<string, ISimulationAlgorithm> = new Map();
  private renderers: Map<string, ISimulationRenderer> = new Map();
  private currentState: SimulationState;
  private timeEngine: ITimeSteppingEngine;
  private isPlaying = false;
  private listeners: ((state: ISimulationState) => void)[] = [];
  private initialState: SimulationState;
  private renderSystem?: any; // Use correct type if available

  constructor(
    fixedTimestep: number = 1/60,
    initialState?: SimulationState
  ) {
    this.timeEngine = new TimeSteppingEngine(fixedTimestep);
    this.currentState = initialState ?? SimulationState.createInitial();
    this.initialState = this.currentState;
  }

  /**
   * Register a simulation algorithm
   */
  registerAlgorithm(algorithm: ISimulationAlgorithm): void {
    this.validateAlgorithm(algorithm);

    this.algorithms.set(algorithm.name, algorithm);
    this.initializeAlgorithm(algorithm);

    Logger.getInstance().debug(`Algorithm registered: ${algorithm.name} v${algorithm.version}`);
  }

  /**
   * Unregister an algorithm
   */
  unregisterAlgorithm(algorithmName: string): void {
    const algorithm = this.algorithms.get(algorithmName);

    if (!algorithm) {
      Logger.getInstance().warn(`Algorithm not found: ${algorithmName}`);
      return;
    }

    this.cleanupAlgorithm(algorithm);
    this.algorithms.delete(algorithmName);

    console.log(`🗑️ Algorithm unregistered: ${algorithmName}`);
  }

  /**
   * Set the render system for bridging renderer registration
   */
  setRenderSystem(renderSystem: any): void {
    this.renderSystem = renderSystem;
  }

  /**
   * Register a simulation renderer and bridge to render system
   */
  registerRenderer(name: string, renderer: ISimulationRenderer | any): void {
    const hasSimInit = renderer && typeof renderer.initialize === 'function';
    const hasSimUpdate = renderer && typeof renderer.updateFromState === 'function';

    // Only store in simulation manager if it supports simulation renderer contract
    if (hasSimInit && hasSimUpdate) {
      this.renderers.set(name, renderer as ISimulationRenderer);
      try {
        renderer.initialize(this);
      } catch (err) {
        Logger.getInstance().error('Error initializing simulation renderer:', err);
      }
      Logger.getInstance().debug(`Renderer registered: ${name}`);
    }

    // Always forward to render system if present (supports both legacy/minimal via adapter)
    if (this.renderSystem && typeof this.renderSystem.registerRenderer === 'function') {
      this.renderSystem.registerRenderer(renderer);
      Logger.getInstance().debug(`Renderer also registered with render system: ${name}`);
    }
  }

  /**
   * Unregister a renderer
   */
  unregisterRenderer(name: string): void {
    const renderer = this.renderers.get(name);
    if (renderer) {
      renderer.dispose();
      this.renderers.delete(name);
      console.log(`🗑️ Renderer unregistered: ${name}`);
    }
  }

  /**
   * Get all active renderers
   */
  getActiveRenderers(): ISimulationRenderer[] {
    return Array.from(this.renderers.values());
  }

  /**
   * Get all active algorithms
   */
  getActiveAlgorithms(): ISimulationAlgorithm[] {
    return Array.from(this.algorithms.values());
  }

  /**
   * Execute one simulation step
   */
  step(deltaTime: number): void {
    if (!this.isPlaying) {
      return;
    }

    this.timeEngine.step(deltaTime, (fixedDt) => {
      this.executeFixedStep(fixedDt);
    });
  }

  /**
   * Start simulation
   */
  play(): void {
    if (this.isPlaying) {
      return;
    }

    this.isPlaying = true;
    this.updateSimulationState(state => state.withRunning(true));

    Logger.getInstance().debug('Simulation started');
  }

  /**
   * Pause simulation
   */
  pause(): void {
    if (!this.isPlaying) {
      return;
    }

    this.isPlaying = false;
    this.updateSimulationState(state => state.withRunning(false));

    Logger.getInstance().debug('Simulation paused');
  }

  /**
   * Reset simulation to initial state
   */
  reset(): void {
    this.pause();
    this.timeEngine.reset();

    this.currentState = this.initialState;
    this.reinitializeAlgorithms();
    this.notifyStateChange();

    Logger.getInstance().debug('Simulation reset');
  }

  /**
   * Get current simulation state
   */
  getCurrentState(): ISimulationState {
    return this.currentState;
  }

  /**
   * Set entities for simulation
   */
  setEntities(entities: EntityId[]): void {
    this.updateSimulationState(state => state.withEntities(new Set(entities)));
    // Update the initial state as well so reset preserves entities
    this.initialState = this.initialState.withEntities(new Set(entities));
    this.reinitializeAlgorithms();
  }

  /**
   * Add state change listener
   */
  addStateChangeListener(listener: (state: ISimulationState) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Remove state change listener
   */
  removeStateChangeListener(listener: (state: ISimulationState) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Configure algorithm parameters
   */
  configureAlgorithm(algorithmName: string, parameters: Record<string, any>): void {
    const algorithm = this.algorithms.get(algorithmName);

    if (!algorithm) {
      console.error(`❌ Algorithm not found: ${algorithmName}`);
      return;
    }

    this.validateParameters(algorithm, parameters);
    algorithm.configure(parameters);

    console.log(`⚙️ Algorithm configured: ${algorithmName}`, parameters);
  }

  /**
   * Get time engine metrics
   */
  getTimeMetrics() {
    return this.timeEngine.getMetrics();
  }

  /**
   * Set fixed timestep
   */
  setFixedTimestep(timestep: number): void {
    this.timeEngine.setFixedTimestep(timestep);
    console.log(`🕐 Fixed timestep set to: ${timestep}s (${Math.round(1/timestep)} FPS)`);
  }

  // Private methods - clean, single-responsibility implementations

  private validateAlgorithm(algorithm: ISimulationAlgorithm): void {
    if (!algorithm.name?.trim()) {
      throw new Error('Algorithm must have a valid name');
    }

    if (!algorithm.version?.trim()) {
      throw new Error('Algorithm must have a valid version');
    }

    if (this.algorithms.has(algorithm.name)) {
      throw new Error(`Algorithm already registered: ${algorithm.name}`);
    }
  }

  private initializeAlgorithm(algorithm: ISimulationAlgorithm): void {
    const entities = this.currentState.getEntityArray();
    algorithm.initialize(entities);
  }

  private cleanupAlgorithm(algorithm: ISimulationAlgorithm): void {
    try {
      algorithm.dispose();
    } catch (error) {
      console.error(`Error disposing algorithm ${algorithm.name}:`, error);
    }
  }

  private executeFixedStep(fixedDeltaTime: number): void {
    const algorithmList = Array.from(this.algorithms.values());

    if (algorithmList.length === 0) {
      return;
    }

    // Execute algorithms in sequence, passing state between them
    let newState = this.currentState;

    for (const algorithm of algorithmList) {
      newState = this.executeAlgorithmStep(algorithm, newState, fixedDeltaTime);
    }

    // Update time and apply new state
    const timeUpdatedState = newState.withTime(
      this.currentState.time + fixedDeltaTime,
      fixedDeltaTime
    );

    this.currentState = timeUpdatedState;

    // Update all renderers with new state
    for (const renderer of this.renderers.values()) {
      try {
        renderer.updateFromState(this.currentState);
      } catch (error) {
        console.error('Error updating renderer:', error);
      }
    }

    this.notifyStateChange();
  }

  private executeAlgorithmStep(
    algorithm: ISimulationAlgorithm,
    state: ISimulationState,
    fixedDeltaTime: number
  ): SimulationState {
    try {
      const result = algorithm.step(state, fixedDeltaTime);
      // Convert to concrete SimulationState if needed
      if (result instanceof SimulationState) {
        return result;
      }
      // Convert interface to concrete implementation
      // Create metadata object for Node.js 8 compatibility
      const resultMetadata: Record<string, any> = {};
      for (const [key, value] of result.metadata) {
        resultMetadata[key] = value;
      }

      return SimulationState.create(
        Array.from(result.entities),
        result.time,
        result.deltaTime,
        result.isRunning,
        resultMetadata
      );
    } catch (error) {
      console.error(`Error in algorithm ${algorithm.name}:`, error);

      // Create metadata object for Node.js 8 compatibility
      const stateMetadata: Record<string, any> = {};
      for (const [key, value] of state.metadata) {
        stateMetadata[key] = value;
      }

      return state instanceof SimulationState ? state : SimulationState.create(
        Array.from(state.entities),
        state.time,
        state.deltaTime,
        state.isRunning,
        stateMetadata
      );
    }
  }

  private validateParameters(algorithm: ISimulationAlgorithm, parameters: Record<string, any>): void {
    for (const [paramName, value] of Object.entries(parameters)) {
      const validation = algorithm.validateParameter(paramName, value);

      if (validation !== true) {
        throw new Error(`Invalid parameter ${paramName} for ${algorithm.name}: ${validation}`);
      }
    }
  }

  private reinitializeAlgorithms(): void {
    const entities = this.currentState.getEntityArray();

    for (const algorithm of this.algorithms.values()) {
      this.safeReinitializeAlgorithm(algorithm, entities);
    }
  }

  private safeReinitializeAlgorithm(algorithm: ISimulationAlgorithm, entities: EntityId[]): void {
    try {
      algorithm.initialize(entities);
    } catch (error) {
      console.error(`Error reinitializing algorithm ${algorithm.name}:`, error);
    }
  }

  private updateSimulationState(updater: (state: SimulationState) => SimulationState): void {
    this.currentState = updater(this.currentState);
    this.notifyStateChange();
  }

  private notifyStateChange(): void {
    for (const listener of this.listeners) {
      this.safeNotifyListener(listener);
    }
  }

  private safeNotifyListener(listener: (state: ISimulationState) => void): void {
    try {
      listener(this.currentState);
    } catch (error) {
      console.error('Error in state change listener:', error);
    }
  }

  /**
   * Debug information
   */
  getDebugInfo(): {
    algorithmsCount: number;
    currentTime: number;
    isPlaying: boolean;
    entityCount: number;
    timeMetrics: any;
  } {
    return {
      algorithmsCount: this.algorithms.size,
      currentTime: this.currentState.time,
      isPlaying: this.isPlaying,
      entityCount: this.currentState.entities.size,
      timeMetrics: this.getTimeMetrics()
    };
  }
}
