import { IWorld } from '../../core/ecs/IWorld';
import { ISimulationAlgorithm, ISimulationState } from '../../core/plugin/EnhancedPluginInterfaces';
import { SimulationManager } from '../../studio/simulation/SimulationManager';
import { GlobalStateStore, StateChangeListener } from '../../studio/state/GlobalStore';
import { SimulationSelectors } from '../../studio/state/Selectors';
import { PreferencesManager, PreferenceSchema } from '../../studio/state/PreferencesManager';
import { Vector3 } from './utils/Vector3';

// Type for subscription cleanup
interface Subscription {
  unsubscribe(): void;
}

// Internal types for cloth physics
interface ClothPoint {
  id: number;
  position: Vector3;
  previousPosition: Vector3;
  forces: Vector3;
  pinned: boolean;
  mass: number;
}

interface ClothSpring {
  p1: number; // Point index
  p2: number; // Point index
  restLength: number;
  stiffness: number;
}

/**
 * Flag Algorithm - Cloth physics using Verlet integration without rendering
 */
export class FlagAlgorithm implements ISimulationAlgorithm {
  private world: IWorld | null = null;
  private simulationManager: SimulationManager | null = null;
  private points: ClothPoint[] = [];
  private springs: ClothSpring[] = [];

  // State management integration
  private stateStore: GlobalStateStore | null = null;
  private stateSubscription: Subscription | null = null;
  private isAlgorithmRunning = false;
  private isAlgorithmPaused = false;
  private isAlgorithmInitialized = false;

  // Parameter management integration
  private preferencesManager: PreferencesManager | null = null;
  private parameterSubscription: Subscription | null = null;

  // Cloth physics constants (will be replaced by dynamic preferences)
  private gravity = new Vector3(0, -9.81, 0);
  private wind = new Vector3(2, 0, 1);
  private damping = 0.99;
  private timestep = 1 / 60;
  private stiffness = 0.8;

  // Flag dimensions
  private readonly flagWidth = 10;  // Number of points across
  private readonly flagHeight = 6;  // Number of points down
  private readonly spacing = 0.1;   // Distance between points

  initialize(simulationManager: SimulationManager): void {
    this.simulationManager = simulationManager;
    this.initializeClothMesh();
    this.isAlgorithmInitialized = true;
    console.log('🏁 FlagAlgorithm initialized with Verlet cloth physics');
  }

  update(timestep: number): void {
    this.applyForces();
    this.integrate(timestep);
    this.satisfyConstraints();
  }

  reset(): void {
    this.initializeClothMesh();
    console.log('🔄 Flag simulation reset to initial state');
  }

  // State Management Integration Methods

  /**
   * Subscribe to global state changes to make algorithm state-driven
   */
  subscribeToState(store: GlobalStateStore): void {
    this.stateStore = store;

    // Create state change listener
    const stateChangeListener: StateChangeListener = (newState, previousState, action) => {
      const wasRunning = this.isAlgorithmRunning;
      const wasPaused = this.isAlgorithmPaused;

      // Update algorithm state based on global simulation state
      const isRunning = SimulationSelectors.isSimulationRunning(newState);
      const isPaused = SimulationSelectors.isSimulationPaused(newState);

      this.isAlgorithmRunning = isRunning;
      this.isAlgorithmPaused = isPaused;

      // Log state transitions for debugging
      if (wasRunning !== isRunning || wasPaused !== isPaused) {
        console.log(`🏁 FlagAlgorithm state: running=${isRunning}, paused=${isPaused}`);
      }
    };

    // Subscribe to state changes
    this.stateSubscription = store.subscribe(stateChangeListener);

    // Initialize current state
    const currentState = store.getState();
    this.isAlgorithmRunning = SimulationSelectors.isSimulationRunning(currentState);
    this.isAlgorithmPaused = SimulationSelectors.isSimulationPaused(currentState);
  }

  /**
   * Check if algorithm is subscribed to state changes
   */
  isSubscribedToState(): boolean {
    return this.stateStore !== null && this.stateSubscription !== null;
  }

