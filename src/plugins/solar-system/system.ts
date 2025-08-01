import { System } from '@core/ecs/System';
import { World } from '@core/ecs/World';
import { OrbitComponent } from './components';
import { PositionComponent } from '@core/components/PositionComponent';

export class SolarSystem extends System {
  public update(world: World, deltaTime: number): void {
    const entities = world.componentManager.getEntitiesWithComponents([
      OrbitComponent,
      PositionComponent,
    ]);

    for (const entityId of entities) {
      const orbitComponent = world.componentManager.getComponent(
        entityId,
        OrbitComponent.type
      ) as OrbitComponent;
      const positionComponent = world.componentManager.getComponent(
        entityId,
        PositionComponent.type
      ) as PositionComponent;

      if (orbitComponent && positionComponent) {
        const time = Date.now() * 0.001;
        positionComponent.x = Math.cos(time * orbitComponent.orbitalSpeed) * orbitComponent.semiMajorAxis;
        positionComponent.y = Math.sin(time * orbitComponent.orbitalSpeed) * orbitComponent.semiMajorAxis;
      }
    }
  }
}
