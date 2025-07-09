import {FlagComponent} from '../FlagComponent';

describe('FlagComponent UI Controls', () => {
  it('should update wind vector when windStrength or windDirection changes', () => {
    const flag = new FlagComponent();
    flag.windStrength = 5;
    flag.windDirection = {x: 0, y: 1, z: 0};
    expect(flag.wind).toEqual({x: 0, y: 5, z: 0});

    flag.windStrength = 2;
    flag.windDirection = {x: 1, y: 0, z: 0};
    expect(flag.wind).toEqual({x: 2, y: 0, z: 0});
  });

  it('setWind should update both strength and direction', () => {
    const flag = new FlagComponent();
    flag.setWind(3, {x: 0, y: 0, z: 1});
    expect(flag.windStrength).toBe(3);
    expect(flag.windDirection).toEqual({x: 0, y: 0, z: 1});
    expect(flag.wind).toEqual({x: 0, y: 0, z: 3});
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      undefined as any,
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      null as any,
    );
    expect(flag2.windDirection).toEqual({x: 1, y: 0, z: 0});
    // Pass a partial windDirection as any to simulate bad input
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const flag3 = new FlagComponent(10, 6, 10, 6, 0.1, 0.5, 0.05, '', 2, {
      x: 0.2,
    } as any);
    expect(flag3.windDirection).toEqual({x: 0.2, y: 0, z: 0});
  });
});

// Integration test for UI property binding simulation
it('should allow UI to bind and update windStrength and windDirection', () => {
  const flag = new FlagComponent();
  // Simulate UI changing windStrength and windDirection
  flag.windStrength = 7;
  flag.windDirection = {x: 0.5, y: 0.5, z: 0};
  expect(flag.wind).toEqual({x: 3.5, y: 3.5, z: 0});
});
