import { ISimulationPlugin } from '@core/plugin/ISimulationPlugin';
import { IEnhancedSimulationPlugin, ISimulationAlgorithm, ISimulationRenderer } from '../../core/plugin/EnhancedPluginInterfaces';
import { IWorld } from '@core/ecs/IWorld';
import { ISystem } from '@core/ecs/ISystem';
import { IStudio } from '../../studio/IStudio';
import { SimulationManager } from '../../studio/simulation/SimulationManager';
import { SolarSystemAlgorithm } from './SolarSystemAlgorithm';
import { SolarSystemRenderer } from './SolarSystemRenderer';
import { CelestialBodyComponent, OrbitComponent } from './components';
import { PositionComponent } from '@core/components/PositionComponent';
import { RenderableComponent } from '@core/components/RenderableComponent';
import { ComponentPropertyRegistry } from '../../studio/utils/ComponentPropertyRegistry';
import { positionComponentProperties, celestialBodyComponentProperties, orbitComponentProperties } from './solarSystemComponentProperties';

/**
 * Enhanced Solar System Plugin with Clean Architecture
 * Separates algorithm (physics) from renderer (visualization)
 */
export class SolarSystemPlugin implements ISimulationPlugin, IEnhancedSimulationPlugin {
  public name = 'solar-system';
  private algorithm: SolarSystemAlgorithm;
  private renderer: SolarSystemRenderer;

  constructor() {
    this.algorithm = new SolarSystemAlgorithm();
    this.renderer = new SolarSystemRenderer();
  }

  getName(): string {
    return 'solar-system';
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
    // The algorithm handles the logic instead
    return [];
  }

  register(world: IWorld): void {
    // Register core components that might not be registered elsewhere
    world.registerComponent(PositionComponent);
    world.registerComponent(RenderableComponent);

    // Register solar system specific components
    world.registerComponent(CelestialBodyComponent);
    world.registerComponent(OrbitComponent);

    // Register component properties for UI
    ComponentPropertyRegistry.getInstance().registerComponentProperties(PositionComponent.type, positionComponentProperties);
    ComponentPropertyRegistry.getInstance().registerComponentProperties(CelestialBodyComponent.type, celestialBodyComponentProperties);
    ComponentPropertyRegistry.getInstance().registerComponentProperties(OrbitComponent.type, orbitComponentProperties);
  }

  unregister(): void {
    // Clean up resources
    this.renderer.dispose();
    console.log('🗑️ SolarSystemPlugin unregistered');
  }

  initializeEntities(world: IWorld, simulationManager?: SimulationManager): void {
    // Register the renderer with simulation manager first
    if (simulationManager) {
      simulationManager.registerRenderer(this.getName(), this.renderer);
      // Pass world reference to algorithm so it can sync with ECS
      this.algorithm.setWorld(world);
    }

    // Create Sun
    const sun = world.createEntity();
    world.addComponent(sun, PositionComponent.type, new PositionComponent(0, 0, 0));
    world.addComponent(sun, CelestialBodyComponent.type, new CelestialBodyComponent('Sun', 1.989e30, 695700));
    world.addComponent(sun, RenderableComponent.type, new RenderableComponent('sphere', '#ffaa00'));

    // Create Earth
    const earth = world.createEntity();
    world.addComponent(earth, PositionComponent.type, new PositionComponent(149.6e6, 0, 0)); // 1 AU
    world.addComponent(earth, CelestialBodyComponent.type, new CelestialBodyComponent('Earth', 5.972e24, 6371));
    world.addComponent(earth, RenderableComponent.type, new RenderableComponent('sphere', '#6b93d6'));
    world.addComponent(earth, OrbitComponent.type, new OrbitComponent(149.6e6, 0, 29780));

    // Create Mars
    const mars = world.createEntity();
    world.addComponent(mars, PositionComponent.type, new PositionComponent(227.9e6, 0, 0)); // 1.52 AU
    world.addComponent(mars, CelestialBodyComponent.type, new CelestialBodyComponent('Mars', 6.39e23, 3390));
    world.addComponent(mars, RenderableComponent.type, new RenderableComponent('sphere', '#cd5c5c'));
    world.addComponent(mars, OrbitComponent.type, new OrbitComponent(227.9e6, 0, 24077));

    console.log('🌟 Solar system entities initialized with clean architecture');
  }
}
