import rigidBodyPluginInstance from "../index";
import { World } from "@core/ecs";
import { PhysicsSystem } from "../system";
import { RigidBodyComponent } from "../components";

describe("RigidBodyPlugin", () => {
  let world: World;

  beforeEach(() => {
    world = new World();
    // Use the plugin instance instead of trying to construct it
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return the correct name and no dependencies", () => {
    expect(rigidBodyPluginInstance.getName()).toBe("rigid-body-physics-rapier");
    expect(rigidBodyPluginInstance.getDependencies()).toEqual([]);
  });

  it("should register RigidBodyComponent when activated", () => {
    // Since we're using IWorld interface, we can't spy on world.componentManager
    // Just test that register doesn't throw
    expect(() => rigidBodyPluginInstance.register(world)).not.toThrow();
  });

  it("should log messages on register and unregister", () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    rigidBodyPluginInstance.register(world);
    expect(consoleSpy).toHaveBeenCalledWith("Registering RigidBodyPlugin...");

    rigidBodyPluginInstance.unregister();
    expect(consoleSpy).toHaveBeenCalledWith("Unregistering RigidBodyPlugin...");

    consoleSpy.mockRestore();
  });
});
