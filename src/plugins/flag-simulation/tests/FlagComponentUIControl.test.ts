import { FlagComponent } from "../FlagComponent";
import { Vector3 } from "../utils/Vector3";

describe("FlagComponent UI Controls", () => {
  it("should update wind vector when windStrength or windDirection changes", () => {
    const flag = new FlagComponent();
    flag.windStrength = 5;
    flag.windDirection = new Vector3(0, 1, 0);
    expect(flag.wind).toEqual(new Vector3(0, 5, 0));

    flag.windStrength = 2;
    flag.windDirection = new Vector3(1, 0, 0);
    expect(flag.wind).toEqual(new Vector3(2, 0, 0));
  });

  it("setWind should update both strength and direction", () => {
    const flag = new FlagComponent();
    flag.setWind(3, new Vector3(0, 0, 1));
    expect(flag.windStrength).toBe(3);
    expect(flag.windDirection).toEqual(new Vector3(0, 0, 1));
    expect(flag.wind).toEqual(new Vector3(0, 0, 3));
  });

  it("should always initialize windDirection as an object with x, y, z", () => {
    // Test with default constructor
    const flag1 = new FlagComponent();
    expect(flag1.windDirection).toEqual({ x: 1, y: 0, z: 0 });

    // Test with null windDirection - should use default
    const flag2 = new FlagComponent(10, 6, 10, 6, 0.1, 0.5, 0.05, "", null, null);
    expect(flag2.windDirection).toEqual({ x: 1, y: 0, z: 0 });

    // Test with valid windDirection
    const flag3 = new FlagComponent(10, 6, 10, 6, 0.1, 0.5, 0.05, "", null, { x: 0.2, y: 0, z: 0 });
    expect(flag3.windDirection).toEqual({ x: 0.2, y: 0, z: 0 });
  });
});

// Integration test for UI property binding simulation
it("should allow UI to bind and update windStrength and windDirection", () => {
  const flag = new FlagComponent();
  // Simulate UI changing windStrength and windDirection
  flag.windStrength = 7;
  flag.windDirection = new Vector3(0.5, 0.5, 0);
  expect(flag.wind).toEqual(new Vector3(3.5, 3.5, 0));
});

describe("FlagComponent Gravity Controls", () => {
  it("should initialize gravity with default values", () => {
    const flag = new FlagComponent();
    expect(flag.gravity).toEqual({ x: 0, y: -9.81, z: 0 });
  });

  it("should allow setting custom gravity values", () => {
    const customGravity = { x: 1, y: -5, z: 2 };
    const flag = new FlagComponent(
      10,
      6,
      10,
      6,
      0.1,
      0.5,
      0.05,
      "",
      0,
      { x: 1, y: 0, z: 0 }, // windDirection
      customGravity
    );
    expect(flag.gravity).toEqual(customGravity);
  });

  it("should handle invalid gravity values", () => {
    // Test with default constructor
    const flag1 = new FlagComponent();
    expect(flag1.gravity).toEqual({ x: 0, y: -9.81, z: 0 });

    // Test with null gravity - should use default
    const flag2 = new FlagComponent(10, 6, 10, 6, 0.1, 0.5, 0.05, "", null, null, null);
    expect(flag2.gravity).toEqual({ x: 0, y: -9.81, z: 0 });

    // Test with valid gravity object
    const flag3 = new FlagComponent(10, 6, 10, 6, 0.1, 0.5, 0.05, "", null, null, { x: 0, y: -5, z: 0 });
    expect(flag3.gravity).toEqual({ x: 0, y: -5, z: 0 });
  });

  it("should allow UI to bind and update gravity", () => {
    const flag = new FlagComponent();
    // Simulate UI changing gravity
    flag.gravity = { x: 0, y: -5, z: 1 };
    expect(flag.gravity).toEqual({ x: 0, y: -5, z: 1 });
  });
});
