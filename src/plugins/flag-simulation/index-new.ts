import {
  ISimulationPlugin,
  ISimulationAlgorithm,
  ISimulationRenderer,
  IParameterDefinition,
  ISimulationUI,
  IGraphConfig,
  IPluginContext
} from "../../core/simulation/interfaces";
import { FlagClothAlgorithm } from "./FlagClothAlgorithm";
import { FlagRenderer } from "./FlagRenderer";
import { FlagComponent } from "./FlagComponent";
import { PoleComponent } from "./PoleComponent";
import { PositionComponent } from "../../core/components/PositionComponent";
import { RenderableComponent } from "../../core/components/RenderableComponent";
import { SelectableComponent } from "../../core/components/SelectableComponent";
import { RotationComponent } from "../../core/components/RotationComponent";
import { FlagPhysicsInitializer } from "./utils/FlagPhysicsInitializer";

/**
 * Flag Simulation Plugin - New Architecture
 * 
 * Complete plugin implementing the enhanced ISimulationPlugin interface
 * with proper algorithm/renderer separation and parameter management.
 */
export class FlagSimulationPlugin implements ISimulationPlugin {
  readonly name = "Flag Cloth Simulation";
  readonly version = "1.0.0";
  readonly description = "Realistic flag cloth physics using Verlet integration";
  readonly dependencies: readonly string[] = [];

  private algorithm: FlagClothAlgorithm;
  private renderer: FlagRenderer;
  private context: IPluginContext | null = null;

  constructor() {
    this.algorithm = new FlagClothAlgorithm();
    this.renderer = new FlagRenderer();
  }

  /**
   * Get simulation algorithm
   */
  getAlgorithm(): ISimulationAlgorithm {
    return this.algorithm;
  }

  /**
   * Get simulation renderer
   */
  getRenderer(): ISimulationRenderer {
    return this.renderer;
  }

  /**
   * Get parameter definitions
   */
  getParameters(): IParameterDefinition[] {
    return [
      {
        name: 'stiffness',
        type: 'number',
        defaultValue: 0.8,
        constraints: { min: 0.1, max: 1.0, step: 0.01 },
        category: 'physics',
        description: 'Cloth structural stiffness coefficient',
        units: 'dimensionless'
      },
      {
        name: 'damping',
        type: 'number',
        defaultValue: 0.99,
        constraints: { min: 0.8, max: 0.999, step: 0.001 },
        category: 'physics',
        description: 'Velocity damping factor',
        units: 'dimensionless'
      },
      {
        name: 'windStrength',
        type: 'number',
        defaultValue: 0.1,
        constraints: { min: 0, max: 2.0, step: 0.01 },
        category: 'physics',
        description: 'Wind force magnitude',
        units: 'N/m²'
      },
      {
        name: 'windDirection',
        type: 'vector',
        defaultValue: { x: 1, y: 0, z: 0 },
        constraints: { min: -1, max: 1, step: 0.1 },
        category: 'physics',
        description: 'Wind force direction vector',
        units: 'normalized'
      },
      {
        name: 'gravity',
        type: 'vector',
        defaultValue: { x: 0, y: -9.81, z: 0 },
        constraints: { min: -20, max: 20, step: 0.1 },
        category: 'physics',
        description: 'Gravity acceleration vector',
        units: 'm/s²'
      },
      {
        name: 'flagColor',
        type: 'color',
        defaultValue: '#ff0000',
        category: 'visual',
        description: 'Flag cloth color'
      },
      {
        name: 'flagOpacity',
        type: 'number',
        defaultValue: 0.8,
        constraints: { min: 0.1, max: 1.0, step: 0.05 },
        category: 'visual',
        description: 'Flag cloth transparency'
      },
      {
        name: 'showWireframe',
        type: 'boolean',
        defaultValue: false,
        category: 'visual',
        description: 'Show wireframe overlay'
      },
      {
        name: 'poleColor',
        type: 'color',
        defaultValue: '#8B4513',
        category: 'visual',
        description: 'Pole material color'
      }
    ];
  }

  /**
   * Get UI components (placeholder for now)
   */
  getUI(): ISimulationUI[] {
    return []; // Will implement custom UI components later
  }