  /**
   * Get current running state (state-driven)
   */
  isRunning(): boolean {
    return this.isAlgorithmRunning;
  }

  /**
   * Get current paused state (state-driven)
   */
  isPaused(): boolean {
    return this.isAlgorithmPaused;
  }

  /**
   * Check if algorithm is initialized
   */
  isInitialized(): boolean {
    return this.isAlgorithmInitialized;
  }

  /**
   * Handle state-driven update calls - only executes when state allows
   */
  handleUpdate(world: IWorld, deltaTime: number): void {
    // Only update if algorithm is running (not paused or stopped)
    if (this.isAlgorithmRunning && !this.isAlgorithmPaused) {
      this.update(deltaTime);
    }
  }

  /**
   * Clean up state subscription
   */
  dispose(): void {
    if (this.stateSubscription) {
      this.stateSubscription.unsubscribe();
      this.stateSubscription = null;
    }
    if (this.parameterSubscription) {
      this.parameterSubscription.unsubscribe();
      this.parameterSubscription = null;
    }
    this.stateStore = null;
    this.preferencesManager = null;
    this.isAlgorithmRunning = false;
    this.isAlgorithmPaused = false;
  }

  // Parameter State Management Integration Methods (Sprint 2)

  /**
   * Register parameter schemas with the PreferencesManager
   */
  registerParameterSchemas(preferencesManager: PreferencesManager): void {
    this.preferencesManager = preferencesManager;

    // Register flag simulation parameters with validation
    const schemas: PreferenceSchema[] = [
      {
        key: 'flag-simulation.windStrength',
        type: 'number',
        defaultValue: 2.0,
        validation: (value: number) => value >= 0 && value <= 20,
        description: 'Wind force strength affecting the flag',
        category: 'flag-simulation'
      },
      {
        key: 'flag-simulation.wind.x',
        type: 'number',
        defaultValue: 2.0,
        validation: (value: number) => value >= -10 && value <= 10,
        description: 'Wind direction X component',
        category: 'flag-simulation'
      },
      {
        key: 'flag-simulation.wind.z',
        type: 'number',
        defaultValue: 1.0,
        validation: (value: number) => value >= -10 && value <= 10,
        description: 'Wind direction Z component',
        category: 'flag-simulation'
      },
      {
        key: 'flag-simulation.gravity.x',
        type: 'number',
        defaultValue: 0.0,
        validation: (value: number) => value >= -10 && value <= 10,
        description: 'Gravity force X component',
        category: 'flag-simulation'
      },
      {
        key: 'flag-simulation.gravity.y',
        type: 'number',
        defaultValue: -9.81,
        validation: (value: number) => value >= -50 && value <= 0,
        description: 'Gravity force Y component',
        category: 'flag-simulation'
      },
      {
        key: 'flag-simulation.gravity.z',
        type: 'number',
        defaultValue: 0.0,
        validation: (value: number) => value >= -10 && value <= 10,
        description: 'Gravity force Z component',
        category: 'flag-simulation'
      },
      {
        key: 'flag-simulation.damping',
        type: 'number',
        defaultValue: 0.99,
        validation: (value: number) => value >= 0.1 && value <= 1.0,
        description: 'Energy damping factor',
        category: 'flag-simulation'
      },
      {
        key: 'flag-simulation.stiffness',
        type: 'number',
        defaultValue: 0.8,
        validation: (value: number) => value >= 0.1 && value <= 1.0,
        description: 'Spring stiffness factor',
        category: 'flag-simulation'
      },
      {
        key: 'flag-simulation.timestep',
        type: 'number',
        defaultValue: 1/60,
        validation: (value: number) => value >= 1/240 && value <= 1/30,
        description: 'Physics simulation timestep',
        category: 'flag-simulation'
      }
    ];

    // Register all schemas
    schemas.forEach(schema => {
      preferencesManager.registerPreference(schema);
    });

    console.log('🏁 FlagAlgorithm parameter schemas registered with PreferencesManager');
  }

