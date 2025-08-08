import {
  ISimulationPlugin,
  ISimulationAlgorithm,
  ISimulationRenderer,
  IParameterDefinition,
  ISimulationUI,
  IGraphConfig,
  IPluginContext,
  ISimulationState,
  IRenderContext,
  EntityId
} from '../../core/simulation/interfaces';
import { SimulationState } from '../../core/simulation/SimulationState';

/**
 * Simple Physics Algorithm Example
 * 
 * This demonstrates a clean, simple physics implementation
 * following the new architecture principles.
 */
class SimplePhysicsAlgorithm implements ISimulationAlgorithm {
  readonly name = 'simple-physics';
  readonly version = '1.0.0';

  private gravity = -9.81;
  private damping = 0.98;
  private entityStates = new Map<EntityId, { x: number; y: number; vx: number; vy: number }>();

  step(state: ISimulationState, fixedDeltaTime: number): ISimulationState {
    // Simple physics: gravity + damping
    for (const entityId of state.entities) {
      const entityState = this.getOrCreateEntityState(entityId);
      
      // Apply gravity
      entityState.vy += this.gravity * fixedDeltaTime;
      
      // Apply damping
      entityState.vx *= this.damping;
      entityState.vy *= this.damping;
      
      // Update position
      entityState.x += entityState.vx * fixedDeltaTime;
      entityState.y += entityState.vy * fixedDeltaTime;
      
      // Simple ground collision
      if (entityState.y < 0) {
        entityState.y = 0;
        entityState.vy = -entityState.vy * 0.7; // Bounce with energy loss
      }
    }

    // Return updated state with physics metadata
    return state instanceof SimulationState 
      ? state.withAddedMetadata('physics-step', state.time)
      : SimulationState.create(
          Array.from(state.entities),
          state.time,
          state.deltaTime,
          state.isRunning,
          { ...Object.fromEntries(state.metadata), 'physics-step': state.time }
        );
  }

  configure(parameters: Record<string, any>): void {
    if (parameters.gravity !== undefined) {
      this.gravity = parameters.gravity;
    }
    if (parameters.damping !== undefined) {
      this.damping = Math.max(0, Math.min(1, parameters.damping));
    }
  }

  initialize(entities: EntityId[]): void {
    this.entityStates.clear();
    
    // Initialize with random positions/velocities for demo
    for (const entityId of entities) {
      this.entityStates.set(entityId, {
        x: Math.random() * 10 - 5,
        y: Math.random() * 5 + 2,
        vx: Math.random() * 4 - 2,
        vy: Math.random() * 2
      });
    }
    
    console.log(`🎯 Simple physics initialized with ${entities.length} entities`);
  }

  dispose(): void {
    this.entityStates.clear();
  }

  getParameters(): Record<string, any> {
    return { gravity: this.gravity, damping: this.damping };
  }

  validateParameter(paramName: string, value: any): true | string {
    switch (paramName) {
      case 'gravity':
        return typeof value === 'number' ? true : 'Gravity must be a number';
      case 'damping':
        return typeof value === 'number' && value >= 0 && value <= 1 
          ? true : 'Damping must be a number between 0 and 1';
      default:
        return `Unknown parameter: ${paramName}`;
    }
  }

  private getOrCreateEntityState(entityId: EntityId) {
    if (!this.entityStates.has(entityId)) {
      this.entityStates.set(entityId, { x: 0, y: 0, vx: 0, vy: 0 });
    }
    return this.entityStates.get(entityId)!;
  }
}

/**
 * Simple Renderer Example
 */
class SimpleRenderer implements ISimulationRenderer {
  readonly algorithmName = 'simple-physics';
  readonly rendererType = 'sphere';

  private meshes = new Map<EntityId, any>();

  canRender(entities: EntityId[]): boolean {
    return entities.length > 0;
  }

  render(entities: EntityId[], context: IRenderContext): void {
    // Simple sphere rendering (placeholder - would use actual 3D library)
    for (const entityId of entities) {
      let mesh = this.meshes.get(entityId);
      
      if (!mesh) {
        // Create new sphere mesh (pseudo-code)
        mesh = context.createMesh(
          { type: 'sphere', radius: 0.1 },
          { color: 0x0077ff }
        );
        this.meshes.set(entityId, mesh);
      }
      
      // Update mesh position from physics state
      // This would read from ECS components in real implementation
      mesh.position.x = Math.sin(context.time + entityId) * 2;
      mesh.position.y = Math.cos(context.time + entityId) * 2;
    }
  }

  updateVisualParameters(parameters: Record<string, any>): void {
    if (parameters.color !== undefined) {
      // Update mesh colors
      for (const mesh of this.meshes.values()) {
        mesh.material.color = parameters.color;
      }
    }
  }

