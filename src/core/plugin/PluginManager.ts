import { Logger } from "../utils/Logger";
import { World } from "../ecs";
import { ISimulationPlugin } from "./ISimulationPlugin";
import { EventEmitter } from "../events/EventEmitter";

/**
 * Events emitted by the PluginManager
 */
export enum PluginManagerEvent {
  PLUGIN_REGISTERED = "plugin:registered",
  PLUGIN_ACTIVATED = "plugin:activated",
  PLUGIN_DEACTIVATED = "plugin:deactivated",
  PLUGIN_ERROR = "plugin:error"
}

/**
 * Manages the registration, activation, and deactivation of plugins.
 * Handles plugin dependencies and lifecycle.
 */
export class PluginManager {
  /**
   * Map of available plugins by name.
   */
  private availablePlugins = new Map<string, ISimulationPlugin>();

  /**
   * Map of currently active plugins by name.
   */
  private activePlugins = new Map<string, ISimulationPlugin>();

  /**
   * The world instance that plugins will interact with.
   */
  private world: World;

  /**
   * Event emitter for plugin-related events.
   */
  private eventEmitter = new EventEmitter();

  /**
   * Creates a new PluginManager.
   *
   * @param world The world instance that plugins will interact with
   */
  constructor(world: World) {
    this.world = world;
  }

  /**
   * Registers a plugin with the manager.
   * Emits a PLUGIN_REGISTERED event.
   *
   * @param plugin The plugin to register
   * @throws Error if a plugin with the same name is already registered
   */
  public registerPlugin(plugin: ISimulationPlugin): void {
    const pluginName = plugin.getName();

    if (this.availablePlugins.has(pluginName)) {
      throw new Error(`Plugin "${pluginName}" is already registered.`);
    }

    this.availablePlugins.set(pluginName, plugin);
    this.eventEmitter.emit(PluginManagerEvent.PLUGIN_REGISTERED, plugin);
  }

  /**
   * Activates a plugin and its dependencies.
   * Emits a PLUGIN_ACTIVATED event.
   *
   * @param pluginName The name of the plugin to activate
   * @returns A promise that resolves when the plugin is activated
   * @throws Error if the plugin is not found
   */
  public async activatePlugin(pluginName: string): Promise<void> {
    // Skip if already active
    if (this.isPluginActive(pluginName)) {
      return;
    }

    const plugin = this.getPluginOrThrow(pluginName);

    try {
      // Activate dependencies first
      await this.activateDependencies(plugin);

      // Register the plugin with the world
      plugin.register(this.world);

      // Mark as active
      this.activePlugins.set(pluginName, plugin);

      // Emit event
      this.eventEmitter.emit(PluginManagerEvent.PLUGIN_ACTIVATED, plugin);

      Logger.log(`Plugin "${pluginName}" activated.`);
    } catch (error) {
      this.handlePluginError(pluginName, "activation", error);
      throw error;
    }
  }

  /**
   * Gets a plugin by name.
   *
   * @param pluginName The name of the plugin
   * @returns The plugin, or undefined if not found
   */
  public getPlugin(pluginName: string): ISimulationPlugin | undefined {
    return this.availablePlugins.get(pluginName);
  }

  /**
   * Gets the names of all available plugins.
   *
   * @returns An array of plugin names
   */
  public getAvailablePluginNames(): string[] {
    return Array.from(this.availablePlugins.keys());
  }

  /**
   * Gets the names of all active plugins.
   *
   * @returns An array of plugin names
   */
  public getActivePluginNames(): string[] {
    return Array.from(this.activePlugins.keys());
  }

  /**
   * Deactivates a plugin.
   * Emits a PLUGIN_DEACTIVATED event.
   *
   * @param pluginName The name of the plugin to deactivate
   * @returns True if the plugin was deactivated, false if it wasn't active
   */
  public deactivatePlugin(pluginName: string): boolean {
    const plugin = this.activePlugins.get(pluginName);

    if (!plugin) {
      return false;
    }

    try {
      plugin.unregister();
      this.activePlugins.delete(pluginName);

      this.eventEmitter.emit(PluginManagerEvent.PLUGIN_DEACTIVATED, plugin);

      Logger.log(`Plugin "${pluginName}" deactivated.`);
      return true;
    } catch (error) {
      this.handlePluginError(pluginName, "deactivation", error);
      return false;
    }
  }

  /**
   * Registers a callback for a plugin event.
   *
   * @param event The event to listen for
   * @param callback The callback function
   * @returns A function that can be called to remove the listener
   */
  public on(event: PluginManagerEvent, callback: Function): () => void {
    return this.eventEmitter.on(event, callback);
  }

  public onPluginRegistered(callback: (plugin: ISimulationPlugin) => void): () => void {
    return this.eventEmitter.on(PluginManagerEvent.PLUGIN_REGISTERED, callback);
  }

  public onPluginActivated(callback: (plugin: ISimulationPlugin) => void): () => void {
    return this.eventEmitter.on(PluginManagerEvent.PLUGIN_ACTIVATED, callback);
  }

  public onPluginDeactivated(callback: (plugin: ISimulationPlugin) => void): () => void {
    return this.eventEmitter.on(PluginManagerEvent.PLUGIN_DEACTIVATED, callback);
  }

  public onPluginError(callback: (pluginName: string, operation: string, error: any) => void): () => void {
    return this.eventEmitter.on(PluginManagerEvent.PLUGIN_ERROR, callback);
  }

  public onPluginsChanged(callback: () => void): () => void {
    return this.eventEmitter.on(PluginManagerEvent.PLUGIN_REGISTERED, callback);
  }

  /**
   * Checks if a plugin is active.
   *
   * @param pluginName The name of the plugin
   * @returns True if the plugin is active, false otherwise
   * @private
   */
  private isPluginActive(pluginName: string): boolean {
    return this.activePlugins.has(pluginName);
  }

  /**
   * Gets a plugin by name, throwing an error if not found.
   *
   * @param pluginName The name of the plugin
   * @returns The plugin
   * @throws Error if the plugin is not found
   * @private
   */
  private getPluginOrThrow(pluginName: string): ISimulationPlugin {
    const plugin = this.availablePlugins.get(pluginName);

    if (!plugin) {
      throw new Error(
        `Plugin "${pluginName}" not found. Make sure it is registered.`
      );
    }

    return plugin;
  }

  /**
   * Activates all dependencies of a plugin.
   *
   * @param plugin The plugin whose dependencies to activate
   * @returns A promise that resolves when all dependencies are activated
   * @private
   */
  private async activateDependencies(plugin: ISimulationPlugin): Promise<void> {
    const dependencies = plugin.getDependencies();

    // Activate dependencies sequentially to ensure proper dependency resolution
    for (const depName of dependencies) {
      await this.activatePlugin(depName);
    }
  }

  /**
   * Handles a plugin error.
   * Emits a PLUGIN_ERROR event.
   *
   * @param pluginName The name of the plugin
   * @param operation The operation that failed
   * @param error The error that occurred
   * @private
   */
  private handlePluginError(
    pluginName: string,
    operation: string,
    error: any
  ): void {
    Logger.error(`Error during plugin "${pluginName}" ${operation}:`, error);

    this.eventEmitter.emit(
      PluginManagerEvent.PLUGIN_ERROR,
      pluginName,
      operation,
      error
    );
  }
}
