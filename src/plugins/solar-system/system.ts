import { System } from '@core/ecs/System';
import { World } from '@core/ecs/World';
import { OrbitComponent } from './components';
import { PositionComponent } from '../../core/ecs/PositionComponent';
import { IAlgorithm } from '../../core/plugin/IAlgorithm';

export class SolarSystem extends System implements IAlgorithm {

  private _world: World | null = null;

  public initialize(world: World): void {
    this._world = world;
  }

  public step(deltaTime: number): void {
    if (!this._world) return;
    const entities = this._world.componentManager.getEntitiesWithComponents([
      OrbitComponent,
      PositionComponent,
    ]);

    for (const entityId of entities) {
      const orbitComponent = this._world.componentManager.getComponent(
        entityId,
        OrbitComponent.type
      ) as OrbitComponent;
      const positionComponent = this._world.componentManager.getComponent(
        entityId,
        PositionComponent.name
      ) as PositionComponent;

      if (orbitComponent && positionComponent) {
        const time = Date.now() * 0.001;
        positionComponent.x = Math.cos(time * orbitComponent.orbitalSpeed) * orbitComponent.semiMajorAxis;
        positionComponent.y = Math.sin(time * orbitComponent.orbitalSpeed) * orbitComponent.semiMajorAxis;
      }
    }
  }

  public reset?(): void {
    // Optional reset logic
  }

  // Retain original update for System compatibility
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
        PositionComponent.name
      ) as PositionComponent;

      if (orbitComponent && positionComponent) {
        const time = Date.now() * 0.001;
        positionComponent.x = Math.cos(time * orbitComponent.orbitalSpeed) * orbitComponent.semiMajorAxis;
        positionComponent.y = Math.sin(time * orbitComponent.orbitalSpeed) * orbitComponent.semiMajorAxis;
      }
    }
  }
}
