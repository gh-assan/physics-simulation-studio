import { PhysicsSystem } from "../system";
import { World } from "@core/ecs";
import { PositionComponent, RotationComponent } from "@core/components";
import { RigidBodyComponent } from "../components";
import RAPIER from "@dimforge/rapier3d-compat";
jest.mock("@dimforge/rapier3d-compat", () => ({
  __esModule: true,
  default: {
    init: jest.fn(() => Promise.resolve()),
    World: jest.fn().mockImplementation(() => ({
      step: jest.fn(),
      timestep: 0
    })),
    Vector3: jest.fn().mockImplementation((x, y, z) => ({ x, y, z })),
    Quaternion: jest.fn().mockImplementation((x, y, z, w) => ({ x, y, z, w }))
  }
}));

describe("PhysicsSystem", () => {
  let world: World;
  let physicsSystem: PhysicsSystem;

  beforeEach(async () => {
    await RAPIER.init();
    world = new World();
    physicsSystem = new PhysicsSystem();

    world.componentManager.registerComponent(PositionComponent);
    world.componentManager.registerComponent(RotationComponent);
    world.componentManager.registerComponent(RigidBodyComponent);
  });

  it("should synchronize rigid body translation and rotation to ECS components", () => {
    const entity = world.entityManager.createEntity();

    const mockTranslation = new RAPIER.Vector3(10, 20, 30);
    const mockRotation = new RAPIER.Quaternion(0.1, 0.2, 0.3, 0.4);

    const mockRigidBody = {
      translation: () => mockTranslation,
      rotation: () => mockRotation
    } as RAPIER.RigidBody;

    const rigidBodyComp = new RigidBodyComponent(mockRigidBody);
    const posComp = new PositionComponent(0, 0, 0);
    const rotComp = new RotationComponent(0, 0, 0, 0);

    world.componentManager.addComponent(
      entity,
      RigidBodyComponent.name,
      rigidBodyComp
    );
    world.componentManager.addComponent(
      entity,
      PositionComponent.name,
      posComp
    );
    world.componentManager.addComponent(
      entity,
      RotationComponent.name,
      rotComp
    );

    physicsSystem.update(world, 0.16);

    expect(posComp.x).toBe(mockTranslation.x);
    expect(posComp.y).toBe(mockTranslation.y);
    expect(posComp.z).toBe(mockTranslation.z);

    expect(rotComp.x).toBe(mockRotation.x);
    expect(rotComp.y).toBe(mockRotation.y);
    expect(rotComp.z).toBe(mockRotation.z);
    expect(rotComp.w).toBe(mockRotation.w);
  });
});
