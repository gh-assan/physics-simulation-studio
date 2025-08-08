import { ISimulationPlugin } from '@core/plugin/ISimulationPlugin';
import { World } from '@core/ecs/World';
import { SolarSystem } from './system';
import { CelestialBodyComponent, OrbitComponent } from './components';
import { PositionComponent } from '@core/components/PositionComponent';
import { RenderableComponent } from '@core/components/RenderableComponent';
import { ParameterPanelComponent } from '@core/components/ParameterPanelComponent';
import { SolarSystemParameterPanel } from './parameter-panel';
import { ComponentPropertyRegistry } from '../../studio/utils/ComponentPropertyRegistry';
import { positionComponentProperties, celestialBodyComponentProperties, orbitComponentProperties } from './solarSystemComponentProperties';
import { System } from '@core/ecs/System';
import { IStudio } from '../../studio/IStudio';
import { IWorld } from '@core/ecs/IWorld';

export class SolarSystemPlugin implements ISimulationPlugin {
  public name = 'solar-system';

  public getName(): string {
    return 'solar-system';
  }

  public getDependencies(): string[] {
    return [];
  }

  public register(world: IWorld): void {

    world.registerComponent(CelestialBodyComponent);
    world.registerComponent(OrbitComponent);

    // Register component properties for UI
    ComponentPropertyRegistry.getInstance().registerComponentProperties(PositionComponent.type, positionComponentProperties);
    ComponentPropertyRegistry.getInstance().registerComponentProperties(CelestialBodyComponent.type, celestialBodyComponentProperties);
    ComponentPropertyRegistry.getInstance().registerComponentProperties(OrbitComponent.type, orbitComponentProperties);
  }

  public unregister(): void {
    // world.componentManager.unregisterComponent(CelestialBodyComponent.type);
    // world.componentManager.unregisterComponent(OrbitComponent.type);
    // world.systemManager.unregisterSystem(SolarSystem);
    // world.systemManager.unregisterSystem(SolarSystemRenderer);
  }

  public initializeEntities(world: IWorld): void {

    // Sun
    const sun = world.createEntity();
    world.addComponent(sun, PositionComponent.type, new PositionComponent(0, 0, 0));
    world.addComponent(sun, CelestialBodyComponent.type, new CelestialBodyComponent('Sun', 1.989e30, 695700));
    world.addComponent(sun, RenderableComponent.type, new RenderableComponent('sphere', '#ffff00'));

    // Mercury
    const mercury = world.createEntity();
    world.addComponent(mercury, PositionComponent.type, new PositionComponent(10, 0, 0)); // Place at semiMajorAxis
    world.addComponent(mercury, CelestialBodyComponent.type, new CelestialBodyComponent('Mercury', 3.285e23, 2440));
    world.addComponent(mercury, OrbitComponent.type, new OrbitComponent(10, 0.205, 0.05)); // Adjusted orbitalSpeed
    world.addComponent(mercury, RenderableComponent.type, new RenderableComponent('sphere', '#ffa500'));

    // Venus
    const venus = world.createEntity();
    world.addComponent(venus, PositionComponent.type, new PositionComponent(20, 0, 0)); // Place at semiMajorAxis
    world.addComponent(venus, CelestialBodyComponent.type, new CelestialBodyComponent('Venus', 4.867e24, 6052));
    world.addComponent(venus, OrbitComponent.type, new OrbitComponent(20, 0.007, 0.03)); // Adjusted semiMajorAxis and orbitalSpeed
    world.addComponent(venus, RenderableComponent.type, new RenderableComponent('sphere', '#00ff00'));

    // Earth
    const earth = world.createEntity();
    world.addComponent(earth, PositionComponent.type, new PositionComponent(30, 0, 0)); // Place at semiMajorAxis
    world.addComponent(earth, CelestialBodyComponent.type, new CelestialBodyComponent('Earth', 5.972e24, 6371));
    world.addComponent(earth, OrbitComponent.type, new OrbitComponent(30, 0.017, 0.02)); // Adjusted semiMajorAxis and orbitalSpeed
    world.addComponent(earth, RenderableComponent.type, new RenderableComponent('sphere', '#0000ff'));

    // Mars
    const mars = world.createEntity();
    world.addComponent(mars, PositionComponent.type, new PositionComponent(40, 0, 0)); // Place at semiMajorAxis
    world.addComponent(mars, CelestialBodyComponent.type, new CelestialBodyComponent('Mars', 6.39e23, 3389));
    world.addComponent(mars, OrbitComponent.type, new OrbitComponent(40, 0.093, 0.015)); // Adjusted semiMajorAxis and orbitalSpeed
    world.addComponent(mars, RenderableComponent.type, new RenderableComponent('sphere', '#ff0000'));

  }

  public getSystems(studio: IStudio): System[] {
    return [new SolarSystem()];
  }

  public getParameterPanels(world: IWorld): ParameterPanelComponent[] {
    return [new SolarSystemParameterPanel(world)];
  }
}

// Export plugin instance for auto-discovery
export default new SolarSystemPlugin();
