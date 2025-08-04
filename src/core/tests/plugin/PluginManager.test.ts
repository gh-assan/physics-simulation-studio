import { PluginManager } from "../../plugin/PluginManager";
import { ISimulationPlugin } from "../../plugin/ISimulationPlugin";
import { World } from "../../ecs";
import { System } from "../../ecs/System";
import { IStudio } from "../../../studio/IStudio";

// Mocks
const mockWorld = {} as World;
const mockStudio = {} as IStudio;

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

  getSystems(studio: IStudio): System[] {
    return [];
  }
}

describe("PluginManager", () => {
  let pluginManager: PluginManager;
  let activationOrder: string[];

  // A spy to track the order of plugin activation
  const originalActivatePlugin = PluginManager.prototype.activatePlugin;
  beforeAll(() => {
    PluginManager.prototype.activatePlugin = async function (
      pluginName: string,
      studio: IStudio
    ) {
      activationOrder.push(pluginName);
      await originalActivatePlugin.call(this, pluginName, studio);
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
    await pluginManager.activatePlugin("A", mockStudio);

    expect(pluginA.registered).toBe(true);
    expect(activationOrder).toEqual(["A"]);
  });

  it("should activate plugins with dependencies in the correct order", async () => {
    const pluginA = new MockPlugin("A");
    const pluginB = new MockPlugin("B", ["A"]);
    pluginManager.registerPlugin(pluginA);
    pluginManager.registerPlugin(pluginB);

    await pluginManager.activatePlugin("B", mockStudio);

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

    await pluginManager.activatePlugin("D", mockStudio);

    expect(pluginA.registered).toBe(true);
    expect(pluginB.registered).toBe(true);
    expect(pluginC.registered).toBe(true);
    expect(pluginD.registered).toBe(true);
    expect(activationOrder).toEqual(["D", "C", "B", "A"]);
  });

  it("should throw an error for missing dependencies", async () => {
    const pluginB = new MockPlugin("B");
    pluginManager.registerPlugin(pluginB);

    await expect(pluginManager.activatePlugin("B", mockStudio)).rejects.toThrow(
      'Plugin "A" not found. Make sure it is registered.'
    );
  });

  it("should deactivate a plugin", async () => {
    const pluginA = new MockPlugin("A");
    pluginManager.registerPlugin(pluginA);
    await pluginManager.activatePlugin("A", mockStudio);
    pluginManager.deactivatePlugin("A", mockStudio);

    expect(pluginA.unregistered).toBe(true);
  });
});
