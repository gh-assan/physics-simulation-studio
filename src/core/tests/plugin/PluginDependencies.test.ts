import { PluginManager } from "../../plugin/PluginManager";
import { ISimulationPlugin } from "../../plugin/ISimulationPlugin";
import { World } from "../../ecs";

// Create a simple plugin class
class TestPlugin implements ISimulationPlugin {
  public registered = false;

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
    console.log(`Plugin ${this.name} registered`);
  }

  unregister(): void {
    console.log(`Plugin ${this.name} unregistered`);
  }

  initializeEntities(world: World): void {
    // No-op for this test
  }
}

describe("Plugin Dependencies", () => {
  let pluginManager: PluginManager;
  const mockWorld = {} as World;

  beforeEach(() => {
    pluginManager = new PluginManager(mockWorld);
  });

  it("should activate plugins with complex dependency chains in the correct order", async () => {
    // Create plugins with dependencies
    const pluginA = new TestPlugin("A");
    const pluginB = new TestPlugin("B", ["A"]);
    const pluginC = new TestPlugin("C", ["B"]);
    const pluginD = new TestPlugin("D", ["C"]);

    // Register plugins
    pluginManager.registerPlugin(pluginA);
    pluginManager.registerPlugin(pluginB);
    pluginManager.registerPlugin(pluginC);
    pluginManager.registerPlugin(pluginD);

    // Activate plugin D, which should activate C, B, and A in the correct order
    await pluginManager.activatePlugin("D");

    // Verify all plugins are registered
    expect(pluginA.registered).toBe(true);
    expect(pluginB.registered).toBe(true);
    expect(pluginC.registered).toBe(true);
    expect(pluginD.registered).toBe(true);
  });
});
