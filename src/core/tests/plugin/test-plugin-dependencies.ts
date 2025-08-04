import { PluginManager } from "../../plugin/PluginManager";
import { ISimulationPlugin } from "../../plugin/ISimulationPlugin";
import { World } from "../../ecs";
import { System } from "../../ecs/System";
import { IStudio } from "../../../studio/IStudio";

// Create a mock World
const mockWorld = {} as World;
const mockStudio = {} as IStudio;

// Create a simple plugin class
class TestPlugin implements ISimulationPlugin {
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
    console.log(`Plugin ${this.name} registered`);
  }

  unregister(): void {
    console.log(`Plugin ${this.name} unregistered`);
  }

  initializeEntities(world: World): void {
    // No-op for this test
  }

  getSystems(studio: IStudio): System[] {
    return [];
  }
}

async function testPluginDependencies() {
  // Create a plugin manager
  const pluginManager = new PluginManager(mockWorld);

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

  try {
    // Activate plugin D, which should activate C, B, and A in the correct order
    console.log("Activating plugin D...");
    await pluginManager.activatePlugin("D", mockStudio);
    console.log("All plugins activated successfully!");
  } catch (error) {
    console.error("Error activating plugins:", error);
  }
}

// Run the test
testPluginDependencies().catch((error) => {
  console.error("Unhandled error:", error);
});
