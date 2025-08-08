/**
 * Core Simulation Interfaces - Clean Architecture Implementation
 *
 * These interfaces define the contracts for all simulation components,
 * ensuring clean separation of concerns and plugin extensibility.
 */

/**
 * Entity ID type - entities are represented by unique IDs
 */
export type EntityId = number;

/**
 * Immutable simulation state container
 */
export interface ISimulationState {
  readonly entities: ReadonlySet<EntityId>;
  readonly time: number;
  readonly deltaTime: number;
  readonly isRunning: boolean;
  readonly metadata: ReadonlyMap<string, any>;

  /**
   * Check if state has any entities
   */
  isEmpty(): boolean;

  /**
   * Check if state contains specific entity
   */
  hasEntity(entityId: EntityId): boolean;

  /**
   * Get entities as array for convenience
   */
  getEntityArray(): EntityId[];

  /**
   * Get metadata value
   */
  getMetadata<T = any>(key: string): T | undefined;

  /**
   * Check if metadata exists
   */
  hasMetadata(key: string): boolean;
}

/**
 * Core algorithm interface - defines physics computation
 */
export interface ISimulationAlgorithm {
  readonly name: string;
  readonly version: string;

  /**
   * Execute one simulation step with fixed timestep
   * @param state Current simulation state (immutable)
   * @param fixedDeltaTime Fixed timestep for numerical stability
   * @returns New simulation state
   */
  step(state: ISimulationState, fixedDeltaTime: number): ISimulationState;

  /**
   * Configure algorithm parameters
   * @param parameters Key-value parameter updates
   */
  configure(parameters: Record<string, any>): void;

  /**
   * Initialize algorithm with entities
   * @param entities Initial entity IDs for this algorithm
   */
  initialize(entities: EntityId[]): void;

  /**
   * Clean up algorithm resources
   */
  dispose(): void;

  /**
   * Get current algorithm parameters
   */
  getParameters(): Record<string, any>;

  /**
   * Validate parameter values
   * @param paramName Parameter name
   * @param value Parameter value
   * @returns true if valid, error message if invalid
   */
  validateParameter(paramName: string, value: any): true | string;
}

/**
 * Rendering interface - visualizes simulation results
 */
export interface ISimulationRenderer {
  readonly algorithmName: string;
  readonly rendererType: string;

  /**
   * Check if this renderer can handle specific entities
   * @param entities Entity IDs to check
   */
  canRender(entities: EntityId[]): boolean;

  /**
   * Render entities based on current state
   * @param entities Entity IDs to render
   * @param context Rendering context
   */
  render(entities: EntityId[], context: IRenderContext): void;

  /**
   * Update visual parameters only (no simulation impact)
   * @param parameters Visual parameter updates
   */
  updateVisualParameters(parameters: Record<string, any>): void;

  /**
   * Clear all rendered objects
   */
  clear(): void;

  /**
   * Clean up renderer resources
   */
  dispose(): void;
}

/**
 * Rendering context - provides graphics utilities
 */
export interface IRenderContext {
  readonly scene: any; // THREE.Scene or similar
  readonly camera: any;
  readonly renderer: any;
  readonly time: number;
  readonly deltaTime: number;

  /**
   * Create mesh from geometry data
   */
  createMesh(geometry: any, material: any): any;

  /**
   * Update existing mesh
   */
  updateMesh(mesh: any, geometry: any): void;

  /**
   * Remove mesh from scene
   */
  removeMesh(mesh: any): void;
}

/**
 * Parameter definition interface
 */
export interface IParameterDefinition {
  readonly name: string;
  readonly type: 'number' | 'boolean' | 'vector' | 'color' | 'enum';
  readonly defaultValue: any;
  readonly category: 'physics' | 'visual' | 'algorithm' | 'camera';
  readonly constraints?: {
    readonly min?: number;
    readonly max?: number;
    readonly step?: number;
    readonly options?: readonly string[];
  };
  readonly description?: string;
  readonly units?: string;
}

/**
 * Parameter manager interface
 */
export interface IParameterManager {
  /**
   * Register parameter definition
   */
  registerParameter(algorithmName: string, parameter: IParameterDefinition): void;

  /**
   * Unregister parameters for algorithm
   */
  unregisterParameters(algorithmName: string): void;

  /**
   * Get parameter definition
   */
  getParameter(algorithmName: string, paramName: string): IParameterDefinition | undefined;

  /**
   * Get all parameters for algorithm
   */
  getParameters(algorithmName: string): IParameterDefinition[];

  /**
   * Validate parameter value
   */
  validateParameter(algorithmName: string, paramName: string, value: any): true | string;

  /**
   * Set parameter value
   */
  setParameter(algorithmName: string, paramName: string, value: any): void;

  /**
   * Get parameter value
   */
  getParameterValue(algorithmName: string, paramName: string): any;

