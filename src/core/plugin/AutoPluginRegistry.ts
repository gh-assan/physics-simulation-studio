import { ISimulationPlugin } from '../../core/plugin/ISimulationPlugin';
import { IWorld } from '../../core/ecs/IWorld';
import { Logger } from '../../core/utils/Logger';

/**
 * Auto-discovery plugin registry that scans for plugins implementing ISimulationPlugin
 * and automatically registers them without requiring manual registration
 */
export class AutoPluginRegistry {
  private static instance: AutoPluginRegistry;
  private discoveredPlugins: Map<string, ISimulationPlugin> = new Map();
  private registeredPlugins: Set<string> = new Set();

  static getInstance(): AutoPluginRegistry {
    if (!AutoPluginRegistry.instance) {
      AutoPluginRegistry.instance = new AutoPluginRegistry();
    }
    return AutoPluginRegistry.instance;
  }

  /**
   * Scan and discover all plugins by trying to import them
   */
  async discoverPlugins(): Promise<void> {
    Logger.getInstance().log('[AutoPluginRegistry] Starting plugin discovery...');

    // List of plugin modules to scan - this could be made dynamic
    const pluginModules = [
      '../../plugins/flag-simulation',
      '../../plugins/water-simulation',
      '../../plugins/solar-system',
      '../../plugins/rigid-body',
      '../../plugins/simple-physics'
    ];

    const discoveryPromises = pluginModules.map(async (modulePath) => {
      try {
        Logger.getInstance().log(`[AutoPluginRegistry] Scanning ${modulePath}...`);

        const module = await import(modulePath);

        // Look for default export or named exports that implement ISimulationPlugin
        const pluginCandidates = [];

        if (module.default) {
          pluginCandidates.push({ name: 'default', plugin: module.default });
        }

        // Check named exports
        Object.keys(module).forEach(exportName => {
          if (exportName !== 'default' && typeof module[exportName] === 'function') {
            pluginCandidates.push({ name: exportName, plugin: module[exportName] });
          }
        });

        // Test each candidate to see if it implements ISimulationPlugin
        for (const candidate of pluginCandidates) {
          try {
            let pluginInstance;

            if (typeof candidate.plugin === 'function') {
              pluginInstance = new candidate.plugin();
            } else {
              pluginInstance = candidate.plugin;
            }

            // Check if it implements the required ISimulationPlugin interface
            if (this.isValidPlugin(pluginInstance)) {
              const pluginName = pluginInstance.getName();
              this.discoveredPlugins.set(pluginName, pluginInstance);
              Logger.getInstance().log(`[AutoPluginRegistry] ✅ Discovered plugin: ${pluginName}`);
            }
          } catch (error) {
            Logger.getInstance().log(`[AutoPluginRegistry] ⚠️ Candidate ${candidate.name} is not a valid plugin: ${(error as Error).message}`);
          }
        }

      } catch (error) {
        Logger.getInstance().log(`[AutoPluginRegistry] ⚠️ Could not load module ${modulePath}: ${(error as Error).message}`);
      }
    });

    await Promise.all(discoveryPromises);
    Logger.getInstance().log(`[AutoPluginRegistry] Discovery complete. Found ${this.discoveredPlugins.size} plugins.`);
  }

  /**
   * Check if an object implements the ISimulationPlugin interface
   */
  private isValidPlugin(obj: any): obj is ISimulationPlugin {
    return (
      obj &&
      typeof obj.getName === 'function' &&
      typeof obj.getDependencies === 'function' &&
      typeof obj.register === 'function' &&
      typeof obj.unregister === 'function' &&
      typeof obj.initializeEntities === 'function' &&
      typeof obj.getSystems === 'function'
    );
  }

  /**
   * Auto-register all discovered plugins with the world and plugin manager
   */
  async autoRegisterPlugins(world: IWorld, pluginManager: any, studio: any): Promise<string[]> {
    const registeredNames: string[] = [];

    Logger.getInstance().log('[AutoPluginRegistry] Starting auto-registration...');

    for (const [pluginName, pluginInstance] of this.discoveredPlugins) {
      if (this.registeredPlugins.has(pluginName)) {
        Logger.getInstance().log(`[AutoPluginRegistry] Plugin ${pluginName} already registered, skipping...`);
        continue;
      }

      try {
        Logger.getInstance().log(`[AutoPluginRegistry] Auto-registering plugin: ${pluginName}`);

        // 1. Call the plugin's register method
        pluginInstance.register(world);

        // 2. Get and register systems
        const systems = pluginInstance.getSystems(studio);
        systems.forEach(system => {
          world.registerSystem(system);
          Logger.getInstance().log(`[AutoPluginRegistry] Registered system from ${pluginName}`);
        });

        // 3. Register with plugin manager (if it has this method)
        if (pluginManager && pluginManager.registerPlugin) {
          pluginManager.registerPlugin(pluginInstance);
        }

        // 4. Initialize entities
        pluginInstance.initializeEntities(world);

        this.registeredPlugins.add(pluginName);
        registeredNames.push(pluginName);

        Logger.getInstance().log(`[AutoPluginRegistry] ✅ Successfully registered plugin: ${pluginName}`);

      } catch (error) {
        Logger.getInstance().error(`[AutoPluginRegistry] ❌ Failed to register plugin ${pluginName}:`, error);
      }
    }

    Logger.getInstance().log(`[AutoPluginRegistry] Auto-registration complete. Registered ${registeredNames.length} plugins.`);
    return registeredNames;
  }

  /**
   * Get all discovered plugins
   */
  getDiscoveredPlugins(): Map<string, ISimulationPlugin> {
    return new Map(this.discoveredPlugins);
  }

  /**
   * Get a specific plugin by name
   */
  getPlugin(name: string): ISimulationPlugin | undefined {
    return this.discoveredPlugins.get(name);
  }

  /**
   * Get all plugin names
   */
  getPluginNames(): string[] {
    return Array.from(this.discoveredPlugins.keys());
  }

  /**
   * Check if a plugin is registered
   */
  isPluginRegistered(name: string): boolean {
    return this.registeredPlugins.has(name);
  }
}

export default AutoPluginRegistry;
