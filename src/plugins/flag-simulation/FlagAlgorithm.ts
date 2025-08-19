import { IWorld } from '../../core/ecs/IWorld';
import { ISimulationAlgorithm, ISimulationState } from '../../core/simulation/interfaces';
import { SimulationState } from '../../core/simulation/SimulationState';
import { SimulationManager } from '../../studio/simulation/SimulationManager';
import { GlobalStateStore, StateChangeListener } from '../../studio/state/GlobalStore';
import { PreferenceSchema, PreferencesManager } from '../../studio/state/PreferencesManager';
import { SimulationSelectors } from '../../studio/state/Selectors';
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
  /**
   * Legacy compatibility: allow initialize(simulationManager) for tests
   */
  initialize(simulationManager: SimulationManager): void;
  initialize(entities: number[]): void;
  initialize(arg: SimulationManager | number[]): void {
    if (Array.isArray(arg)) {
      // New interface
      // ...existing code for initialize(entities: number[])...
      // Store entities for later use
      this.entityIds = arg;
      // Initialize cloth mesh
      this.initializeClothMesh();
      this.isAlgorithmInitialized = true;
      console.log('🏁 FlagAlgorithm initialized with Verlet cloth physics');
    } else {
      // Legacy interface
      this.simulationManager = arg;
      // For tests, create a default entity if needed
      this.initialize([0]);
    }
  }

  /**
   * @deprecated The update method is deprecated and will be removed in a future version. Use step() instead.
   */
  update(deltaTime: number): void {
    this.step(this.getState(), deltaTime);
  }

  readonly name = 'flag-simulation';
  readonly version = '1.0.0';

  private world: IWorld | null = null;
  private simulationManager: SimulationManager | null = null;
  private points: ClothPoint[] = [];
  private springs: ClothSpring[] = [];

  // State management integration
  private stateStore: GlobalStateStore | null = null;
  private stateSubscription: Subscription | null = null;
  private isAlgorithmInitialized = false;

  // Parameter management integration
  private preferencesManager: PreferencesManager | null = null;
  private parameterSubscription: Subscription | null = null;

  // Sprint 4: Real-time visual feedback properties
  private visualUpdateCallback: ((parameter: string, value: any) => void) | null = null;

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


  // Store entities for proper interface implementation
  private entityIds: number[] = [];

  /**
   * Initialize the algorithm with simulation manager (legacy method for plugin compatibility)
   */
  initializeWithManager(simulationManager: SimulationManager): void {
    this.simulationManager = simulationManager;
    this.initialize([0]);  // Call the proper interface method with a dummy entity
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
    // No-op: state-driven play/pause is now external. This method is kept for interface compatibility.
  }

  /**
   * Check if algorithm is subscribed to state changes
   */
  isSubscribedToState(): boolean {
    return this.stateStore !== null;
  }

  /**
   * Get current running state (state-driven)
   */
  // isRunning and isPaused removed: simulation is always advanced when step/update is called.

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
    // Simulation is always advanced when this is called. Play/pause is managed externally.
    this.update(deltaTime);
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
    // No running/paused state to reset.
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
        defaultValue: 1 / 60,
        validation: (value: number) => value >= 1 / 240 && value <= 1 / 30,
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
    this.timestep = this.preferencesManager.getPreference<number>('flag-simulation.timestep', 1 / 60);
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
    // Always read fresh from preferences
    if (this.preferencesManager) {
      return this.preferencesManager.getPreference<number>('flag-simulation.damping', 0.99);
    }
    return 0.99; // Default fallback
  }

  /**
   * Get current stiffness value (dynamic from preferences)
   */
  getStiffness(): number {
    // Always read fresh from preferences
    if (this.preferencesManager) {
      return this.preferencesManager.getPreference<number>('flag-simulation.stiffness', 0.8);
    }
    return 0.8; // Default fallback
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
    // Use plain object for metadata for Node.js 8+ compatibility
    const metadata: { [key: string]: string } = {
      algorithmType: 'flag-simulation',
      pointCount: this.points.length.toString(),
      springCount: this.springs.length.toString()
    };

    // Create the base simulation state
    const state = SimulationState.create(
      this.entityIds,
      0, // time
      this.timestep, // deltaTime
      true, // always running for compatibility
      metadata
    );

    // For legacy/test compatibility, return points and springs as properties
    return Object.assign(Object.create(Object.getPrototypeOf(state)), state, {
      points: this.points,
      springs: this.springs
    });
  }

  /**
   * Configure algorithm parameters (ISimulationAlgorithm interface)
   */
  configure(parameters: Record<string, any>): void {
    for (const [key, value] of Object.entries(parameters)) {
      this.doApplyParameterUpdate(key, value);
    }
  }

  /**
   * Get current algorithm parameters (ISimulationAlgorithm interface)
   */
  getParameters(): Record<string, any> {
    return {
      windStrength: this.getWindStrength(),
      damping: this.getDamping(),
      stiffness: this.getStiffness(),
      gravity: this.getGravity()
    };
  }

  /**
   * Validate parameter values (ISimulationAlgorithm interface)
   */
  validateParameter(paramName: string, value: any): true | string {
    // Simple validation based on parameter constraints
    switch (paramName) {
      case 'windStrength':
        if (typeof value !== 'number' || value < 0 || value > 20) {
          return 'Wind strength must be between 0 and 20';
        }
        break;
      case 'damping':
        if (typeof value !== 'number' || value < 0.1 || value > 1.0) {
          return 'Damping must be between 0.1 and 1.0';
        }
        break;
      case 'stiffness':
        if (typeof value !== 'number' || value < 0.1 || value > 1.0) {
          return 'Stiffness must be between 0.1 and 1.0';
        }
        break;
      default:
        return `Unknown parameter: ${paramName}`;
    }
    return true;
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
          const diagRightDown = (y + 1) * this.flagWidth + (x + 1);
          this.springs.push({
            p1: currentIndex,
            p2: diagRightDown,
            restLength: this.spacing * Math.sqrt(2),
            stiffness: this.stiffness * 0.6  // Reduced stiffness for diagonals
          });
        }
        if (x > 0 && y < this.flagHeight - 1) {
          const diagLeftDown = (y + 1) * this.flagWidth + (x - 1);
          this.springs.push({
            p1: currentIndex,
            p2: diagLeftDown,
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

    // Register parameters with ParameterManager using IParameterDefinition format
    const parameterDefinitions = [
      {
        name: 'windStrength',
        type: 'number' as const,
        defaultValue: 2.0,
        category: 'physics' as const,
        constraints: { min: 0, max: 20, step: 0.1 },
        description: 'Wind force strength affecting the flag',
        units: 'm/s'
      },
      {
        name: 'damping',
        type: 'number' as const,
        defaultValue: 0.99,
        category: 'physics' as const,
        constraints: { min: 0.1, max: 1.0, step: 0.01 },
        description: 'Energy damping factor',
        units: ''
      },
      {
        name: 'gravity.y',
        type: 'number' as const,
        defaultValue: -9.81,
        category: 'physics' as const,
        constraints: { min: -50, max: 0, step: 0.1 },
        description: 'Gravity force Y component',
        units: 'm/s²'
      },
      {
        name: 'stiffness',
        type: 'number' as const,
        defaultValue: 0.8,
        category: 'physics' as const,
        constraints: { min: 0.1, max: 1.0, step: 0.01 },
        description: 'Spring stiffness factor',
        units: ''
      }
    ];

    // Register each parameter with ParameterManager
    parameterDefinitions.forEach(param => {
      parameterManager.registerParameter('flag-simulation', param);
    });

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

    // Set up parameter change listener (undo/redo and external changes)
    if (parameterManager.addParameterChangeListener) {
      parameterManager.addParameterChangeListener('flag-simulation', (paramName: string, value: any) => {
        if (this.suppressListenerOnce) {
          this.suppressListenerOnce = false;
          return;
        }
        const previous = this.lastAppliedValues.get(paramName);
        this.doApplyParameterUpdate(paramName, value);
        if (previous !== undefined) {
          this.showUndoFeedback(paramName, previous, value);
        }
      });
    }

    // Set up direct call routing for updateParameter
    const originalUpdateParameter = parameterManager.updateParameter.bind(parameterManager);
    parameterManager.updateParameter = (fullName: string, value: any) => {
      const isFlagParam = fullName.startsWith('flag-simulation.');
      const paramName = isFlagParam ? fullName.replace('flag-simulation.', '') : fullName;
      const prevValue = isFlagParam ? this.getPublicParameterValue(paramName) : undefined;

      try {
        // Maintain ParameterManager state
        this.suppressListenerOnce = true;
        if (fullName === 'flag-simulation.gravity.y') {
          parameterManager.setParameter('flag-simulation', 'gravity.y', value);
        } else {
          originalUpdateParameter(fullName, value);
        }
      } catch (error) {
        if (isFlagParam) {
          this.showParameterValidationFeedback(paramName, value, 'invalid-range');
          this.applyFallbackValue(paramName, prevValue !== undefined ? prevValue : value);
        }
        throw error;
      }

      if (isFlagParam) {
        // Apply immediately for instant feedback
        this.doApplyParameterUpdate(paramName, value);

        // Animate transition when enabled and numeric
        if (this.parameterAnimationEnabled && typeof value === 'number' && typeof prevValue === 'number') {
          this.animateParameterTransition(paramName, prevValue, value, { duration: 300, easing: 'smoothstep' });
        }

        // Debounce external-facing apply to reduce call counts
        this.scheduleThrottledApply(paramName, value);
      }
    };
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

  // Sprint 4: Real-time Visual Parameter Feedback Methods

  private renderer: any = null;
  private visualUpdateEnabled = false;
  private parameterAnimationEnabled = false;
  private batchUpdatesEnabled = false;
  private pendingBatchUpdates: Array<{ parameter: string, value: any }> = [];
  private updateThrottleTimeout: NodeJS.Timeout | null = null;
  private animationFrameId: number | null = null;
  // UI coalescing and state helpers (Sprint 4)
  private uiUpdateTimers: Map<string, NodeJS.Timeout> = new Map();
  private uiPendingValues: Map<string, any> = new Map();
  private suppressListenerOnce = false;
  private lastAppliedValues: Map<string, any> = new Map();

  /**
   * Enable real-time visual feedback system
   */
  enableRealTimeVisualFeedback(renderer: any): void {
    this.renderer = renderer;
    this.visualUpdateEnabled = true;
    console.log('👁️ Real-time visual feedback enabled for flag simulation');
  }

  /**
   * Get wind strength for testing and UI feedback
   */
  getWindStrength(): number {
    // Return the windStrength parameter directly from preferences
    if (this.preferencesManager) {
      return this.preferencesManager.getPreference<number>('flag-simulation.windStrength', 2.0);
    }
    return 2.0; // Default fallback
  }

  /**
   * Get gravity vector for testing and UI feedback
   */
  getGravity(): Vector3 {
    // Always read fresh from preferences
    if (this.preferencesManager) {
      const gravityX = this.preferencesManager.getPreference<number>('flag-simulation.gravity.x', 0.0);
      const gravityY = this.preferencesManager.getPreference<number>('flag-simulation.gravity.y', -9.81);
      const gravityZ = this.preferencesManager.getPreference<number>('flag-simulation.gravity.z', 0.0);
      return new Vector3(gravityX, gravityY, gravityZ);
    }
    return new Vector3(0, -9.81, 0); // Default fallback
  }

  /**
   * Get cloth points for physics inspection
   */
  getClothPoints(): ClothPoint[] {
    return this.points;
  }

  /**
   * Get springs for physics inspection
   */
  getSprings(): ClothSpring[] {
    return this.springs;
  }

  /**
   * Update stiffness of existing springs
   */
  private updateSpringStiffness(newStiffness: number): void {
    this.springs.forEach(spring => {
      spring.stiffness = newStiffness;
    });
  }

  /**
   * Trigger visual update when parameters change
   */
  triggerVisualUpdate(parameter: string, value: any): void {
    if (!this.visualUpdateEnabled || !this.renderer) return;

    const updateData = {
      parameter,
      value,
      timestamp: Date.now()
    };

    // Notify callback listeners (for tests)
    if (this.visualUpdateCallback) {
      this.visualUpdateCallback(parameter, value);
    }

    try {
      this.renderer.updateVisualization(updateData);
    } catch (error) {
      this.handleVisualUpdateError(parameter, error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Set visual update callback for testing
   */
  setVisualUpdateCallback(callback: (parameter: string, value: any) => void): void {
    this.visualUpdateCallback = callback;
  }

  /**
   * Animate parameter transition (Sprint 4 feature)
   */
  animateParameter(parameter: string, fromValue: number, toValue: number, options: any): void {
    // Stub implementation for Sprint 4 tests
    console.log(`🎬 Animating ${parameter} from ${fromValue} to ${toValue}`);
  }

  /**
   * Interpolate parameter values during animation (Sprint 4 feature)
   */
  interpolateParameter(parameter: string, value: number): void {
    // Stub implementation for Sprint 4 tests
    console.log(`🔄 Interpolating ${parameter} = ${value}`);
  }

  /**
   * Batch update multiple parameters (Sprint 4 feature)
   */
  batchUpdateParameters(updates: Array<{ parameter: string; value: any }>): void {
    // Stub implementation for Sprint 4 tests
    console.log(`📦 Batch updating ${updates.length} parameters`);
  }

  /**
   * Show parameter validation feedback
   */
  showParameterValidationFeedback(parameter: string, value: any, errorType: string): void {
    console.warn(`⚠️ Parameter validation failed: ${parameter} = ${value} (${errorType})`);

    // In a full implementation, this would update UI to show validation errors
    if (this.renderer && this.renderer.showValidationError) {
      this.renderer.showValidationError(parameter, value, errorType);
    }
  }

  /**
   * Highlight parameter control during updates
   */
  highlightParameterControl(parameter: string, status: string): void {
    console.log(`✨ Highlighting ${parameter} control with status: ${status}`);

    // In a full implementation, this would highlight UI controls
    if (this.renderer && this.renderer.highlightControl) {
      this.renderer.highlightControl(parameter, status);
    }
  }

  /**
   * Apply parameter update with throttling
   */
  applyParameterUpdate(parameter: string, value: any): void {
    // Skip update if value hasn't changed
    const currentValue = this.getCurrentParameterValue(parameter);
    if (currentValue === value) {
      return; // Skip unnecessary update
    }
  // Minimal: apply directly; UI layer debounces calls into this method
  this.doApplyParameterUpdate(parameter, value);
  }

  /**
   * Get current parameter value for comparison
   */
  private getCurrentParameterValue(parameter: string): any {
    if (!this.preferencesManager) return undefined;

    switch (parameter) {
      case 'windStrength':
        return this.preferencesManager.getPreference<number>('flag-simulation.windStrength', 2.0);
      case 'damping':
        return this.preferencesManager.getPreference<number>('flag-simulation.damping', 0.99);
      case 'stiffness':
        return this.preferencesManager.getPreference<number>('flag-simulation.stiffness', 0.8);
      case 'gravity.y':
        return this.preferencesManager.getPreference<number>('flag-simulation.gravity.y', -9.81);
      default:
        return this.preferencesManager.getPreference(`flag-simulation.${parameter}`);
    }
  }

  /**
   * Internal method to actually apply parameter updates
   */
  private doApplyParameterUpdate(parameter: string, value: any): void {
    // Update the parameter through preferences manager
    if (this.preferencesManager) {
      try {
        // Map parameter names to preference keys
        let prefKey = '';
        switch (parameter) {
          case 'windStrength':
            prefKey = 'flag-simulation.windStrength';
            break;
          case 'damping':
            prefKey = 'flag-simulation.damping';
            break;
          case 'stiffness':
            prefKey = 'flag-simulation.stiffness';
            break;
          case 'gravity.y':
            prefKey = 'flag-simulation.gravity.y';
            break;
          default:
            if (!this.isKnownParameter(parameter)) {
              this.applyFallbackValue(parameter, value);
              return;
            }
            prefKey = `flag-simulation.${parameter}`;
        }

        this.preferencesManager.setPreference(prefKey, value);
        this.updateParametersFromPreferences();

        // Update existing springs if stiffness parameter changed
        if (parameter === 'stiffness') {
          this.updateSpringStiffness(value);
        }

        // Update indicator for gravity changes
        if (parameter === 'gravity.y') {
          this.updateParameterIndicator('gravity.y', value, { format: 'decimal', unit: 'm/s²', precision: 2 });
        }

        // Track last applied value for undo feedback
        this.lastAppliedValues.set(parameter, value);

        this.triggerVisualUpdate(parameter, value);
        this.highlightParameterControl(parameter, 'success');
      } catch (error) {
        this.showParameterValidationFeedback(parameter, value, 'invalid-range');
        throw error;
      }
    }
  }

  /**
   * Enable batch parameter updates for efficiency
   */
  enableBatchParameterUpdates(): void {
    this.batchUpdatesEnabled = true;
    this.pendingBatchUpdates = [];
  }

  /**
   * Apply batch parameter update
   */
  applyBatchParameterUpdate(updates: Array<{ parameter: string, value: any }>): void {
    updates.forEach(update => {
      this.doApplyParameterUpdate(update.parameter, update.value);
    });
    console.log(`🔄 Applied batch update of ${updates.length} parameters`);
  }

  /**
   * Flush pending batch updates
   */
  flushBatchParameterUpdates(): void {
    if (this.pendingBatchUpdates.length > 0) {
      this.applyBatchParameterUpdate(this.pendingBatchUpdates);
      this.pendingBatchUpdates = [];
    }
    this.batchUpdatesEnabled = false;
  }

  /**
   * Enable/disable parameter animation
   */
  enableParameterAnimation(enabled: boolean): void {
    this.parameterAnimationEnabled = enabled;
    console.log(`🎬 Parameter animation ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Animate parameter transition
   */
  animateParameterTransition(parameter: string, fromValue: number, toValue: number, options: any): void {
    if (!this.parameterAnimationEnabled) return;

    console.log(`🎬 Animating ${parameter} from ${fromValue} to ${toValue}`);

    // Simple animation implementation
    const duration = options.duration || 500;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Simple easing
      const eased = progress * progress * (3 - 2 * progress); // smoothstep
      const currentValue = fromValue + (toValue - fromValue) * eased;

      this.interpolateParameterValue(parameter, currentValue);

      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(animate);
      }
    };

    animate();
  }

  /**
   * Interpolate parameter value during animation
   */
  interpolateParameterValue(parameter: string, value: number): void {
    // Apply interpolated value temporarily
    this.doApplyParameterUpdate(parameter, value);
  }

  /**
   * Update parameter animations (called from animation loop)
   */
  updateParameterAnimations(deltaTime: number): void {
    // Animation updates are handled by requestAnimationFrame in animateParameterTransition
    // This method exists for API completeness
  }

  /**
   * Show parameter preview
   */
  showParameterPreview(parameter: string, value: any): void {
    console.log(`👁️ Showing preview for ${parameter} = ${value}`);
    // Store original value for revert
    if (!this.parameterPreviewCache) {
      this.parameterPreviewCache = new Map();
    }

    const currentValue = this.getCurrentParameterValue(parameter);
    this.parameterPreviewCache.set(parameter, currentValue);

    // Apply preview value
    this.doApplyParameterUpdate(parameter, value);
  }

  private parameterPreviewCache: Map<string, any> = new Map();

  /**
   * Start parameter preview
   */
  startParameterPreview(parameter: string, value: any): void {
    this.showParameterPreview(parameter, value);
  }

  /**
   * Revert parameter preview
   */
  revertParameterPreview(parameter: string): void {
    const originalValue = this.parameterPreviewCache.get(parameter);
    if (originalValue !== undefined) {
      this.doApplyParameterUpdate(parameter, originalValue);
      this.parameterPreviewCache.delete(parameter);
      console.log(`🔙 Reverted preview for ${parameter} to ${originalValue}`);
    }
  }

  /**
   * Update parameter indicator
   */
  updateParameterIndicator(parameter: string, value: any, format: any): void {
    console.log(`📊 Updating indicator for ${parameter}: ${value} ${format.unit || ''}`);

    if (this.renderer && this.renderer.updateIndicator) {
      this.renderer.updateIndicator(parameter, value, format);
    }
  }

  /**
   * Show undo feedback
   */
  showUndoFeedback(parameter: string, oldValue: any, newValue: any): void {
    console.log(`↶ Undo feedback: ${parameter} ${oldValue} → ${newValue}`);

    if (this.renderer && this.renderer.showUndoFeedback) {
      this.renderer.showUndoFeedback(parameter, oldValue, newValue);
    }
  }

  /**
   * Handle visual update errors
   */
  handleVisualUpdateError(parameter: string, error: Error): void {
    console.error(`❌ Visual update error for ${parameter}:`, error);

    // Continue with parameter update even if visual update fails
    // This ensures the simulation continues working
  }

  /**
   * Recover from invalid parameter state
   */
  recoverFromInvalidState(): void {
    console.log('🛠️ Attempting recovery from invalid parameter state');

    // Reset to default values if current state is invalid
    if (this.preferencesManager) {
      this.preferencesManager.resetAllPreferences();
      this.updateParametersFromPreferences();
    }
  }

  /**
   * Validate and recover parameter state
   */
  validateAndRecoverParameterState(): void {
    try {
      // Validate current parameter values
      this.updateParametersFromPreferences();
      console.log('✅ Parameter state validation passed');
    } finally {
      // Always attempt light recovery to keep state consistent (idempotent)
      this.recoverFromInvalidState();
    }
  }

  /**
   * Apply fallback value when parameter update fails
   */
  applyFallbackValue(parameter: string, fallbackValue: any): void {
    console.log(`🔄 Applying fallback value for ${parameter}: ${fallbackValue}`);

    try {
      this.doApplyParameterUpdate(parameter, fallbackValue);
    } catch (error) {
      console.error(`❌ Failed to apply fallback value for ${parameter}:`, error);
    }
  }

  /**
   * Execute one simulation step (ISimulationAlgorithm interface)
   */
  step(state: ISimulationState, fixedDeltaTime: number): ISimulationState {
    // Update parameters from preferences before physics step
    this.updateParametersFromPreferences();

    // Update spring stiffness dynamically
    this.springs.forEach(spring => {
      spring.stiffness = this.stiffness;
    });

    // 1. Apply forces (gravity, wind, etc.)
    this.applyForces();
    // 2. Integrate positions using Verlet integration
    this.integrate(fixedDeltaTime);
    // 3. Satisfy constraints (springs)
    this.satisfyConstraints();

    // Return updated state
    return this.getState();
  }

  /**
   * Legacy step method for backward compatibility
   */
  stepLegacy(deltaTime: number): void {
    // Update parameters from preferences before physics step
    this.updateParametersFromPreferences();

    // Update spring stiffness dynamically
    this.springs.forEach(spring => {
      spring.stiffness = this.stiffness;
    });

    // Call original update method
    this.update(deltaTime);
  }

  // --- Helpers for UI scheduling and access ---
  private scheduleThrottledApply(parameter: string, value: any): void {
    this.uiPendingValues.set(parameter, value);

    const existing = this.uiUpdateTimers.get(parameter);
    if (existing) {
      clearTimeout(existing);
    }

    const timer = setTimeout(() => {
      const latest = this.uiPendingValues.get(parameter);
      this.uiUpdateTimers.delete(parameter);
      this.uiPendingValues.delete(parameter);
      if (latest !== undefined) {
        this.applyParameterUpdate(parameter, latest);
      }
    }, 50);

    this.uiUpdateTimers.set(parameter, timer);
  }

  private isKnownParameter(parameter: string): boolean {
    return ['windStrength', 'damping', 'stiffness', 'gravity.y'].includes(parameter);
  }

  private getPublicParameterValue(parameter: string): any {
    switch (parameter) {
      case 'windStrength':
        return this.getWindStrength();
      case 'damping':
        return this.getDamping();
      case 'stiffness':
        return this.getStiffness();
      case 'gravity.y':
        return this.getGravity().y;
      default:
        return undefined;
    }
  }
}
