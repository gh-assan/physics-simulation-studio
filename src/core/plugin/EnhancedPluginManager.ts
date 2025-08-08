/**
 * EnhancedPluginManager Implementation - Phase 3
 * High-level plugin management orchestrating registry and discovery services
 */

import {
  IPluginManager,
  IPluginRegistry,
  IPluginDiscoveryService,
  IPluginMetadata,
  PluginState
} from './interfaces';
import { PluginRegistry } from './PluginRegistry';
import { PluginDiscoveryService } from './PluginDiscoveryService';

/**
 * High-level plugin manager orchestrating the entire plugin system
 */
export class EnhancedPluginManager implements IPluginManager {
  public readonly registry: IPluginRegistry;
  public readonly discoveryService: IPluginDiscoveryService;

  private readonly stateChangeCallbacks: Array<(pluginName: string, state: PluginState) => void> = [];
  private readonly errorCallbacks: Array<(pluginName: string, error: Error) => void> = [];
  private isInitialized = false;

  constructor(
    registry?: IPluginRegistry,
    discoveryService?: IPluginDiscoveryService
  ) {
    this.registry = registry || new PluginRegistry();
    this.discoveryService = discoveryService || new PluginDiscoveryService();

    this.setupEventHandlers();
  }

  /**
   * Initialize the plugin system
   */
  async initializePluginSystem(): Promise<void> {
    if (this.isInitialized) {
      console.warn('[EnhancedPluginManager] Plugin system already initialized');
      return;
    }

    try {
      console.log('[EnhancedPluginManager] Initializing plugin system...');

      // Discover available plugins
      const availablePlugins = await this.discoveryService.discoverPlugins();
      console.log(`[EnhancedPluginManager] Discovered ${availablePlugins.length} available plugins`);

      this.isInitialized = true;
      console.log('[EnhancedPluginManager] Plugin system initialized successfully');

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const initError = new Error(`Failed to initialize plugin system: ${message}`);
      console.error('[EnhancedPluginManager] Initialization failed:', initError);
      throw initError;
    }
  }

  /**
   * Load all available plugins
   */
  async loadAllPlugins(): Promise<void> {
    this.ensureInitialized();

    const availablePlugins = await this.discoveryService.discoverPlugins();
    console.log(`[EnhancedPluginManager] Loading ${availablePlugins.length} plugins...`);

    // Use Promise.all with individual try/catch for Node.js 8 compatibility
    const results = await Promise.all(
      availablePlugins.map(async (pluginName) => {
        try {
          await this.loadPlugin(pluginName);
          return { status: 'fulfilled' as const, value: undefined };
        } catch (reason) {
          return { status: 'rejected' as const, reason };
        }
      })
    );

    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;

    console.log(`[EnhancedPluginManager] Plugin loading complete: ${successful} successful, ${failed} failed`);

    if (failed > 0) {
      const errors = results
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .map(result => result.reason);

      console.warn('[EnhancedPluginManager] Some plugins failed to load:', errors);
    }
  }

  /**
   * Load a specific plugin
   */
  async loadPlugin(pluginName: string): Promise<void> {
    this.ensureInitialized();

    try {
      console.log(`[EnhancedPluginManager] Loading plugin: ${pluginName}`);

      // Check if already loaded
      if (this.registry.isLoaded(pluginName)) {
        console.log(`[EnhancedPluginManager] Plugin ${pluginName} is already loaded`);
        return;
      }

      // Load plugin instance from discovery service
      const plugin = await this.discoveryService.loadPlugin(pluginName);

      // Register plugin in registry
      await this.registry.register(plugin);

      console.log(`[EnhancedPluginManager] Successfully loaded plugin: ${pluginName}`);

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const loadError = new Error(`Failed to load plugin ${pluginName}: ${message}`);
      this.notifyError(pluginName, loadError);
      throw loadError;
    }
  }

  /**
   * Unload a specific plugin
   */
  async unloadPlugin(pluginName: string): Promise<void> {
    this.ensureInitialized();

    try {
      console.log(`[EnhancedPluginManager] Unloading plugin: ${pluginName}`);

      if (!this.registry.isLoaded(pluginName)) {
        console.warn(`[EnhancedPluginManager] Plugin ${pluginName} is not loaded`);
        return;
      }

      await this.registry.unregister(pluginName);
      console.log(`[EnhancedPluginManager] Successfully unloaded plugin: ${pluginName}`);

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const unloadError = new Error(`Failed to unload plugin ${pluginName}: ${message}`);
      this.notifyError(pluginName, unloadError);
      throw unloadError;
    }
  }

  /**
   * Reload a plugin (unload then load)
   */
  async reloadPlugin(pluginName: string): Promise<void> {
    this.ensureInitialized();

    console.log(`[EnhancedPluginManager] Reloading plugin: ${pluginName}`);

    try {
      // Unload if currently loaded
      if (this.registry.isLoaded(pluginName)) {
        await this.unloadPlugin(pluginName);
      }

      // Load the plugin
      await this.loadPlugin(pluginName);

      console.log(`[EnhancedPluginManager] Successfully reloaded plugin: ${pluginName}`);

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const reloadError = new Error(`Failed to reload plugin ${pluginName}: ${message}`);
      this.notifyError(pluginName, reloadError);
      throw reloadError;
    }
  }

  /**
   * Get list of loaded plugin names
   */
  getLoadedPlugins(): readonly string[] {
    return this.registry.getAllPlugins().map(entry => entry.metadata.name);
  }

  /**
   * Get plugin metadata by name
   */
  getPluginInfo(pluginName: string): IPluginMetadata | undefined {
    const entry = this.registry.getPlugin(pluginName);
    return entry?.metadata;
  }

  /**
   * Register state change callback
   */
  onPluginStateChanged(callback: (pluginName: string, state: PluginState) => void): void {
    this.stateChangeCallbacks.push(callback);
  }

  /**
   * Register error callback
   */
  onPluginError(callback: (pluginName: string, error: Error) => void): void {
    this.errorCallbacks.push(callback);
  }

  // Private methods

  /**
   * Setup event handlers for registry events
   */
  private setupEventHandlers(): void {
    this.registry.onPluginStateChanged((pluginName, state) => {
      this.notifyStateChanged(pluginName, state);
    });

    this.registry.onPluginError((pluginName, error) => {
      this.notifyError(pluginName, error);
    });
  }

  /**
   * Ensure the plugin system is initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('Plugin system not initialized. Call initializePluginSystem() first.');
    }
  }

  /**
   * Notify state change callbacks
   */
  private notifyStateChanged(pluginName: string, state: PluginState): void {
    for (const callback of this.stateChangeCallbacks) {
      try {
        callback(pluginName, state);
      } catch (error) {
        console.error('[EnhancedPluginManager] Error in state change callback:', error);
      }
    }
  }

  /**
   * Notify error callbacks
   */
  private notifyError(pluginName: string, error: Error): void {
    for (const callback of this.errorCallbacks) {
      try {
        callback(pluginName, error);
      } catch (callbackError) {
        console.error('[EnhancedPluginManager] Error in error callback:', callbackError);
      }
    }
  }
}
