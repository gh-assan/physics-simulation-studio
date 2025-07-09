import {
  applyForces,
  initializeFlagPhysics,
  integratePositions,
  satisfyConstraints,
} from '../utils/PhysicsHelpers';
import {FlagComponent} from '../FlagComponent';
import {PositionComponent} from '../../../core/components/PositionComponent';
import {Vector3} from '../utils/Vector3';

describe('PhysicsHelpers', () => {
  it('should apply gravity and wind forces correctly', () => {
    const flag = new FlagComponent();
    flag.points = [
      {
        position: new Vector3(0, 0, 0),
        previousPosition: new Vector3(0, 0, 0),
        velocity: new Vector3(0, 0, 0),
        forces: new Vector3(0, 0, 0),
        mass: 1,
        isFixed: false,
      },
    ];
    flag.windStrength = 5;
    flag.windDirection = new Vector3(1, 0, 0);

    const gravity = new Vector3(0, -9.81, 0);
    applyForces(flag, gravity);

    expect(flag.points[0].forces).toEqual(new Vector3(5, -9.81, 0));
  });

  it('should initialize flag physics correctly', () => {
    const flag = new FlagComponent();
    const position = new PositionComponent(0, 0, 0);

    initializeFlagPhysics(flag, position);

    expect(flag.points).toBeDefined();
    expect(flag.springs).toBeDefined();
    // Add more specific assertions based on the initialization logic
  });

  it('should integrate point mass positions using Verlet integration', () => {
    const flag = new FlagComponent();
    flag.points = [
      {
        position: new Vector3(0, 0, 0),
        previousPosition: new Vector3(0, 0, 0),
        velocity: new Vector3(0, 0, 0),
        forces: new Vector3(0, -9.81, 0), // Apply gravity force
        mass: 1,
        isFixed: false,
      },
    ];

    integratePositions(flag, 1); // deltaTime = 1

    // Expected position after 1 second due to gravity (initial velocity 0)
    // new_pos = current_pos + (current_pos - prev_pos) + acc * dt^2
    // new_pos.y = 0 + (0 - 0) + (-9.81/1) * 1^2 = -9.81
    expect(flag.points[0].position.y).toBeCloseTo(-9.81);
  });

  it('should satisfy constraints and maintain spring rest lengths', () => {
    const flag = new FlagComponent();
    flag.points = [
      {
        position: new Vector3(0, 0, 0),
        previousPosition: new Vector3(0, 0, 0),
        velocity: new Vector3(0, 0, 0),
        forces: new Vector3(0, 0, 0),
        mass: 1,
        isFixed: false,
      },
      {
        position: new Vector3(5, 0, 0),
        previousPosition: new Vector3(5, 0, 0),
        velocity: new Vector3(0, 0, 0),
        forces: new Vector3(0, 0, 0),
        mass: 1,
        isFixed: false,
      },
    ];
    flag.springs = [
      {
        p1: flag.points[0],
        p2: flag.points[1],
        restLength: 10, // Rest length is 10, but current distance is 5
        stiffness: 0.5,
        damping: 0,
        type: 'structural',
      },
    ];

    satisfyConstraints(flag); // Run with default iterations (20)

    const distance = flag.points[1].position
      .subtract(flag.points[0].position)
      .magnitude();
    expect(distance).toBeCloseTo(10); // Should be closer to 10
  });
});
