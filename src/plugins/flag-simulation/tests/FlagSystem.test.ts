import {World} from '@core/ecs/World';
import {FlagSystem} from '../FlagSystem';
import {FlagComponent} from '../FlagComponent';
import {PositionComponent} from '@core/components/PositionComponent';

describe('FlagSystem', () => {
  let world: World;
  let flagSystem: FlagSystem;

  beforeEach(() => {
    world = new World();
    flagSystem = new FlagSystem();
    world.systemManager.registerSystem(flagSystem);
    world.componentManager.registerComponent(FlagComponent.name, FlagComponent);
    world.componentManager.registerComponent(
      PositionComponent.name,
      PositionComponent,
    );
  });

  it('should initialize flag points and springs when a FlagComponent is added', () => {
    const entity = world.entityManager.createEntity();
    const flagComponent = new FlagComponent(10, 6, 2, 2); // 10x6 flag, 2x2 segments
    const positionComponent = new PositionComponent(0, 0, 0);

    world.componentManager.addComponent(
      entity,
      FlagComponent.name,
      flagComponent,
    );
    world.componentManager.addComponent(
      entity,
      PositionComponent.name,
      positionComponent,
    );

    flagSystem.update(world, 0);

    expect(flagComponent.points).toBeDefined();
    expect(flagComponent.points.length).toBe(
      (flagComponent.segmentsX + 1) * (flagComponent.segmentsY + 1),
    );
    expect(flagComponent.springs).toBeDefined();
    expect(flagComponent.springs.length).toBeGreaterThan(0);

    // Check if fixed points are correctly set
    const topLeft = flagComponent.points[0];
    const bottomLeft =
      flagComponent.points[
        flagComponent.segmentsY * (flagComponent.segmentsX + 1)
      ];
    expect(topLeft.isFixed).toBe(true);
    expect(bottomLeft.isFixed).toBe(true);

    // Check a non-fixed point
    const nonFixedPoint = flagComponent.points[1];
    expect(nonFixedPoint.isFixed).toBe(false);
  });

  it('should apply gravity and wind forces to non-fixed points', () => {
    const entity = world.entityManager.createEntity();
    const flagComponent = new FlagComponent(10, 6, 1, 1); // 1x1 segments for simplicity
    const positionComponent = new PositionComponent(0, 0, 0);

    world.componentManager.addComponent(
      entity,
      FlagComponent.name,
      flagComponent,
    );
    world.componentManager.addComponent(
      entity,
      PositionComponent.name,
      positionComponent,
    );

    // Initialize, but don't apply forces yet
    flagSystem.update(world, 0);

    const nonFixedPoint = flagComponent.points[1]; // A non-fixed point
    const _initialForces = {...nonFixedPoint.forces}; // Should be {x:0, y:0, z:0}

    flagSystem.update(world, 0.1); // Apply forces and integrate

    // Expect forces to have changed due to gravity and wind
    expect(nonFixedPoint.forces.y).toBeCloseTo(
      flagSystem['gravity'].y * nonFixedPoint.mass,
    ); // Gravity should pull down
  });

  it('should integrate point mass positions using Verlet integration', () => {
    const entity = world.entityManager.createEntity();
    const flagComponent = new FlagComponent(10, 6, 1, 1); // 1x1 segments for simplicity
    const positionComponent = new PositionComponent(0, 0, 0);

    world.componentManager.addComponent(
      entity,
      FlagComponent.name,
      flagComponent,
    );
    world.componentManager.addComponent(
      entity,
      PositionComponent.name,
      positionComponent,
    );

    flagSystem.update(world, 0.01); // Initialize

    const nonFixedPoint = flagComponent.points[1]; // A non-fixed point
    const _initialPosition = {...nonFixedPoint.position}; // Define initialPosition here

    flagSystem.update(world, 0.1); // Integrate for 0.1 seconds

    // Expect position to have changed due to integration (gravity will cause movement)
        expect(nonFixedPoint.position.y).toBeLessThan(_initialPosition.y);
  });

  it('should satisfy constraints and maintain spring rest lengths (approximately)', () => {
    const entity = world.entityManager.createEntity();
    const flagComponent = new FlagComponent(10, 6, 1, 1); // 1x1 segments for simplicity
    const positionComponent = new PositionComponent(0, 0, 0);

    world.componentManager.addComponent(
      entity,
      FlagComponent.name,
      flagComponent,
    );
    world.componentManager.addComponent(
      entity,
      PositionComponent.name,
      positionComponent,
    );

    flagSystem.update(world, 0); // Initialize

    // Displace a non-fixed point to create tension
    const displacedPoint = flagComponent.points[1]; // A non-fixed point
    const _initialPosition = {...displacedPoint.position};
    displacedPoint.position.x += 2; // Move it to create tension

    flagSystem.update(world, 0.1); // Run update to satisfy constraints

    // Check the spring connecting points[0] and points[1]
    const springToCheck = flagComponent.springs.find(
      s =>
        (s.p1 === flagComponent.points[0] &&
          s.p2 === flagComponent.points[1]) ||
        (s.p1 === flagComponent.points[1] && s.p2 === flagComponent.points[0]),
    );

    if (springToCheck) {
      const dx = springToCheck.p2.position.x - springToCheck.p1.position.x;
      const dy = springToCheck.p2.position.y - springToCheck.p1.position.y;
      const dz = springToCheck.p2.position.z - springToCheck.p1.position.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      // Expect the distance to be closer to restLength after constraint satisfaction
      expect(distance).toBeCloseTo(springToCheck.restLength, 1); // Adjust tolerance as needed
    } else {
      fail('Spring not found for testing constraint satisfaction.');
    }
  });
});
