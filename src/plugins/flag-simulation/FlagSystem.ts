import {System} from '../../core/ecs/System';
import {World} from '../../core/ecs/World';
import {FlagComponent} from './FlagComponent';
import {FlagPhysicsInitializer} from './FlagPhysicsInitializer';
import {PositionComponent} from '../../core/components/PositionComponent';

import {PointMass, Spring} from './types';

export class FlagSystem extends System {
  public gravity: {x: number; y: number; z: number} = {x: 0, y: -9.81, z: 0}; // m/s^2

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
        FlagPhysicsInitializer.initializeFlag(flagComponent, positionComponent);
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
        point.forces = {x: 0, y: 0, z: 0};
        continue;
      }

      // Reset forces
      point.forces = {x: 0, y: 0, z: 0};

      // Apply gravity
      point.forces.x += point.mass * this.gravity.x;
      point.forces.y += point.mass * this.gravity.y;
      point.forces.z += point.mass * this.gravity.z;

      // Apply wind from FlagComponent
      const wind = flagComponent.wind;
      point.forces.x += wind.x;
      point.forces.y += wind.y;
      point.forces.z += wind.z;
    }

    // Apply spring forces
    for (const spring of flagComponent.springs) {
      const dx = spring.p2.position.x - spring.p1.position.x;
      const dy = spring.p2.position.y - spring.p1.position.y;
      const dz = spring.p2.position.z - spring.p1.position.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (distance === 0) continue;

      const forceMagnitude = spring.stiffness * (distance - spring.restLength);

      const forceX = forceMagnitude * (dx / distance);
      const forceY = forceMagnitude * (dy / distance);
      const forceZ = forceMagnitude * (dz / distance);

      // Apply damping
      const dvx = spring.p2.velocity.x - spring.p1.velocity.x;
      const dvy = spring.p2.velocity.y - spring.p1.velocity.y;
      const dvz = spring.p2.velocity.z - spring.p1.velocity.z;
      const dampingForce =
        (spring.damping * (dvx * dx + dvy * dy + dvz * dz)) / distance;

      const dampingX = dampingForce * (dx / distance);
      const dampingY = dampingForce * (dy / distance);
      const dampingZ = dampingForce * (dz / distance);

      if (!spring.p1.isFixed) {
        spring.p1.forces.x += forceX + dampingX;
        spring.p1.forces.y += forceY + dampingY;
        spring.p1.forces.z += forceZ + dampingZ;
      }
      if (!spring.p2.isFixed) {
        spring.p2.forces.x -= forceX + dampingX;
        spring.p2.forces.y -= forceY + dampingY;
        spring.p2.forces.z -= forceZ + dampingZ;
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
        point.velocity = {x: 0, y: 0, z: 0};
        continue;
      }

      const accelerationX = point.forces.x / point.mass;
      const accelerationY = point.forces.y / point.mass;
      const accelerationZ = point.forces.z / point.mass;

      const nextPositionX =
        point.position.x +
        (point.position.x - point.previousPosition.x) +
        accelerationX * dtSq;
      const nextPositionY =
        point.position.y +
        (point.position.y - point.previousPosition.y) +
        accelerationY * dtSq;
      const nextPositionZ =
        point.position.z +
        (point.position.z - point.previousPosition.z) +
        accelerationZ * dtSq;

      point.velocity.x =
        (nextPositionX - point.previousPosition.x) / (2 * deltaTime);
      point.velocity.y =
        (nextPositionY - point.previousPosition.y) / (2 * deltaTime);
      point.velocity.z =
        (nextPositionZ - point.previousPosition.z) / (2 * deltaTime);

      point.previousPosition = {...point.position};
      point.position = {x: nextPositionX, y: nextPositionY, z: nextPositionZ};
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

        const dx = p2.position.x - p1.position.x;
        const dy = p2.position.y - p1.position.y;
        const dz = p2.position.z - p1.position.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (distance === 0) {
          console.warn(
            'Division by zero: distance is 0 in satisfyConstraints.',
          );
          continue;
        }

        const correction = (distance - spring.restLength) / distance;

        const correctionX = dx * 0.5 * correction;
        const correctionY = dy * 0.5 * correction;
        const correctionZ = dz * 0.5 * correction;

        if (!p1.isFixed) {
          p1.position.x += correctionX;
          p1.position.y += correctionY;
          p1.position.z += correctionZ;
        }
        if (!p2.isFixed) {
          p2.position.x -= correctionX;
          p2.position.y -= correctionY;
          p2.position.z -= correctionZ;
        }
      }
    }
  }

  private updatePositions(
    flagComponent: FlagComponent,
    positionComponent: PositionComponent,
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
