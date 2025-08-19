import { PositionComponent } from '../../core/components/PositionComponent';
import { RenderableComponent } from '../../core/components/RenderableComponent';
import { ISystem } from '../../core/ecs/ISystem';
import { IWorld } from '../../core/ecs/IWorld';
import { ISimulationPlugin } from '../../core/plugin/ISimulationPlugin';
import { IStudio } from '../../studio/IStudio';
import { FlagAlgorithm } from './FlagAlgorithm';
import { FlagComponent } from './FlagComponent';
import { PoleComponent } from './PoleComponent';

/**
 * Flag Simulation Plugin - Simplified Rendering
 * Uses SimplifiedFlagRenderer for the new clean rendering approach
 */
class FlagSimulationPlugin implements ISimulationPlugin {
  public name = 'flag-simulation';
  private algorithm: FlagAlgorithm;
  private registeredRenderer: any = null;
  private renderSystem: any = null;
  private studio: IStudio | null = null; // Store studio reference

  constructor() {
    this.algorithm = new FlagAlgorithm();
  }

  getName(): string {
    return 'flag-simulation';
  }

  getDependencies(): string[] {
    return [];
  }

  register(world: IWorld): void {
    // Register core components that might not be registered elsewhere
    world.registerComponent(PositionComponent);
    world.registerComponent(RenderableComponent);

    // Register flag-specific components
    world.registerComponent(FlagComponent);
    world.registerComponent(PoleComponent);
  }

  unregister(): void {
    // Clean up renderer
    this.unregisterRenderer();
  }

  async initializeEntities(world: IWorld): Promise<void> {
    // TDD Fix: Remove studio context check to enable entity creation in demos and tests
    // Previous code: if (!this.studio) { return; }
    // This enables flag simulation to work without studio context

    // Create a flag entity
    const flag = world.createEntity();
    world.addComponent(flag, PositionComponent.type, new PositionComponent(0, 2, 0));
    world.addComponent(flag, FlagComponent.type, new FlagComponent());
    world.addComponent(flag, RenderableComponent.type, new RenderableComponent('plane', '#ff4444'));

    // Create a pole entity
    const pole = world.createEntity();
    world.addComponent(pole, PositionComponent.type, new PositionComponent(0, 0, 0));
    world.addComponent(pole, PoleComponent.type, new PoleComponent());
    world.addComponent(pole, RenderableComponent.type, new RenderableComponent('cylinder', '#8B4513'));

  // Always register renderer with render system for integration/acceptance compatibility
  await this.autoDiscoverAndRegisterRenderer(world);
  }

  getSystems(studio: IStudio): ISystem[] {
  // Store studio reference so it's available for entity initialization
  this.studio = studio;
  // Register the flag physics system so animation/physics updates run
  const { FlagSystem } = require('./FlagSystem');
  return [new FlagSystem(this.algorithm)];
  }

  /**
   * Register renderer when this simulation is loaded/activated
   */
  public async registerRenderer(world: IWorld): Promise<void> {
    await this.autoDiscoverAndRegisterRenderer(world);
  }

  /**
   * Unregister renderer when simulation is unloaded/deactivated
   */
  public unregisterRenderer(): void {
    if (this.renderSystem && this.registeredRenderer) {
      // Unregister renderer from active render system (adapter supports instance or name)
      if (typeof this.renderSystem.unregisterRenderer === 'function') {
        this.renderSystem.unregisterRenderer(this.registeredRenderer.name ?? this.registeredRenderer);
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
   */
  public async registerRendererIfActive(world: IWorld): Promise<void> {
    const selectedSimulation = (window as any).studio?.selectedSimulation?.getSimulationName?.();
    if (selectedSimulation === 'flag-simulation') {
      await this.autoDiscoverAndRegisterRenderer(world);
    }
  }

  /**
   * Auto-discover and register SimplifiedFlagRenderer with SimplifiedRenderSystem
   */
  private async autoDiscoverAndRegisterRenderer(world: IWorld): Promise<void> {
    try {
      // Import and create our SimplifiedFlagRenderer
      const { SimplifiedFlagRenderer } = await import('./SimplifiedFlagRenderer');
      const flagRenderer = new SimplifiedFlagRenderer();

      // Only register with the adapter-based render system
      const systems = (world as any).systemManager?.getAllSystems?.() || [];
      for (const sys of systems) {
        if (typeof sys.registerRenderer === 'function' && sys.constructor.name === 'RenderSystemAdapter') {
          sys.registerRenderer(flagRenderer);
          this.registeredRenderer = flagRenderer;
          this.renderSystem = sys;
          return;
        }
      }
      throw new Error('No adapter-based RenderSystem found for renderer registration.');
    } catch (error) {
      // Only log actual errors, not debug information
      console.error('❌ Failed to auto-register flag renderer:', error);
    }
  }

  getRenderer(): any {
    return this.registeredRenderer;
  }

  getVersion?(): string {
    return "1.0.0";
  }

  getDescription?(): string {
    return "Cloth simulation of a flag with wind dynamics using simplified rendering";
  }

  getAuthor?(): string {
    return "Physics Simulation Studio";
  }

  /**
   * Get parameter schema for parameter panel integration
   */
  getParameterSchema(): any {
    const components = new Map();

    // Add FlagComponent parameters - array format expected by SimplifiedPropertyInspectorSystem
    components.set('FlagComponent', [
      {
        key: 'windStrength',
        label: 'Wind Strength',
        type: 'number',
        min: 0,
        max: 20,
        step: 0.1,
        group: 'Physics',
        order: 1
      },
      {
        key: 'damping',
        label: 'Damping',
        type: 'number',
        min: 0.8,
        max: 1.0,
        step: 0.01,
        group: 'Physics',
        order: 2
      },
      {
        key: 'stiffness',
        label: 'Stiffness',
        type: 'number',
        min: 0.1,
        max: 2.0,
        step: 0.1,
        group: 'Physics',
        order: 3
      },
      {
        key: 'gravity.x',
        label: 'Gravity X',
        type: 'number',
        min: -20,
        max: 20,
        step: 0.1,
        group: 'Environment',
        order: 4
      },
      {
        key: 'gravity.y',
        label: 'Gravity Y',
        type: 'number',
        min: -20,
        max: 20,
        step: 0.1,
        group: 'Environment',
        order: 5
      },
      {
        key: 'gravity.z',
        label: 'Gravity Z',
        type: 'number',
        min: -20,
        max: 20,
        step: 0.1,
        group: 'Environment',
        order: 6
      }
    ]);

    // Add PoleComponent parameters - array format expected by SimplifiedPropertyInspectorSystem
    components.set('PoleComponent', [
      {
        key: 'height',
        label: 'Pole Height',
        type: 'number',
        min: 10,
        max: 100,
        step: 1,
        group: 'Structure',
        order: 1
      },
      {
        key: 'radius',
        label: 'Pole Radius',
        type: 'number',
        min: 0.1,
        max: 5,
        step: 0.1,
        group: 'Structure',
        order: 2
      }
    ]);

    return {
      pluginId: this.name,
      components: components
    };
  }
}

// Export both the class for testing and instance for auto-discovery
export { FlagSimulationPlugin };
export default FlagSimulationPlugin;
