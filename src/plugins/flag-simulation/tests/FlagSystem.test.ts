import { World } from "@core/ecs";
import { FlagComponent } from "../FlagComponent";
import { PositionComponent } from "@core/components";
import { FlagSystem } from "../FlagSystem";
import { Vector3 } from "../utils/Vector3";
import { PoleComponent } from "../PoleComponent"; // Import PoleComponent

describe("FlagSystem", () => {
  let world: World;
  let flagSystem: FlagSystem;

  beforeEach(() => {
    world = new World();
    flagSystem = new FlagSystem();
    world.systemManager.registerSystem(flagSystem);
    world.componentManager.registerComponent(FlagComponent);
    world.componentManager.registerComponent(PositionComponent);
    world.componentManager.registerComponent(PoleComponent); // Register PoleComponent
  });

  it("should initialize flag points and springs when a FlagComponent is added", () => {
    const entity = world.entityManager.createEntity();
    const poleEntity = world.entityManager.createEntity(); // Create a pole entity
    const poleComponent = new PoleComponent({
      position: new Vector3(0, 0, 0),
      height: 10,
      radius: 0.1
    });
    world.componentManager.addComponent(
      poleEntity,
      PoleComponent.type,
      poleComponent
    );

    const flagComponent = new FlagComponent(
      10,
      6,
      2,
      2,
      0.1,
      0.5,
      0.05,
      "",
      0,
      undefined, // windDirection - use default
      undefined, // gravity - use default
      poleEntity,
      "left"
    ); // Link flag to pole
    const positionComponent = new PositionComponent(0, 0, 0);

    world.componentManager.addComponent(
      entity,
      FlagComponent.type,
      flagComponent
    );
    world.componentManager.addComponent(
      entity,
      PositionComponent.name,
      positionComponent
    );

    flagSystem.update(world, 0);

    expect(flagComponent.points).toBeDefined();
    expect(flagComponent.points.length).toBe(
      (flagComponent.segmentsX + 1) * (flagComponent.segmentsY + 1)
    );
    expect(flagComponent.springs).toBeDefined();
    expect(flagComponent.springs.length).toBeGreaterThan(0);

    // Check if fixed points are correctly set (top-left and bottom-left for 'left' attachedEdge)
    const numCols = flagComponent.segmentsX + 1;
    const numRows = flagComponent.segmentsY + 1;

    const bottomLeftFixedPoint = flagComponent.points[0]; // (0,0)
    const topLeftFixedPoint = flagComponent.points[(numRows - 1) * numCols]; // (0, numRows-1)

    expect(bottomLeftFixedPoint.isFixed).toBe(true);
    expect(topLeftFixedPoint.isFixed).toBe(true);

    // Check a non-fixed point (e.g., top-right)
    const topRightNonFixedPoint = flagComponent.points[numCols - 1];
    expect(topRightNonFixedPoint.isFixed).toBe(false);
  });

  it("should apply gravity and wind forces to non-fixed points", () => {
    const entity = world.entityManager.createEntity();
    // Use 3x3 segments and no pole to ensure non-fixed points
    const flagComponent = new FlagComponent(10, 6, 3, 3, 0.1, 0.5, 0.05, "", 0);
    const positionComponent = new PositionComponent(0, 0, 0);

    world.componentManager.addComponent(
      entity,
      FlagComponent.type,
      flagComponent
    );
    world.componentManager.addComponent(
      entity,
      PositionComponent.name,
      positionComponent
    );

    // Initialize points and springs
    flagSystem.update(world, 0); // Ensure points are initialized

    // Reset all point forces to zero
    flagComponent.points.forEach(p => p.forces.set(0, 0, 0));

    // Now apply only gravity and wind
    flagSystem["applyForces"](flagComponent);

    // Find a non-fixed point
    const nonFixedPoint = flagComponent.points.find(p => !p.isFixed);
    expect(nonFixedPoint).toBeDefined();

    // Simplified assertion - no more if checks
    const expectedForceY = flagComponent.gravity.y * nonFixedPoint!.mass + flagComponent.wind.y;
    expect(nonFixedPoint!.forces.y).toBeCloseTo(expectedForceY, 0);
  });

  it("should integrate point mass positions using Verlet integration", () => {
    const entity = world.entityManager.createEntity();
    const flagComponent = new FlagComponent(10, 6, 2, 2); // 2x2 segments to ensure non-fixed points
    const positionComponent = new PositionComponent(0, 0, 0);

    world.componentManager.addComponent(
      entity,
      FlagComponent.type,
      flagComponent
    );
    world.componentManager.addComponent(
      entity,
      PositionComponent.name,
      positionComponent
    );

    flagSystem.update(world, 0.01); // Initialize

    // Find a non-fixed point
    const nonFixedPoint = flagComponent.points.find(p => !p.isFixed);
    expect(nonFixedPoint).toBeDefined();

    // Simplified - no defensive if check
    console.log(
      `Before second update: nonFixedPoint.position.y = ${nonFixedPoint!.position.y}, nonFixedPoint.previousPosition.y = ${nonFixedPoint!.previousPosition.y}, nonFixedPoint.forces.y = ${nonFixedPoint!.forces.y}`
    );

    flagSystem.update(world, 0.5); // Integrate for 0.5 seconds

    console.log(
      `After second update: nonFixedPoint.position.y = ${nonFixedPoint!.position.y}`
    );

    // Expect position to have changed due to integration
    // Note: In this simulation, the point moves downward due to gravity
    expect(nonFixedPoint!.position.y).toBeLessThan(0);
  });

  it("should satisfy constraints and maintain spring rest lengths (approximately)", () => {
    const entity = world.entityManager.createEntity();
    const flagComponent = new FlagComponent(10, 6, 2, 2); // 2x2 segments
    const positionComponent = new PositionComponent(0, 0, 0);

    world.componentManager.addComponent(
      entity,
      FlagComponent.type,
      flagComponent
    );
    world.componentManager.addComponent(
      entity,
      PositionComponent.name,
      positionComponent
    );

    flagSystem.update(world, 0); // Initialize

    // Displace a non-fixed point to create tension
    const displacedPoint = flagComponent.points[4]; // A non-fixed point (x=1, y=1)
    displacedPoint.position = displacedPoint.position.add(new Vector3(2, 0, 0)); // Move it to create tension

    flagSystem.update(world, 0.1); // Run update to satisfy constraints

    // Check the spring connecting points[4] and points[5]
    const springToCheck = flagComponent.springs.find(
      (s) =>
        (s.p1 === flagComponent.points[4] &&
          s.p2 === flagComponent.points[5]) ||
        (s.p1 === flagComponent.points[5] && s.p2 === flagComponent.points[4])
    );

    // Simplified - expect spring to exist since we control the setup
    expect(springToCheck).toBeDefined();

    const dx = springToCheck!.p2.position.x - springToCheck!.p1.position.x;
    const dy = springToCheck!.p2.position.y - springToCheck!.p1.position.y;
    const dz = springToCheck!.p2.position.z - springToCheck!.p1.position.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    expect(distance).toBeCloseTo(springToCheck!.restLength, 0);
  });
});