  /**
   * Get graph configurations
   */
  getGraphs(): IGraphConfig[] {
    return [
      {
        id: 'flag-physics-metrics',
        title: 'Flag Physics Metrics',
        type: 'line',
        datasets: [
          { label: 'Wind Force', color: '#FF6384' },
          { label: 'Avg Vertex Velocity', color: '#36A2EB' },
          { label: 'Constraint Violations', color: '#FFCE56' }
        ],
        maxDataPoints: 500,
        updateFrequency: 60 // 60 FPS
      }
    ];
  }

  /**
   * Register plugin with enhanced context
   */
  register(context: IPluginContext): void {
    this.context = context;

    try {
      // 1. Register ECS components
      this.registerComponents(context);

      // 2. Register algorithm with simulation manager
      context.simulationManager.registerAlgorithm(this.algorithm);
      
      // Set world reference for algorithm
      if ('setWorld' in this.algorithm) {
        (this.algorithm as any).setWorld(context.world);
      }

      // 3. Register renderer with render manager  
      context.renderManager.registerRenderer(this.renderer);
      
      // Set world reference for renderer
      if ('setWorld' in this.renderer) {
        (this.renderer as any).setWorld(context.world);
      }

      // 4. Register parameters with parameter manager
      this.getParameters().forEach(param => {
        context.parameterManager.registerParameter(this.name, param);
      });

      // 5. Register graphs with graph manager
      this.getGraphs().forEach(graph => {
        context.graphManager.registerGraph(this.name, graph);
      });

      // 6. Register UI components with UI manager
      this.getUI().forEach(ui => {
        context.uiManager.registerUI(ui);
      });

      // 7. Initialize demo entities
      this.initializeEntities(context);

      // 8. Set up parameter change listener
      if (context.globalStore) {
        context.globalStore.subscribe((newState: any, prevState: any, action: any) => {
          if (action?.type === 'PARAMETER_CHANGED' && 
              action?.payload?.algorithmName === this.name) {
            this.onParameterChanged(
              action.payload.algorithmName,
              action.payload.paramName,
              action.payload.value
            );
          }
        });
      }

      context.logger?.log(`✅ ${this.name} plugin registered successfully`);

    } catch (error) {
      context.logger?.error(`❌ Failed to register ${this.name} plugin:`, error);
      throw error;
    }
  }

  /**
   * Unregister plugin
   */
  unregister(context: IPluginContext): void {
    try {
      // Clean unregistration in reverse order
      context.graphManager?.unregisterGraphs(this.name);
      
      this.getUI().forEach(ui => {
        context.uiManager?.unregisterUI(ui);
      });
      
      context.parameterManager?.unregisterParameters(this.name);
      context.renderManager?.unregisterRenderer(this.algorithm.name);
      context.simulationManager?.unregisterAlgorithm(this.algorithm.name);

      context.logger?.log(`🗑️ ${this.name} plugin unregistered`);

    } catch (error) {
      context.logger?.error(`❌ Failed to unregister ${this.name} plugin:`, error);
    } finally {
      this.context = null;
    }
  }

  /**
   * Handle parameter changes
   */
  onParameterChanged(algorithmName: string, paramName: string, value: any): void {
    if (algorithmName !== this.name) return;

    try {
      // Separate physics and visual parameters
      const visualParameters = ['flagColor', 'flagOpacity', 'showWireframe', 'poleColor'];
      
      if (visualParameters.includes(paramName)) {
        // Update renderer visual parameters
        this.renderer.updateVisualParameters({ [paramName]: value });
      } else {
        // Update algorithm physics parameters
        this.algorithm.configure({ [paramName]: value });
      }

      // Optional: Record parameter change in graphs
      // if (this.context?.graphManager) {
      //   this.context.graphManager.recordParameterChange?.(algorithmName, paramName, value);
      // }

      console.log(`⚙️ ${this.name} parameter updated: ${paramName} = ${value}`);

    } catch (error) {
      this.context?.logger?.error(`❌ Failed to update parameter ${paramName}:`, error);
    }
  }

  // Private helper methods

