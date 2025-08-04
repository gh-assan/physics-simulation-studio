import { RigidBodyComponent } from "../components";
import RAPIER from "@dimforge/rapier3d-compat";
import { IRigidBody } from "../../../core/physics/IRigidBody";

describe("RigidBodyComponent", () => {
  it("should correctly store a Rapier RigidBody instance", () => {
    // Mock a Rapier RigidBody
    const mockRigidBody: IRigidBody = {
      getPosition: jest.fn(),
      getRotation: jest.fn(),
      applyImpulse: jest.fn(),
    };
    const component = new RigidBodyComponent(mockRigidBody);
    expect(component.body).toBe(mockRigidBody);
  });
});
