import { ISimulationPlugin } from '../../core/plugin/ISimulationPlugin';
import { PluginParameterSchema } from '../../core/ui/PluginParameterManager';
import { IWorld } from '../../core/ecs/IWorld';
import { IStudio } from '../../studio/IStudio';
import { ISystem } from '../../core/ecs/ISystem';
import { FlagClothAlgorithm } from './FlagClothAlgorithm';

class FlagSimulationPlugin implements ISimulationPlugin {
  private algorithm: FlagClothAlgorithm;
  private registeredRenderer: any = null;
  private renderSystem: any = null;

  constructor() {
    this.algorithm = new FlagClothAlgorithm();
  }

  getName(): string {
    return "flag-simulation";
  }

  getDependencies(): string[] {
    return [];
  }

  register(world: IWorld): void {
    console.log("Registering Flag Simulation Plugin");

    // Import and register components with the world
    Promise.all([
      import('./FlagComponent'),
      import('../../core/components/PositionComponent')
    ]).then(([{ FlagComponent }, { PositionComponent }]) => {
      // Register components with the component manager
      if (world.componentManager && world.componentManager.registerComponent) {
        try {
          world.componentManager.registerComponent(FlagComponent);
          console.log("✅ FlagComponent registered during plugin registration");
        } catch (error) {
          console.log("FlagComponent already registered:", (error as Error).message);
        }

        try {
          world.componentManager.registerComponent(PositionComponent);
          console.log("✅ PositionComponent registered during plugin registration");
        } catch (error) {
          console.log("PositionComponent already registered:", (error as Error).message);
        }
      }
    }).catch(error => {
      console.error("❌ Error registering components:", error);
    });
  }

  unregister(): void {
    console.log("Unregistering Flag Simulation Plugin");

    // Clean up renderer when plugin is unregistered
    this.unregisterRenderer();
  }

  async initializeEntities(world: IWorld): Promise<void> {
    // Initialize flag entities in the world
    console.log('Initializing flag entities');

    // We need to register components first - let's import them synchronously
    const [{FlagComponent}, {PositionComponent}] = await Promise.all([
      import('./FlagComponent'),
      import('../../core/components/PositionComponent'),
    ]);

    // Register components with the component manager first
    if (world.componentManager && world.componentManager.registerComponent) {
      try {
        world.componentManager.registerComponent(FlagComponent);
        console.log("✅ FlagComponent registered");
      } catch (error) {
        console.log("FlagComponent already registered or registration failed:", (error as Error).message);
      }

      try {
        world.componentManager.registerComponent(PositionComponent);
        console.log("✅ PositionComponent registered");
      } catch (error) {
        console.log("PositionComponent already registered or registration failed:", (error as Error).message);
      }
    }

    // Create flag entity
    const flagEntity = world.createEntity();

    // Add flag component with default parameters
    const flagComponent = new FlagComponent(
      3,    // width
      2,    // height
      20,   // segmentsX
      15,   // segmentsY
      0.1,  // mass
      0.3,  // stiffness
      0.99, // damping
      "",   // textureUrl
      0,    // poleEntityId
      { x: 0.5, y: 0, z: 0 }, // windDirection
      { x: 0, y: -9.81, z: 0 } // gravity
    );

    world.componentManager.addComponent(flagEntity, FlagComponent.type, flagComponent);

    // Add position component
    const positionComponent = new PositionComponent(0, 2, 0, "flag-simulation");
    world.componentManager.addComponent(flagEntity, PositionComponent.type, positionComponent);

    console.log("✅ Flag entity created with ID:", flagEntity);

    // 🎯 RENDERER REGISTRATION: Now handled by Studio.loadSimulation() orchestrator
    // when this specific simulation is selected, not during plugin initialization
    await this.registerRendererIfActive(world);

    console.log("✅ Flag entities initialized");
  }

  /**
   * Register renderer when this simulation is specifically loaded/activated
   * This should be called by Studio.loadSimulation() orchestrator
   */
  public async registerRenderer(world: IWorld): Promise<void> {
    await this.autoDiscoverAndRegisterRenderer(world);
  }

  /**
   * Unregister renderer when simulation is unloaded/deactivated
   */
  public unregisterRenderer(): void {
    if (this.renderSystem && this.registeredRenderer) {
      // Unregister renderer from SimplifiedRenderSystem
      if (typeof this.renderSystem.unregisterRenderer === 'function') {
        this.renderSystem.unregisterRenderer(this.registeredRenderer);
        console.log('🗑️ SimplifiedFlagRenderer unregistered from SimplifiedRenderSystem');
      }

      // Clean up renderer resources
      if (typeof this.registeredRenderer.dispose === 'function') {
        this.registeredRenderer.dispose();
      }

      this.registeredRenderer = null;
      this.renderSystem = null;
    }
  }