  private registerComponents(context: IPluginContext): void {
    // Register plugin-specific components
    if ('registerComponent' in context.world) {
      (context.world as any).registerComponent(FlagComponent);
      (context.world as any).registerComponent(PoleComponent);
    } else if ('componentManager' in context.world) {
      (context.world as any).componentManager.registerComponent(FlagComponent);
      (context.world as any).componentManager.registerComponent(PoleComponent);
    }

    // Register core components needed by this plugin
    // Note: These might already be registered by core, but it's safe to re-register
    const coreComponents = [
      PositionComponent,
      RenderableComponent, 
      SelectableComponent,
      RotationComponent
    ];

    coreComponents.forEach(ComponentClass => {
      try {
        if ('registerComponent' in context.world) {
          (context.world as any).registerComponent(ComponentClass);
        } else if ('componentManager' in context.world) {
          (context.world as any).componentManager.registerComponent(ComponentClass);
        }
      } catch (error) {
        // Ignore if already registered
      }
    });
  }

  private initializeEntities(context: IPluginContext): void {
    try {
      // Configure camera for flag simulation
      this.configureCamera(context);

      // Create default pole entity
      const poleEntity = this.createEntity(context);
      this.addComponent(context, poleEntity, PositionComponent.type, 
        new PositionComponent(0, 0, 0));
      this.addComponent(context, poleEntity, PoleComponent.type, 
        new PoleComponent({ height: 20, radius: 0.2 }));

      // Create flag entity
      const flagEntity = this.createEntity(context);
      this.addComponent(context, flagEntity, PositionComponent.type, 
        new PositionComponent(0, 10, 0));
      this.addComponent(context, flagEntity, RenderableComponent.type, 
        new RenderableComponent("plane", "#ff0000"));

      const initialFlagComponent = new FlagComponent(
        10, 6, 10, 6, 0.1, 0.5, 0.05, "", poleEntity,
        { x: 1, y: 0, z: 0 }, { x: 0, y: -9.81, z: 0 }, undefined, "left"
      );

      this.addComponent(context, flagEntity, FlagComponent.type, initialFlagComponent);
      this.addComponent(context, flagEntity, SelectableComponent.type, 
        new SelectableComponent(false));

      // Initialize flag physics
      if (context.world && 'componentManager' in context.world) {
        FlagPhysicsInitializer.initializeFlag(
          initialFlagComponent,
          this.getComponent(context, flagEntity, PositionComponent.type) as PositionComponent,
          context.world as any
        );
      }

      // Initialize algorithm with entities
      this.algorithm.initialize([flagEntity, poleEntity]);

      context.logger?.log("🎌 Flag simulation entities initialized");

    } catch (error) {
      context.logger?.error("❌ Failed to initialize flag entities:", error);
    }
  }

  private configureCamera(context: IPluginContext): void {
    try {
      if (context.cameraManager) {
        context.cameraManager.setPosition({ x: 0, y: 30, z: 60 });
        context.cameraManager.setTarget({ x: 0, y: 0, z: 0 });
        context.cameraManager.setFOV(45);
      }
    } catch (error) {
      context.logger?.warn("⚠️ Failed to configure camera:", error);
    }
  }

  // ECS helper methods (adapters for different world interfaces)
  private createEntity(context: IPluginContext): number {
    if ('createEntity' in context.world) {
      return (context.world as any).createEntity();
    } else if ('entityManager' in context.world) {
      return (context.world as any).entityManager.createEntity();
    }
    throw new Error('Unable to create entity: unknown world interface');
  }

  private addComponent(context: IPluginContext, entityId: number, componentType: string, component: any): void {
    if ('addComponent' in context.world) {
      (context.world as any).addComponent(entityId, componentType, component);
    } else if ('componentManager' in context.world) {
      (context.world as any).componentManager.addComponent(entityId, componentType, component);
    } else {
      throw new Error('Unable to add component: unknown world interface');
    }
  }

  private getComponent(context: IPluginContext, entityId: number, componentType: string): any {
    if ('getComponent' in context.world) {
      return (context.world as any).getComponent(entityId, componentType);
    } else if ('componentManager' in context.world) {
      return (context.world as any).componentManager.getComponent(entityId, componentType);
    }
    return null;
  }
}

// Backward compatibility exports
export { FlagComponent, PoleComponent, FlagClothAlgorithm, FlagRenderer };
