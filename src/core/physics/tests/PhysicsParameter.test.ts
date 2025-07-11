import { PhysicsParameter } from "../PhysicsParameter";

describe("PhysicsParameter", () => {
  it("should initialize with the given value and constraints", () => {
    const param = new PhysicsParameter(5, 0, 10, 1);
    expect(param.value).toBe(5);
    expect(param.min).toBe(0);
    expect(param.max).toBe(10);
    expect(param.step).toBe(1);
  });

  it("should clamp the initial value if it's outside the range", () => {
    const param1 = new PhysicsParameter(-5, 0, 10, 1);
    expect(param1.value).toBe(0);

    const param2 = new PhysicsParameter(15, 0, 10, 1);
    expect(param2.value).toBe(10);
  });

  it("should update the value and clamp it if it's outside the range", () => {
    const param = new PhysicsParameter(5, 0, 10, 1);

    param.value = 7;
    expect(param.value).toBe(7);

    param.value = -2;
    expect(param.value).toBe(0);

    param.value = 12;
    expect(param.value).toBe(10);
  });

  it("should return the current value using get()", () => {
    const param = new PhysicsParameter(5, 0, 10, 1);
    expect(param.get()).toBe(5);
  });

  it("should set the value using set() and clamp it", () => {
    const param = new PhysicsParameter(5, 0, 10, 1);
    param.set(8);
    expect(param.value).toBe(8);
    param.set(-1);
    expect(param.value).toBe(0);
  });
});
