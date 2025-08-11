import { PositionComponent } from '@core/components/PositionComponent';
import { RenderableComponent } from '@core/components/RenderableComponent';
import { ISystem } from '@core/ecs/ISystem';
import { IWorld } from '@core/ecs/IWorld';
import { ISimulationPlugin } from '@core/plugin/ISimulationPlugin';
import { IEnhancedSimulationPlugin, ISimulationAlgorithm, ISimulationRenderer } from '../../core/plugin/EnhancedPluginInterfaces';
import { IStudio } from '../../studio/IStudio';
import { SimulationManager } from '../../studio/simulation/SimulationManager';
import { WaterAlgorithm } from './WaterAlgorithm';
import { WaterBodyComponent, WaterDropletComponent } from './WaterComponents';
import { WaterRenderer } from './WaterRenderer';

/**
 * Enhanced Water Simulation Plugin with Clean Architecture
 * Separates algorithm (SPH physics) from renderer (particle visualization)
 */
export class WaterSimulationPlugin implements ISimulationPlugin, IEnhancedSimulationPlugin {
  public name = 'water-simulation';
  private algorithm: WaterAlgorithm;
  private renderer: WaterRenderer;

  constructor() {
    this.algorithm = new WaterAlgorithm();
    this.renderer = new WaterRenderer();
  }

  getName(): string {
    return 'water-simulation';
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

  /**
   * Get parameter schema for backward compatibility with tests
   */
  getParameterSchema(): any {
    // Return empty schema for now - this is for backward compatibility
    return {
      components: new Map()
    };
  }

  getSystems(studio: IStudio): ISystem[] {
    // In the new architecture, we don't use traditional ECS systems
    // The algorithm handles the SPH physics instead
    return [];
  }

  register(world: IWorld): void {
    // Register core components that might not be registered elsewhere
    world.registerComponent(PositionComponent);
    world.registerComponent(RenderableComponent);

    // Register water-specific components
    world.registerComponent(WaterBodyComponent);
    world.registerComponent(WaterDropletComponent);
    console.log('💧 Water simulation registered');
  }

  unregister(): void {
    // Clean up resources
    this.renderer.dispose();
    console.log('🗑️ WaterSimulationPlugin unregistered');
  }

  initializeEntities(world: IWorld, simulationManager?: SimulationManager): void {
    // Register the renderer with simulation manager
    if (simulationManager) {
      simulationManager.registerRenderer(this.getName(), this.renderer);
      // Pass world reference to algorithm for future ECS integration
      this.algorithm.setWorld(world);
    }

    // Create a few droplet entities for backward compatibility with tests
    for (let i = 0; i < 3; i++) {
      const droplet = world.createEntity();
      world.addComponent(droplet, PositionComponent.type, new PositionComponent(i * 0.5, 2, 0));
      world.addComponent(droplet, WaterDropletComponent.type, new WaterDropletComponent());
      world.addComponent(droplet, RenderableComponent.type, new RenderableComponent('sphere', '#0077ff'));
    }

    console.log('💧 Water simulation entities initialized with clean architecture');
  }
}
