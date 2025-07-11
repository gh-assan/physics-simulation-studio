import { System } from "../../core/ecs/System";
import { World } from "../../core/ecs/World";
import { FlagComponent } from "./FlagComponent";
import { FlagPhysicsInitializer } from "./utils/FlagPhysicsInitializer";
import { PositionComponent } from "../../core/components/PositionComponent";
import { PoleComponent } from "./PoleComponent"; // Add this import

import { PointMass } from "./utils/PointMass";
import { Spring } from "./utils/Spring";
import { Vector3 } from "./utils/Vector3";
import {
  applyForces,
  integratePositions,
  initializeFlagPhysics,
  satisfyConstraints
} from "./utils/PhysicsHelpers";

export class FlagSystem extends System {
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
      FlagComponent
    ]);

    for (const entityId of flagEntities) {
      const flagComponent = world.componentManager.getComponent(
        entityId,
        FlagComponent.type
      ) as FlagComponent;
      const positionComponent = world.componentManager.getComponent(
        entityId,
        PositionComponent.type
      ) as PositionComponent;

      if (!flagComponent || !positionComponent) {
        continue;
      }

      // Initialize point masses and springs if not already done for this flag
      if (!flagComponent.points || flagComponent.points.length === 0) {
        FlagPhysicsInitializer.initializeFlag(flagComponent, positionComponent, world);
      }

      // If attached to a pole, ensure fixed points are constrained to the pole's position
      if (flagComponent.poleEntityId) {
        const poleEntity = world.entityManager.getEntityById(flagComponent.poleEntityId);
        if (poleEntity) {
          const poleComp = world.componentManager.getComponent(
            poleEntity,
            PoleComponent.type
          ) as PoleComponent;

          if (poleComp) {
            const numRows = flagComponent.segmentsY + 1;
            const numCols = flagComponent.segmentsX + 1;
            const segmentWidth = flagComponent.width / flagComponent.segmentsX;
            const segmentHeight = flagComponent.height / flagComponent.segmentsY;

            for (let y = 0; y < numRows; y++) {
              for (let x = 0; x < numCols; x++) {
                const p1Index = y * numCols + x;
                const point = flagComponent.points[p1Index];

                if (point.isFixed) {
                  let pointX = point.position.x;
                  let pointY = point.position.y;
                  let pointZ = point.position.z;

                  // Recalculate position based on pole and attached edge
                  if (flagComponent.attachedEdge === 'left' || flagComponent.attachedEdge === 'right') {
                    pointY = poleComp.position.y + (y / (numRows - 1)) * flagComponent.height; // Distribute along pole height
                    pointX = poleComp.position.x;
                    pointZ = poleComp.position.z;
                  } else if (flagComponent.attachedEdge === 'top' || flagComponent.attachedEdge === 'bottom') {
                    pointX = poleComp.position.x + (x / (numCols - 1)) * flagComponent.width; // Distribute along pole width
                    pointY = poleComp.position.y;
                    pointZ = poleComp.position.z;
                  }
                  point.position.set(pointX, pointY, pointZ);
                  point.previousPosition.set(pointX, pointY, pointZ);
                }
              }
            }
          }
        }
      }

      this.applyForces(flagComponent);
      this.integrate(flagComponent, deltaTime);
      this.satisfyConstraints(flagComponent);
      this.updatePositions(flagComponent, positionComponent);
    }
  }

  private applyForces(flagComponent: FlagComponent): void {
    for (const point of flagComponent.points) {
      if (point.isFixed) {
        point.forces = new Vector3(0, 0, 0);
        continue;
      }

      // Reset forces
      point.forces = new Vector3(0, 0, 0);

      // Apply gravity from FlagComponent
      const gravity = new Vector3(
        flagComponent.gravity.x,
        flagComponent.gravity.y,
        flagComponent.gravity.z
      );
      point.forces = point.forces.add(gravity.scale(point.mass));

      // Apply wind from FlagComponent
      const wind = new Vector3(
        flagComponent.wind.x,
        flagComponent.wind.y,
        flagComponent.wind.z
      );
      point.forces = point.forces.add(wind);
    }

    // Apply spring forces
    for (const spring of flagComponent.springs) {
      const delta = spring.p2.position.subtract(spring.p1.position);
      const distance = delta.magnitude();

      if (distance === 0) continue;

      const forceMagnitude = spring.stiffness * (distance - spring.restLength);
      const force = delta.normalize().scale(forceMagnitude);

      // Apply damping
      const dv = spring.p2.velocity.subtract(spring.p1.velocity);
      const dampingForce = delta
        .normalize()
        .scale((spring.damping * dv.dot(delta)) / distance);

      if (!spring.p1.isFixed) {
        spring.p1.forces = spring.p1.forces.add(force).add(dampingForce);
      }
      if (!spring.p2.isFixed) {
        spring.p2.forces = spring.p2.forces
          .subtract(force)
          .subtract(dampingForce);
      }
    }
  }

  private integrate(flagComponent: FlagComponent, deltaTime: number): void {
    if (deltaTime === 0) {
      return; // No integration needed if deltaTime is zero
    }

    const dtSq = deltaTime * deltaTime;

    for (const point of flagComponent.points) {
      if (point.isFixed) {
        point.velocity = new Vector3(0, 0, 0);
        continue;
      }

      const acceleration = point.forces.scale(1 / point.mass);

      const nextPosition = point.position
        .add(point.position.subtract(point.previousPosition))
        .add(acceleration.scale(dtSq));

      point.velocity = nextPosition
        .subtract(point.previousPosition)
        .scale(1 / (2 * deltaTime));

      point.previousPosition = point.position.clone();
      point.position = nextPosition;
    }
  }

  private satisfyConstraints(flagComponent: FlagComponent): void {
    // This is a simple iterative constraint satisfaction.
    // For more stability, multiple iterations can be performed.
    const numIterations = 20; // Number of iterations for constraint satisfaction

    for (let iter = 0; iter < numIterations; iter++) {
      for (const spring of flagComponent.springs) {
        const p1 = spring.p1;
        const p2 = spring.p2;

        const delta = p2.position.subtract(p1.position);
        const distance = delta.magnitude();

        if (distance === 0) {
          console.warn(
            "Division by zero: distance is 0 in satisfyConstraints."
          );
          continue;
        }

        const correction = delta.scale(
          (distance - spring.restLength) / distance / 2
        );

        if (!p1.isFixed) {
          p1.position = p1.position.add(correction);
        }
        if (!p2.isFixed) {
          p2.position = p2.position.subtract(correction);
        }
      }
    }
  }

  private updatePositions(
    flagComponent: FlagComponent,
    positionComponent: PositionComponent
  ): void {
    // For now, we'll just update the positionComponent with the first point's position
    // In a more complex scenario, the flag's overall position might be an average or a specific anchor point.
    if (flagComponent.points.length > 0) {
      positionComponent.x = flagComponent.points[0].position.x;
      positionComponent.y = flagComponent.points[0].position.y;
      positionComponent.z = flagComponent.points[0].position.z;
    }
  }
}