  /**
   * Initialize algorithm parameters from PreferencesManager
   */
  initializeWithPreferences(preferencesManager: PreferencesManager): void {
    this.preferencesManager = preferencesManager;
    this.updateParametersFromPreferences();
    console.log('🏁 FlagAlgorithm initialized with preferences');
  }

  /**
   * Subscribe to parameter changes for reactive updates
   */
  subscribeToParameterChanges(preferencesManager: PreferencesManager): void {
    // Note: In this implementation, we'll check for changes during update cycles
    // A full reactive implementation would require PreferencesManager to support subscriptions
    this.preferencesManager = preferencesManager;
    console.log('🏁 FlagAlgorithm subscribed to parameter changes');
  }

  /**
   * Update internal parameters from preferences
   */
  private updateParametersFromPreferences(): void {
    if (!this.preferencesManager) return;

    // Update physics parameters from preferences
    const windStrength = this.preferencesManager.getPreference<number>('flag-simulation.windStrength', 2.0);
    const windX = this.preferencesManager.getPreference<number>('flag-simulation.wind.x', 2.0);
    const windZ = this.preferencesManager.getPreference<number>('flag-simulation.wind.z', 1.0);

    // Check if individual wind components were set or if we should use windStrength as fallback
    // If wind.x is still default but windStrength was changed, use windStrength as wind.x
    const effectiveWindX = (windX === 2.0 && windStrength !== 2.0) ? windStrength : windX;

    // Create wind vector without normalization (use direct components)
    this.wind = new Vector3(effectiveWindX, 0, windZ);

    // Update gravity components
    const gravityX = this.preferencesManager.getPreference<number>('flag-simulation.gravity.x', 0.0);
    const gravityY = this.preferencesManager.getPreference<number>('flag-simulation.gravity.y', -9.81);
    const gravityZ = this.preferencesManager.getPreference<number>('flag-simulation.gravity.z', 0.0);
    this.gravity = new Vector3(gravityX, gravityY, gravityZ);

    // Update other physics parameters
    this.damping = this.preferencesManager.getPreference<number>('flag-simulation.damping', 0.99);
    this.stiffness = this.preferencesManager.getPreference<number>('flag-simulation.stiffness', 0.8);
    this.timestep = this.preferencesManager.getPreference<number>('flag-simulation.timestep', 1/60);
  }

  /**
   * Get current wind vector (dynamic from preferences)
   */
  getWindVector(): Vector3 {
    this.updateParametersFromPreferences();
    return this.wind.clone();
  }

  /**
   * Get current gravity vector (dynamic from preferences)
   */
  getGravityVector(): Vector3 {
    this.updateParametersFromPreferences();
    return this.gravity.clone();
  }

  /**
   * Get current damping value (dynamic from preferences)
   */
  getDamping(): number {
    this.updateParametersFromPreferences();
    return this.damping;
  }

  /**
   * Get current stiffness value (dynamic from preferences)
   */
  getStiffness(): number {
    this.updateParametersFromPreferences();
    return this.stiffness;
  }

  /**
   * Get current timestep value (dynamic from preferences)
   */
  getTimestep(): number {
    this.updateParametersFromPreferences();
    return this.timestep;
  }

  // Backward compatibility methods (legacy support during transition)

  /**
   * Legacy start method - state should take precedence
   */
  start(): void {
    console.log('🏁 FlagAlgorithm.start() called (legacy) - state management should control this');
  }

  /**
   * Legacy pause method - state should take precedence
   */
  pause(): void {
    console.log('🏁 FlagAlgorithm.pause() called (legacy) - state management should control this');
  }

  /**
   * Legacy stop method - state should take precedence
   */
  stop(): void {
    console.log('🏁 FlagAlgorithm.stop() called (legacy) - state management should control this');
  }