  clear(): void {
    for (const [entityId, mesh] of this.meshes) {
      // Remove from scene (pseudo-code)
      if (mesh.parent) {
        mesh.parent.remove(mesh);
      }
    }
    this.meshes.clear();
  }

  dispose(): void {
    this.clear();
  }
}

/**
 * Simple UI Example
 */
class SimpleUI implements ISimulationUI {
  readonly algorithmName = 'simple-physics';
  readonly title = 'Simple Physics';
  readonly category = 'parameters';

  private panel: HTMLElement | null = null;

  createPanel(container: HTMLElement): void {
    this.panel = document.createElement('div');
    this.panel.innerHTML = `
      <h3>Simple Physics Parameters</h3>
      <div>
        <label>Gravity: <input type="number" id="gravity" step="0.1" value="-9.81"></label>
      </div>
      <div>
        <label>Damping: <input type="number" id="damping" step="0.01" min="0" max="1" value="0.98"></label>
      </div>
    `;
    
    container.appendChild(this.panel);
  }

  update(values: Record<string, any>): void {
    if (!this.panel) return;
    
    const gravityInput = this.panel.querySelector('#gravity') as HTMLInputElement;
    const dampingInput = this.panel.querySelector('#damping') as HTMLInputElement;
    
    if (gravityInput && values.gravity !== undefined) {
      gravityInput.value = values.gravity.toString();
    }
    
    if (dampingInput && values.damping !== undefined) {
      dampingInput.value = values.damping.toString();
    }
  }

  destroy(): void {
    if (this.panel) {
      this.panel.remove();
      this.panel = null;
    }
  }
}

/**
 * Complete Clean Architecture Plugin Example
 */
export class SimplePhysicsPlugin implements ISimulationPlugin {
  readonly name = 'simple-physics';
  readonly version = '1.0.0';
  readonly description = 'Simple physics simulation with gravity and damping';
  readonly dependencies: readonly string[] = [];

  private algorithm = new SimplePhysicsAlgorithm();
  private renderer = new SimpleRenderer();
  private ui = new SimpleUI();

  getAlgorithm(): ISimulationAlgorithm {
    return this.algorithm;
  }

  getRenderer(): ISimulationRenderer {
    return this.renderer;
  }

  getParameters(): IParameterDefinition[] {
    return [
      {
        name: 'gravity',
        type: 'number',
        defaultValue: -9.81,
        category: 'physics',
        constraints: { min: -50, max: 50, step: 0.1 },
        description: 'Gravitational acceleration',
        units: 'm/s²'
      },
      {
        name: 'damping',
        type: 'number',
        defaultValue: 0.98,
        category: 'physics',
        constraints: { min: 0, max: 1, step: 0.01 },
        description: 'Velocity damping factor',
        units: 'dimensionless'
      }
    ];
  }

  getUI(): ISimulationUI[] {
    return [this.ui];
  }

  getGraphs(): IGraphConfig[] {
    return [
      {
        id: 'simple-physics-energy',
        title: 'Energy Conservation',
        type: 'line',
        datasets: [
          { label: 'Kinetic Energy', color: '#FF6384' },
          { label: 'Potential Energy', color: '#36A2EB' },
          { label: 'Total Energy', color: '#FFCE56' }
        ],
        maxDataPoints: 300,
        updateFrequency: 30
      }
    ];
  }

  register(context: IPluginContext): void {
    // 1. Register algorithm
    context.simulationManager.registerAlgorithm(this.algorithm);
    
    // 2. Register renderer
    context.renderManager.registerRenderer(this.renderer);
    
    // 3. Register parameters
    for (const param of this.getParameters()) {
      context.parameterManager.registerParameter(this.name, param);
    }
    
    // 4. Register UI
    context.uiManager.registerUI(this.ui);
    
    // 5. Register graphs
    for (const graph of this.getGraphs()) {
      context.graphManager.registerGraph(this.name, graph);
    }
    
    // 6. Set up parameter change listener
    context.parameterManager.addParameterChangeListener(
      this.name,
      this.onParameterChanged.bind(this)
    );
    
    context.logger.log(`✅ ${this.name} plugin registered successfully`);
  }

  unregister(context: IPluginContext): void {
    // Clean unregistration in reverse order
    context.graphManager.unregisterGraphs(this.name);
    context.uiManager.unregisterUI(this.ui);
    context.parameterManager.unregisterParameters(this.name);
    context.renderManager.unregisterRenderer(this.algorithm.name);
    context.simulationManager.unregisterAlgorithm(this.algorithm.name);
    
    context.logger.log(`🗑️ ${this.name} plugin unregistered`);
  }

  onParameterChanged(algorithmName: string, paramName: string, value: any): void {
    if (algorithmName !== this.name) return;
    
    // Update algorithm configuration
    this.algorithm.configure({ [paramName]: value });
    
    console.log(`⚙️ Parameter changed: ${paramName} = ${value}`);
  }
}
