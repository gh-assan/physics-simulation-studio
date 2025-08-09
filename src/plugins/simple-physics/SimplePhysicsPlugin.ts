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
import { PositionComponent } from '../../core/components/PositionComponent';
import { RenderableComponent } from '../../core/components/RenderableComponent';
import * as THREE from 'three';

/**
 * Enhanced Simple Physics Algorithm
 *
 * This demonstrates a clean physics implementation with proper
 * entity state management and mesh creation integration.
 */
class SimplePhysicsAlgorithm implements ISimulationAlgorithm {
  readonly name = 'simple-physics';
  readonly version = '1.0.0';

  private gravity = -9.81;
  private damping = 0.98;
  private bounciness = 0.7;
  private entityStates = new Map<EntityId, { x: number; y: number; vx: number; vy: number }>();
  private world: any; // IWorld reference

  step(state: ISimulationState, fixedDeltaTime: number): ISimulationState {
    // Simple physics: gravity + damping + position component integration
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

      // Simple ground collision with improved bouncing
      if (entityState.y < 0) {
        entityState.y = 0;
        entityState.vy = -entityState.vy * this.bounciness;
      }

      // Update the ECS PositionComponent if available
      if (this.world && this.world.componentManager) {
        const positionComponent = this.world.componentManager.getComponent(
          entityId, PositionComponent.type
        ) as PositionComponent;

        if (positionComponent) {
          positionComponent.x = entityState.x;
          positionComponent.y = entityState.y;
          positionComponent.z = 0; // Keep Z at 0 for 2D-like physics
        }
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
          {
            // Convert metadata for Node.js 8 compatibility
            ...(() => {
              const metadataObj: Record<string, any> = {};
              for (const [key, value] of state.metadata) {
                metadataObj[key] = value;
              }
              return metadataObj;
            })(),
            'physics-step': state.time
          }
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

  setWorld(world: any): void {
    this.world = world;
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
 * Enhanced Simple Physics Renderer
 *
 * This renderer creates and manages THREE.js meshes for physics entities.
 * Meshes are created by the simulation itself, demonstrating the new architecture.
 */
class SimplePhysicsRenderer implements ISimulationRenderer {
  readonly algorithmName = 'simple-physics';
  readonly rendererType = 'physics-spheres';

  private meshes = new Map<EntityId, THREE.Mesh>();
  private world: any; // IWorld reference

  constructor(world: any) {
    this.world = world;
  }

  canRender(entities: EntityId[]): boolean {
    return entities.length > 0;
  }

  render(entities: EntityId[], context: IRenderContext): void {
    // Render physics entities with proper mesh management
    for (const entityId of entities) {
      let mesh = this.meshes.get(entityId);

      // Create mesh if it doesn't exist - simulation creates its own meshes!
      if (!mesh) {
        mesh = this.createEntityMesh(entityId, context);
        this.meshes.set(entityId, mesh);
        console.log(`🎨 Simple Physics: Created mesh for entity ${entityId}`);
      }

      // Update mesh position from ECS PositionComponent
      this.updateMeshFromECS(entityId, mesh);
    }

    // Clean up meshes for entities that no longer exist
    this.cleanupUnusedMeshes(entities, context);
  }

  private createEntityMesh(entityId: EntityId, context: IRenderContext): THREE.Mesh {
    // Create colorful bouncing spheres
    const geometry = new THREE.SphereGeometry(0.2, 16, 16);

    // Give each entity a unique color based on its ID
    const hue = (entityId * 137.508) % 360; // Golden angle distribution
    const color = new THREE.Color().setHSL(hue / 360, 0.7, 0.6);

    const material = new THREE.MeshLambertMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);

    // Add mesh to scene
    context.scene.add(mesh);

    return mesh;
  }

  private updateMeshFromECS(entityId: EntityId, mesh: THREE.Mesh): void {
    // Get position from ECS PositionComponent
    if (this.world && this.world.componentManager) {
      const positionComponent = this.world.componentManager.getComponent(
        entityId, PositionComponent.type
      ) as PositionComponent;

      if (positionComponent) {
        mesh.position.set(
          positionComponent.x,
          positionComponent.y,
          positionComponent.z
        );
      }
    }
  }

  private cleanupUnusedMeshes(currentEntities: EntityId[], context: IRenderContext): void {
    const currentEntitySet = new Set(currentEntities);

    for (const [entityId, mesh] of this.meshes) {
      if (!currentEntitySet.has(entityId)) {
        // Remove from scene and dispose
        context.scene.remove(mesh);
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
        this.meshes.delete(entityId);
        console.log(`🧹 Simple Physics: Cleaned up mesh for entity ${entityId}`);
      }
    }
  }

  updateVisualParameters(parameters: Record<string, any>): void {
    if (parameters.sphereColor !== undefined) {
      // Update all sphere colors
      for (const mesh of this.meshes.values()) {
        (mesh.material as THREE.MeshLambertMaterial).color.setHex(parameters.sphereColor);
      }
    }
  }

  clear(): void {
    for (const [entityId, mesh] of this.meshes) {
      if (mesh.parent) {
        mesh.parent.remove(mesh);
      }
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
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
  private renderer: SimplePhysicsRenderer | null = null;
  private ui = new SimpleUI();

  getAlgorithm(): ISimulationAlgorithm {
    return this.algorithm;
  }

  getRenderer(): ISimulationRenderer {
    if (!this.renderer) {
      throw new Error('Renderer not initialized. Call register() first.');
    }
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
    // Initialize renderer with world reference
    this.renderer = new SimplePhysicsRenderer(context.world);
    this.algorithm.setWorld(context.world);

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

  async initializeEntities(world: any): Promise<void> {
    try {
      console.log('🎯 Simple Physics: Creating entities with meshes');

      // Create 3 bouncing physics entities
      const numEntities = 3;

      for (let i = 0; i < numEntities; i++) {
        // Create entity
        const entityId = world.createEntity();

        // Add PositionComponent with random starting positions
        const positionComponent = new PositionComponent(
          Math.random() * 10 - 5,  // x: -5 to 5
          Math.random() * 5 + 2,   // y: 2 to 7 (above ground)
          0,                       // z: 0 (2D physics)
          'simple-physics'         // simulationType
        );
        world.addComponent(entityId, PositionComponent.type, positionComponent);

        // Add RenderableComponent - though mesh creation is now handled by renderer
        const renderableComponent = new RenderableComponent(
          'sphere',
          `hsl(${(i * 120) % 360}, 70%, 60%)` // Different colors
        );
        world.addComponent(entityId, RenderableComponent.type, renderableComponent);

        console.log(`✨ Simple Physics: Created entity ${entityId} with components`);
      }

      console.log(`🎯 Simple Physics: Initialized ${numEntities} bouncing entities`);

    } catch (error) {
      console.error('❌ Simple Physics: Failed to initialize entities:', error);
    }
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
