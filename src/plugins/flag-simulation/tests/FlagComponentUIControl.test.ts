import {FlagComponent} from '../FlagComponent';
import {Vector3} from '../utils/Vector3';

describe('FlagComponent UI Controls', () => {
  it('should update wind vector when windStrength or windDirection changes', () => {
    const flag = new FlagComponent();
    flag.windStrength = 5;
    flag.windDirection = new Vector3(0, 1, 0);
    expect(flag.wind).toEqual(new Vector3(0, 5, 0));

    flag.windStrength = 2;
    flag.windDirection = new Vector3(1, 0, 0);
    expect(flag.wind).toEqual(new Vector3(2, 0, 0));
  });

  it('setWind should update both strength and direction', () => {
    const flag = new FlagComponent();
    flag.setWind(3, new Vector3(0, 0, 1));
    expect(flag.windStrength).toBe(3);
    expect(flag.windDirection).toEqual(new Vector3(0, 0, 1));
    expect(flag.wind).toEqual(new Vector3(0, 0, 3));
  });

  it('should always initialize windDirection as an object with x, y, z', () => {
    const flag1 = new FlagComponent(
      10,
      6,
      10,
      6,
      0.1,
      0.5,
      0.05,
      '',
      2,
      undefined as any, // Intentionally testing with undefined to check default behavior
    );
    expect(flag1.windDirection).toEqual({x: 1, y: 0, z: 0});
    const flag2 = new FlagComponent(
      10,
      6,
      10,
      6,
      0.1,
      0.5,
      0.05,
      '',
      2,
      null as any, // Intentionally testing with null to check default behavior
    );
    expect(flag2.windDirection).toEqual({x: 1, y: 0, z: 0});
    // Pass a partial windDirection as any to simulate bad input
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const flag3 = new FlagComponent(10, 6, 10, 6, 0.1, 0.5, 0.05, '', 2, {
      x: 0.2,
    } as any); // Intentionally testing with partial object to check default behavior
    expect(flag3.windDirection).toEqual(new Vector3(0.2, 0, 0));
  });
});

// Integration test for UI property binding simulation
it('should allow UI to bind and update windStrength and windDirection', () => {
  const flag = new FlagComponent();
  // Simulate UI changing windStrength and windDirection
  flag.windStrength = 7;
  flag.windDirection = new Vector3(0.5, 0.5, 0);
  expect(flag.wind).toEqual(new Vector3(3.5, 3.5, 0));
});