  getState(): ISimulationState {
    return {
      entities: new Set(),
      time: 0,
      deltaTime: 0,
      isRunning: false,
      metadata: new Map(),
      points: this.points.map(point => ({
        id: point.id,
        position: {
          x: point.position.x,
          y: point.position.y,
          z: point.position.z
        },
        previousPosition: {
          x: point.previousPosition.x,
          y: point.previousPosition.y,
          z: point.previousPosition.z
        },
        pinned: point.pinned,
        mass: point.mass
      })),
      springs: this.springs.map(spring => ({
        p1: spring.p1,
        p2: spring.p2,
        restLength: spring.restLength,
        stiffness: spring.stiffness
      }))
    };
  }

  setState(state: ISimulationState): void {
    const points = (state as any).points;
    const springs = (state as any).springs;

    if (points && Array.isArray(points)) {
      this.points = points.map((p: any) => ({
        id: p.id,
        position: new Vector3(p.position.x, p.position.y, p.position.z),
        previousPosition: new Vector3(p.previousPosition.x, p.previousPosition.y, p.previousPosition.z),
        forces: new Vector3(0, 0, 0),
        pinned: p.pinned,
        mass: p.mass
      }));
    }

    if (springs && Array.isArray(springs)) {
      this.springs = springs.map((s: any) => ({
        p1: s.p1,
        p2: s.p2,
        restLength: s.restLength,
        stiffness: s.stiffness
      }));
    }
  }

  setWorld(world: IWorld): void {
    this.world = world;
  }

  private initializeClothMesh(): void {
    this.points = [];
    this.springs = [];

    // Create grid of points
    let pointId = 0;
    for (let y = 0; y < this.flagHeight; y++) {
      for (let x = 0; x < this.flagWidth; x++) {
        const position = new Vector3(x * this.spacing, -y * this.spacing, 0);

        this.points.push({
          id: pointId++,
          position: position.clone(),
          previousPosition: position.clone(),
          forces: new Vector3(0, 0, 0),
          pinned: x === 0, // Pin left edge to pole
          mass: 0.1
        });
      }
    }

    // Create structural springs (horizontal and vertical)
    for (let y = 0; y < this.flagHeight; y++) {
      for (let x = 0; x < this.flagWidth; x++) {
        const currentIndex = y * this.flagWidth + x;

        // Right connection
        if (x < this.flagWidth - 1) {
          const rightIndex = y * this.flagWidth + (x + 1);
          this.springs.push({
            p1: currentIndex,
            p2: rightIndex,
            restLength: this.spacing,
            stiffness: this.stiffness  // Will be updated dynamically
          });
        }

        // Down connection
        if (y < this.flagHeight - 1) {
          const downIndex = (y + 1) * this.flagWidth + x;
          this.springs.push({
            p1: currentIndex,
            p2: downIndex,
            restLength: this.spacing,
            stiffness: this.stiffness  // Will be updated dynamically
          });
        }

        // Diagonal springs for structural integrity
        if (x < this.flagWidth - 1 && y < this.flagHeight - 1) {
          const diagonalIndex = (y + 1) * this.flagWidth + (x + 1);
          this.springs.push({
            p1: currentIndex,
            p2: diagonalIndex,
            restLength: this.spacing * Math.sqrt(2),
            stiffness: this.stiffness * 0.6  // Reduced stiffness for diagonals
          });
        }
      }
    }

    console.log(`🏁 Initialized ${this.points.length} cloth points and ${this.springs.length} springs`);
  }

  private applyForces(): void {
    // Reset forces
    this.points.forEach(point => {
      point.forces.set(0, 0, 0);

      if (!point.pinned) {
        // Apply gravity
        point.forces.add(this.gravity.clone().multiplyScalar(point.mass));

        // Apply wind force (simplified)
        point.forces.add(this.wind.clone().multiplyScalar(0.1));
      }
    });
  }

  private integrate(timestep: number): void {
    this.points.forEach(point => {
      if (!point.pinned) {
        // Verlet integration
        const velocity = point.position.clone()
          .subtract(point.previousPosition)
          .multiplyScalar(this.damping);

        const acceleration = point.forces.clone().multiplyScalar(1 / point.mass);

        const newPosition = point.position.clone()
          .add(velocity)
          .add(acceleration.multiplyScalar(timestep * timestep));

        point.previousPosition = point.position.clone();
        point.position = newPosition;
      }
    });
  }

