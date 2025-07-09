import {applyForces, initializeFlagPhysics} from '../utils/PhysicsHelpers';
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
});
