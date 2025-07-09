import {World} from '../ecs';
import {ISimulationPlugin} from './ISimulationPlugin';

export class PluginManager {
  private availablePlugins = new Map<string, ISimulationPlugin>();
  private activePlugins = new Map<string, ISimulationPlugin>();
  private world: World;

  constructor(world: World) {
    this.world = world;
  }

  public registerPlugin(plugin: ISimulationPlugin): void {
    this.availablePlugins.set(plugin.getName(), plugin);
  }

  public async activatePlugin(pluginName: string): Promise<void> {
    if (this.activePlugins.has(pluginName)) {
      return; // Already active
    }

    const plugin = this.availablePlugins.get(pluginName);
    if (!plugin) {
      throw new Error(
        `Plugin "${pluginName}" not found. Make sure it is registered.`,
      );
    }

    // Resolve and activate dependencies recursively
    const dependencies = plugin.getDependencies();
    for (const depName of dependencies) {
      await this.activatePlugin(depName);
    }

    // Register the plugin itself
    plugin.register(this.world);
    this.activePlugins.set(pluginName, plugin);
    console.log(`Plugin "${pluginName}" activated.`);
  }

  public getPlugin(pluginName: string): ISimulationPlugin | undefined {
    return this.availablePlugins.get(pluginName);
  }

  public getAvailablePluginNames(): string[] {
    return Array.from(this.availablePlugins.keys());
  }

  public deactivatePlugin(pluginName: string): void {
    const plugin = this.activePlugins.get(pluginName);
    if (plugin) {
      plugin.unregister();
      this.activePlugins.delete(pluginName);
      console.log(`Plugin "${pluginName}" deactivated.`);
    }
  }
}
