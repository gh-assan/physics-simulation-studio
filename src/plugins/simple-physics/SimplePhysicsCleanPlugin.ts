import { PositionComponent } from '@core/components/PositionComponent';
import { RenderableComponent } from '@core/components/RenderableComponent';
import { ISystem } from '@core/ecs/ISystem';
import { IWorld } from '@core/ecs/IWorld';
import { ISimulationPlugin } from '@core/plugin/ISimulationPlugin';
import { IEnhancedSimulationPlugin, ISimulationAlgorithm, ISimulationRenderer } from '../../core/plugin/EnhancedPluginInterfaces';
import { IStudio } from '../../studio/IStudio';
import { SimulationManager } from '../../studio/simulation/SimulationManager';
import { SimplePhysicsAlgorithm } from './SimplePhysicsAlgorithm';
import { SimplePhysicsRenderer } from './SimplePhysicsRenderer';

/**
 * Enhanced Simple Physics Plugin with Clean Architecture
 * Separates algorithm (basic physics) from renderer (sphere visualization)
 */
export class SimplePhysicsPlugin implements ISimulationPlugin, IEnhancedSimulationPlugin {
  public name = 'simple-physics';
  private algorithm: SimplePhysicsAlgorithm;
  private renderer: SimplePhysicsRenderer;

  constructor() {
    this.algorithm = new SimplePhysicsAlgorithm();
    this.renderer = new SimplePhysicsRenderer();
  }

  getName(): string {
    return 'simple-physics';
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
    // The algorithm handles the physics instead
    return [];
  }

  register(world: IWorld): void {
    // Register ECS components that the simple physics simulation uses
    world.registerComponent(PositionComponent);
    world.registerComponent(RenderableComponent);

    console.log('🎯 Simple physics simulation registered');
  }

  unregister(): void {
    console.log('🎯 Simple physics simulation unregistered');
  }

  initializeEntities(world: IWorld, simulationManager?: SimulationManager): void {
    // Register the renderer with simulation manager first
    if (simulationManager) {
      simulationManager.registerRenderer(this.getName(), this.renderer);
      // Pass world reference to algorithm so it can sync with ECS
      this.algorithm.setWorld(world);
    }

    // Create some physics entities for demonstration
    for (let i = 0; i < 5; i++) {
      const entity = world.createEntity();

      // Add position component with random starting position
      world.addComponent(
        entity,
        PositionComponent.type,
        new PositionComponent(
          Math.random() * 6 - 3, // x: -3 to 3
          Math.random() * 3 + 2, // y: 2 to 5
          Math.random() * 6 - 3  // z: -3 to 3
        )
      );

      // Add renderable component
      world.addComponent(
        entity,
        RenderableComponent.type,
        new RenderableComponent('sphere', `hsl(${i * 72}, 70%, 60%)`)
      );
    }

    console.log('🎯 Simple physics entities initialized with clean architecture');
  }
}
