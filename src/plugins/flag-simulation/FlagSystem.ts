import {System} from '../../core/ecs/System';
import {World} from '../../core/ecs/World';
import {FlagComponent} from './FlagComponent';
import {PositionComponent} from '../../core/components/PositionComponent';
import {PointMass, Spring} from './types';
import {Vector3} from './utils/Vector3';
import {
  applyForces,
  integratePositions,
  initializeFlagPhysics,
  satisfyConstraints,
} from './utils/PhysicsHelpers';

export class FlagSystem extends System {
  public gravity: Vector3 = new Vector3(0, -9.81, 0); // m/s^2

  constructor() {
    super();
  }

  init(): void {
    // No specific initialization needed here yet, will be done per flag entity
  }

  unregister(): void {
    // No specific unregistration needed for now
  }

  update(world: World, deltaTime: number): void {
    // Get all entities with a FlagComponent
    const flagEntities = world.componentManager.getEntitiesWithComponents([
      FlagComponent,
    ]);

    for (const entityId of flagEntities) {
      const flagComponent = world.componentManager.getComponent(
        entityId,
        FlagComponent.name,
      ) as FlagComponent;
      const positionComponent = world.componentManager.getComponent(
        entityId,
        PositionComponent.name,
      ) as PositionComponent;

      if (!flagComponent || !positionComponent) {
        continue;
      }

      // Initialize point masses and springs if not already done for this flag
      if (!flagComponent.points || flagComponent.points.length === 0) {
        initializeFlagPhysics(flagComponent, positionComponent);
      }

      applyForces(flagComponent, this.gravity);
      integratePositions(flagComponent, deltaTime);
      satisfyConstraints(flagComponent);
    }
  }
}