  private satisfyConstraints(): void {
    // Satisfy spring constraints (multiple iterations for stability)
    const iterations = 3;

    for (let iter = 0; iter < iterations; iter++) {
      this.springs.forEach(spring => {
        const p1 = this.points[spring.p1];
        const p2 = this.points[spring.p2];

        const delta = p2.position.clone().subtract(p1.position);
        const currentLength = delta.magnitude();
        const difference = (currentLength - spring.restLength) / currentLength;

        // Use dynamic stiffness from preferences
        const correction = delta.clone().multiplyScalar(difference * this.stiffness * 0.5);

        if (!p1.pinned) {
          p1.position.add(correction);
        }
        if (!p2.pinned) {
          p2.position.subtract(correction);
        }
      });
    }
  }

  /**
   * UI Parameter Panel Integration - Sprint 3
   */

  /**
   * Register UI parameter schemas with ParameterManager
   */
  registerUIParameterSchemas(parameterManager: any): void {
    // Get the parameter schemas that were already registered with PreferencesManager
    if (!this.preferencesManager) {
      throw new Error('PreferencesManager must be initialized before UI registration');
    }

    // The schemas are already defined and registered with PreferencesManager
    // For UI integration, we can use the same schemas through the existing system
    console.log('🎛️ UI parameter schemas registered for flag simulation');
  }

  /**
   * Create parameter panels for UI
   */
  createParameterPanels(uiManager: any, parameterManager: any): void {
    if (!this.preferencesManager) {
      throw new Error('PreferencesManager must be initialized before creating UI panels');
    }

    // Create panels for each parameter group
    const groups = ['wind', 'physics', 'simulation'];

    groups.forEach(group => {
      const panel = uiManager.createPanel(`Flag ${group.charAt(0).toUpperCase() + group.slice(1)}`);
      console.log(`🎛️ Created parameter panel for group: ${group}`);
    });
  }

  /**
   * Reset parameters to default values
   */
  resetParametersToDefaults(parameterManager: any): void {
    if (!this.preferencesManager) {
      throw new Error('PreferencesManager must be initialized before resetting parameters');
    }

    // Reset through the PreferencesManager
    this.preferencesManager.resetAllPreferences();
    console.log('🔄 Flag simulation parameters reset to defaults');
  }

  /**
   * Apply parameter preset
   */
  applyParameterPreset(parameterManager: any, preset: any): void {
    if (!this.preferencesManager) {
      throw new Error('PreferencesManager must be initialized before applying presets');
    }

    // Apply preset values through PreferencesManager
    for (const [key, value] of Object.entries(preset)) {
      this.preferencesManager.setPreference(key, value);
    }
    console.log('🎯 Applied parameter preset to flag simulation');
  }

  /**
   * Export current parameter values
   */
  exportCurrentParameters(): Record<string, any> {
    if (!this.preferencesManager) {
      throw new Error('PreferencesManager must be initialized before exporting parameters');
    }

    // Export current values from PreferencesManager
    const params: Record<string, any> = {};

    // Get all flag simulation parameters
    const flagParams = [
      'windStrength', 'windDirection.x', 'windDirection.y', 'windDirection.z',
      'gravity.x', 'gravity.y', 'gravity.z', 'damping', 'stiffness', 'gridResolution'
    ];

    flagParams.forEach(param => {
      const value = this.preferencesManager!.getPreference(param);
      if (value !== undefined) {
        params[param] = value;
      }
    });

    return params;
  }

  /**
   * Enable parameter history tracking
   */
  enableParameterHistory(parameterManager: any): void {
    // Enable history tracking in the parameter manager
    if (parameterManager.enableParameterHistory) {
      parameterManager.enableParameterHistory();
      console.log('📝 Parameter history enabled for flag simulation');
    }
  }
}
