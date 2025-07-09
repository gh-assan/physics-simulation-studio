import {
  applyForces,
  integratePositions,
  initializeFlagPhysics,
  satisfyConstraints
} from "../utils/PhysicsHelpers";

describe("PhysicsHelpers", () => {
  it("should have applyForces function", () => {
    expect(typeof applyForces).toBe("function");
    // Ensure it can be called without errors
    expect(() => applyForces()).not.toThrow();
  });

  it("should have integratePositions function", () => {
    expect(typeof integratePositions).toBe("function");
    // Ensure it can be called without errors
    expect(() => integratePositions()).not.toThrow();
  });

  it("should have initializeFlagPhysics function", () => {
    expect(typeof initializeFlagPhysics).toBe("function");
    // Ensure it can be called without errors
    expect(() => initializeFlagPhysics()).not.toThrow();
  });

  it("should have satisfyConstraints function", () => {
    expect(typeof satisfyConstraints).toBe("function");
    // Ensure it can be called without errors
    expect(() => satisfyConstraints()).not.toThrow();
  });
});
