import { PositionComponent } from '@core/components/PositionComponent';
import { RenderableComponent } from '@core/components/RenderableComponent';
import { ISystem } from '@core/ecs/ISystem';
import { IWorld } from '@core/ecs/IWorld';
import { ISimulationPlugin } from '@core/plugin/ISimulationPlugin';
import { IEnhancedSimulationPlugin, ISimulationAlgorithm, ISimulationRenderer } from '../../core/plugin/EnhancedPluginInterfaces';
import { IStudio } from '../../studio/IStudio';
import { SimulationManager } from '../../studio/simulation/SimulationManager';
import { FlagAlgorithm } from './FlagAlgorithm';
import { FlagCleanRenderer } from './FlagCleanRenderer';
import { FlagComponent } from './FlagComponent';
import { PoleComponent } from './PoleComponent';

/**
 * Enhanced Flag Simulation Plugin with Clean Architecture
 * Separates algorithm (cloth physics) from renderer (mesh visualization)
 */
export class FlagSimulationPlugin implements ISimulationPlugin, IEnhancedSimulationPlugin {
  public name = 'flag-simulation';
  private algorithm: FlagAlgorithm;
  private renderer: FlagCleanRenderer;

  constructor() {
    this.algorithm = new FlagAlgorithm();
    this.renderer = new FlagCleanRenderer();
  }

  getName(): string {
    return 'flag-simulation';
  }

  getDependencies(): string[] {
    return [];
  }

  getAlgorithm(): ISimulationAlgorithm {
    return this.algorithm;
  }

  getRenderer(): ISimulationRenderer {
    return this.renderer;
  }

  getSystems(studio: IStudio): ISystem[] {
    // In the new architecture, we don't use traditional ECS systems
    // The algorithm handles the cloth physics instead
    return [];
  }

  register(world: IWorld): void {
    // Register core components that might not be registered elsewhere
    world.registerComponent(PositionComponent);
    world.registerComponent(RenderableComponent);

    // Register flag-specific components
    world.registerComponent(FlagComponent);
    world.registerComponent(PoleComponent);
    console.log('🏁 Flag simulation registered');
  }

  unregister(): void {
    // Clean up resources
    this.renderer.dispose();
    console.log('🗑️ FlagSimulationPlugin unregistered');
  }

  initializeEntities(world: IWorld, simulationManager?: SimulationManager): void {
    // Register the renderer with simulation manager
    if (simulationManager) {
      simulationManager.registerRenderer(this.getName(), this.renderer);
      // Pass world reference to algorithm for future ECS integration
      this.algorithm.setWorld(world);
    }

    // Create a flag entity for backward compatibility with tests
    const flag = world.createEntity();
    world.addComponent(flag, PositionComponent.type, new PositionComponent(0, 0, 0));
    world.addComponent(flag, FlagComponent.type, new FlagComponent());
    world.addComponent(flag, RenderableComponent.type, new RenderableComponent('plane', '#ff4444'));

    // Create a pole entity
    const pole = world.createEntity();
    world.addComponent(pole, PositionComponent.type, new PositionComponent(0, 0, 0));
    world.addComponent(pole, PoleComponent.type, new PoleComponent());
    world.addComponent(pole, RenderableComponent.type, new RenderableComponent('cylinder', '#8B4513'));

    console.log('🏁 Flag simulation entities initialized with clean architecture');
  }

  /**
   * Get parameter schema for backward compatibility with tests
   */
  getParameterSchema(): any {
    // Return empty schema for now - this is for backward compatibility
    return {
      components: new Map()
    };
  }
}
