import { PluginManager } from "../PluginManager";
import { ISimulationPlugin } from "../ISimulationPlugin";
import { World } from "../../ecs";

// Mocks
const mockWorld = {} as World;

class MockPlugin implements ISimulationPlugin {
  public registered = false;
  public unregistered = false;

  constructor(
    private name: string,
    private dependencies: string[] = []
  ) {}

  getName(): string {
    return this.name;
  }

  getDependencies(): string[] {
    return this.dependencies;
  }

  register(world: World): void {
    this.registered = true;
  }

  unregister(): void {
    this.unregistered = true;
  }

  initializeEntities(world: World): void {
    // Mock implementation
  }
}

describe("PluginManager", () => {
  let pluginManager: PluginManager;
  let activationOrder: string[];

  // A spy to track the order of plugin activation
  const originalActivatePlugin = PluginManager.prototype.activatePlugin;
  beforeAll(() => {
    PluginManager.prototype.activatePlugin = async function (
      pluginName: string
    ) {
      activationOrder.push(pluginName);
      await originalActivatePlugin.call(this, pluginName);
    };
  });

  afterAll(() => {
    PluginManager.prototype.activatePlugin = originalActivatePlugin;
  });

  beforeEach(() => {
    pluginManager = new PluginManager(mockWorld);
    activationOrder = [];
  });

  it("should register and activate a simple plugin", async () => {
    const pluginA = new MockPlugin("A");
    pluginManager.registerPlugin(pluginA);
    await pluginManager.activatePlugin("A");

    expect(pluginA.registered).toBe(true);
    expect(activationOrder).toEqual(["A"]);
  });

  it("should activate plugins with dependencies in the correct order", async () => {
    const pluginA = new MockPlugin("A");
    const pluginB = new MockPlugin("B", ["A"]);
    pluginManager.registerPlugin(pluginA);
    pluginManager.registerPlugin(pluginB);

    await pluginManager.activatePlugin("B");

    expect(pluginA.registered).toBe(true);
    expect(pluginB.registered).toBe(true);
    expect(activationOrder).toEqual(["B", "A"]);
  });

  it("should handle complex dependency chains", async () => {
    const pluginA = new MockPlugin("A");
    const pluginB = new MockPlugin("B", ["A"]);
    const pluginC = new MockPlugin("C", ["B"]);
    const pluginD = new MockPlugin("D", ["C"]);

    pluginManager.registerPlugin(pluginA);
    pluginManager.registerPlugin(pluginB);
    pluginManager.registerPlugin(pluginC);
    pluginManager.registerPlugin(pluginD);

    await pluginManager.activatePlugin("D");

    expect(pluginA.registered).toBe(true);
    expect(pluginB.registered).toBe(true);
    expect(pluginC.registered).toBe(true);
    expect(pluginD.registered).toBe(true);
    expect(activationOrder).toEqual(["D", "C", "B", "A"]);
  });

  it("should throw an error for missing dependencies", async () => {
    const pluginB = new MockPlugin("B", ["A"]);
    pluginManager.registerPlugin(pluginB);

    await expect(pluginManager.activatePlugin("B")).rejects.toThrow(
      'Plugin "A" not found. Make sure it is registered.'
    );
  });

  it("should deactivate a plugin", async () => {
    const pluginA = new MockPlugin("A");
    pluginManager.registerPlugin(pluginA);
    await pluginManager.activatePlugin("A");
    pluginManager.deactivatePlugin("A");

    expect(pluginA.unregistered).toBe(true);
  });
});