  /**
   * Register renderer only if this simulation is currently active
   * (Used during plugin initialization to check if already selected)
   */
  private async registerRendererIfActive(world: IWorld): Promise<void> {
    // For now, don't auto-register during initialization
    // Renderer registration will happen when simulation is explicitly loaded
    console.log('🎯 Flag renderer will be registered when simulation is loaded');
  }

  /**
   * Auto-discover SimplifiedRenderSystem and register our renderer
   */
  private async autoDiscoverAndRegisterRenderer(world: IWorld): Promise<void> {
    try {
      // Import SimplifiedRenderSystem first to get the constructor type
      const { SimplifiedRenderSystem } = await import('../../studio/rendering/simplified/SimplifiedRenderSystem');

      // Look for SimplifiedRenderSystem in the world's system manager
      const renderSystem = (world as any).systemManager?.getSystem(SimplifiedRenderSystem);

      if (renderSystem && typeof renderSystem.registerRenderer === 'function') {
        console.log('🔍 Found SimplifiedRenderSystem, registering flag renderer...');

        // Import and create our SimplifiedFlagRenderer
        const { SimplifiedFlagRenderer } = await import('./renderers/SimplifiedFlagRenderer');
        const flagRenderer = new SimplifiedFlagRenderer();

        // Store references for cleanup during unregister
        this.registeredRenderer = flagRenderer;
        this.renderSystem = renderSystem;

        // Register with the simplified render system
        renderSystem.registerRenderer(flagRenderer);

        console.log('✅ SimplifiedFlagRenderer registered with SimplifiedRenderSystem');
      } else {
        console.log('⚠️ SimplifiedRenderSystem not found, flag rendering may not work');
        console.log('Available systems:', (world as any).systemManager?.getAllSystems?.().map((s: any) => s.constructor.name) || 'No systems found');
      }
    } catch (error) {
      console.error('❌ Failed to auto-register flag renderer:', error);
    }
  }

  getSystems(studio: IStudio): ISystem[] {
    // Return systems that integrate the algorithm and renderer

    // Import and register components with the world
    void import('./FlagComponent').then(({FlagComponent}) => {
      const world = (studio as any).world;
      if (world && world.componentManager) {
        world.componentManager.registerComponent(FlagComponent);
        console.log('✅ FlagComponent registered with ComponentManager');
      }
    });

    return [];
  }

  getRenderer(): any {
    return this.registeredRenderer;
  }

  getVersion?(): string {
    return "1.0.0";
  }

  getDescription?(): string {
    return "Cloth simulation of a flag with wind dynamics";
  }

  getAuthor?(): string {
    return "Physics Simulation Studio";
  }

  getParameterSchema(): PluginParameterSchema {
    const flagParameters = [
      {
        key: 'wind.strength',
        displayName: 'Wind Strength',
        type: 'number' as const,
        defaultValue: 0.5,
        min: 0,
        max: 2,
        step: 0.1,
        category: 'physics',
        description: 'Strength of wind force affecting the flag'
      },
      {
        key: 'wind.direction',
        displayName: 'Wind Direction',
        type: 'number' as const,
        defaultValue: 0,
        min: -180,
        max: 180,
        step: 1,
        category: 'physics',
        description: 'Wind direction in degrees'
      },
      {
        key: 'cloth.stiffness',
        displayName: 'Cloth Stiffness',
        type: 'number' as const,
        defaultValue: 0.3,
        min: 0.1,
        max: 1,
        step: 0.05,
        category: 'physics',
        description: 'Stiffness of the cloth material'
      },
      {
        key: 'cloth.damping',
        displayName: 'Damping',
        type: 'number' as const,
        defaultValue: 0.99,
        min: 0.9,
        max: 0.999,
        step: 0.001,
        category: 'physics',
        description: 'Damping factor for cloth motion'
      },
      {
        key: 'visual.flagColor',
        displayName: 'Flag Color',
        type: 'color' as const,
        defaultValue: '#ff0000',
        category: 'visual',
        description: 'Color of the flag'
      }
    ];

    return {
      pluginId: this.getName(),
      components: new Map([
        ['FlagComponent', flagParameters]
      ])
    };
  }

  // Access the underlying algorithm and renderer for testing
  getAlgorithm(): FlagClothAlgorithm {
    return this.algorithm;
  }

  getFlag(): any {
    return this.registeredRenderer;
  }
}

// Export both the class for testing and instance for auto-discovery
export { FlagSimulationPlugin };
export default new FlagSimulationPlugin();