  /**
   * Get all parameter values for algorithm
   */
  getParameterValues(algorithmName: string): Record<string, any>;

  /**
   * Reset parameter to default value
   */
  resetParameter(algorithmName: string, paramName: string): void;

  /**
   * Reset all parameters for algorithm
   */
  resetParameters(algorithmName: string): void;

  /**
   * Get parameters grouped by category
   */
  getParametersByCategory(algorithmName: string): Map<string, IParameterDefinition[]>;

  /**
   * Add parameter change listener
   */
  addParameterChangeListener(
    algorithmName: string,
    listener: (algorithmName: string, paramName: string, value: any) => void
  ): void;

  /**
   * Remove parameter change listener
   */
  removeParameterChangeListener(
    algorithmName: string,
    listener: (algorithmName: string, paramName: string, value: any) => void
  ): void;

  /**
   * Get parameter statistics
   */
  getStats(): {
    algorithmCount: number;
    totalParameters: number;
    parametersByCategory: Record<string, number>;
  };
}

/**
 * Graph configuration interface
 */
export interface IGraphConfig {
  readonly id: string;
  readonly title: string;
  readonly type: 'line' | 'bar' | 'scatter';
  readonly datasets: readonly {
    readonly label: string;
    readonly color: string;
  }[];
  readonly maxDataPoints: number;
  readonly updateFrequency: number; // Hz
}

/**
 * Simulation UI interface
 */
export interface ISimulationUI {
  readonly algorithmName: string;
  readonly title: string;
  readonly category: 'parameters' | 'controls' | 'visualization';

  /**
   * Create UI panel
   */
  createPanel(container: HTMLElement): void;

  /**
   * Update UI with new values
   */
  update(values: Record<string, any>): void;

  /**
   * Destroy UI panel
   */
  destroy(): void;
}

/**
 * Complete simulation plugin interface
 */
export interface ISimulationPlugin {
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly dependencies: readonly string[];

  /**
   * Get simulation algorithm
   */
  getAlgorithm(): ISimulationAlgorithm;

  /**
   * Get simulation renderer
   */
  getRenderer(): ISimulationRenderer;

  /**
   * Get parameter definitions
   */
  getParameters(): IParameterDefinition[];

  /**
   * Get UI components
   */
  getUI(): ISimulationUI[];

  /**
   * Get graph configurations
   */
  getGraphs(): IGraphConfig[];

  /**
   * Register plugin with context
   */
  register(context: IPluginContext): void;

  /**
   * Unregister plugin
   */
  unregister(context: IPluginContext): void;

  /**
   * Handle parameter changes
   */
  onParameterChanged(algorithmName: string, paramName: string, value: any): void;
}

/**
 * Plugin context - provides access to all studio managers
 */
export interface IPluginContext {
  // Core ECS
  readonly world: any; // IWorld

  // Studio managers
  readonly simulationManager: ISimulationManager;
  readonly renderManager: IRenderManager;
  readonly parameterManager: IParameterManager;
  readonly cameraManager: ICameraManager;
  readonly graphManager: IGraphManager;
  readonly uiManager: IUIManager;

  // State management
  readonly globalStore: any;

  // Utilities
  readonly logger: ILogger;
  readonly eventBus: IEventBus;
}

// Forward declarations for manager interfaces
export interface ISimulationManager {
  registerAlgorithm(algorithm: ISimulationAlgorithm): void;
  unregisterAlgorithm(algorithmName: string): void;
  getActiveAlgorithms(): ISimulationAlgorithm[];
  step(deltaTime: number): void;
  play(): void;
  pause(): void;
  reset(): void;
}

export interface IRenderManager {
  registerRenderer(renderer: ISimulationRenderer): void;
  unregisterRenderer(algorithmName: string): void;
  render(context: IRenderContext): void;
  updateVisualParameters(algorithmName: string, parameters: Record<string, any>): void;
}

export interface ICameraManager {
  setPosition(position: { x: number; y: number; z: number }): void;
  setTarget(target: { x: number; y: number; z: number }): void;
  setFOV(fov: number): void;
  getCamera(): any;
}

export interface IGraphManager {
  registerGraph(algorithmName: string, config: IGraphConfig): void;
  unregisterGraphs(algorithmName: string): void;
  updateGraph(graphId: string, data: any[]): void;
  clearGraphs(): void;
}

export interface IUIManager {
  registerUI(ui: ISimulationUI): void;
  unregisterUI(ui: ISimulationUI): void;
  updateUI(algorithmName: string, values: Record<string, any>): void;
}

export interface ILogger {
  log(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}

export interface IEventBus {
  emit(event: string, data?: any): void;
  on(event: string, handler: (data?: any) => void): void;
  off(event: string, handler: (data?: any) => void): void;
}
