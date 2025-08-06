import { IPluginManager } from "../../core/plugin/IPluginManager";
import { Logger } from "../../core/utils/Logger";

/**
 * Plugin discovery service that automatically loads available plugins
 * This allows the core system to be plugin-agnostic while still discovering plugins at runtime
 */
export class PluginDiscoveryService {
  private pluginManager: IPluginManager;
  private discoveredPlugins: Map<string, () => Promise<any>> = new Map();

  constructor(pluginManager: IPluginManager) {
    this.pluginManager = pluginManager;
    this.setupPluginRegistry();
  }

  /**
   * Register available plugins - this can be extended or made dynamic
   */
  private setupPluginRegistry(): void {
    // Register plugin factories - plugins are loaded only when needed
    this.discoveredPlugins.set('flag-simulation', async () => {
      const { FlagSimulationPlugin } = await import('../../plugins/flag-simulation');
      return new FlagSimulationPlugin();
    });

    this.discoveredPlugins.set('water-simulation', async () => {
      const { WaterSimulationPlugin } = await import('../../plugins/water-simulation');
      return new WaterSimulationPlugin();
    });

    this.discoveredPlugins.set('solar-system', async () => {
      const { SolarSystemPlugin } = await import('../../plugins/solar-system');
      return new SolarSystemPlugin();
    });

    Logger.getInstance().log(`[PluginDiscovery] Discovered ${this.discoveredPlugins.size} plugins`);
  }

  /**
   * Load a plugin by name if it's available
   */
  public async loadPlugin(pluginName: string): Promise<boolean> {
    const pluginFactory = this.discoveredPlugins.get(pluginName);
    if (!pluginFactory) {
      Logger.getInstance().warn(`[PluginDiscovery] Plugin '${pluginName}' not found`);
      return false;
    }

    try {
      // Check if plugin is already registered
      if (this.pluginManager.getPlugin(pluginName)) {
        Logger.getInstance().log(`[PluginDiscovery] Plugin '${pluginName}' already loaded`);
        return true;
      }

      // Load and register the plugin
      const plugin = await pluginFactory();
      this.pluginManager.registerPlugin(plugin);
      Logger.getInstance().log(`[PluginDiscovery] Successfully loaded plugin '${pluginName}'`);
      return true;
    } catch (error) {
      Logger.getInstance().error(`[PluginDiscovery] Failed to load plugin '${pluginName}':`, error);
      return false;
    }
  }

  /**
   * Load all discovered plugins
   */
  public async loadAllPlugins(): Promise<string[]> {
    const loadedPlugins: string[] = [];
    
    for (const [pluginName] of this.discoveredPlugins) {
      const loaded = await this.loadPlugin(pluginName);
      if (loaded) {
        loadedPlugins.push(pluginName);
      }
    }

    Logger.getInstance().log(`[PluginDiscovery] Loaded ${loadedPlugins.length} plugins: ${loadedPlugins.join(', ')}`);
    return loadedPlugins;
  }

  /**
   * Get list of available plugin names
   */
  public getAvailablePluginNames(): string[] {
    return Array.from(this.discoveredPlugins.keys());
  }

  /**
   * Check if a plugin is available for loading
   */
  public isPluginAvailable(pluginName: string): boolean {
    return this.discoveredPlugins.has(pluginName);
  }
}
