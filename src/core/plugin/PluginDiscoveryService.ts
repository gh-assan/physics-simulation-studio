/**
 * PluginDiscoveryService Implementation - Phase 3
 * Enhanced plugin discovery with dynamic loading capabilities
 */

import { IPluginDiscoveryService, IPlugin } from './interfaces';

/**
 * Enhanced plugin discovery service with factory-based plugin loading
 */
export class PluginDiscoveryService implements IPluginDiscoveryService {
  private readonly pluginFactories = new Map<string, () => Promise<IPlugin>>();
  private readonly discoveredPaths = new Set<string>();

  constructor() {
    this.initializeBuiltInPlugins();
  }

  /**
   * Discover all available plugins
   */
  async discoverPlugins(): Promise<readonly string[]> {
    // In a browser environment, we rely on pre-registered factories
    // In Node.js, this could scan filesystem directories
    return Array.from(this.pluginFactories.keys());
  }

  /**
   * Scan a directory for plugins (mock implementation for browser)
   */
  async scanDirectory(path: string): Promise<readonly string[]> {
    this.discoveredPaths.add(path);
    
    // In a real implementation, this would scan the filesystem
    // For now, return empty array as we're in browser environment
    console.log(`[PluginDiscovery] Would scan directory: ${path}`);
    return [];
  }

  /**
   * Load a plugin by name using registered factories
   */
  async loadPlugin(pluginName: string): Promise<IPlugin> {
    const factory = this.pluginFactories.get(pluginName);
    if (!factory) {
      throw new Error(`Plugin factory not found: ${pluginName}`);
    }

    try {
      const plugin = await factory();
      console.log(`[PluginDiscovery] Successfully loaded plugin: ${pluginName}`);
      return plugin;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to load plugin ${pluginName}: ${message}`);
    }
  }

  /**
   * Load a plugin from a specific path (mock implementation)
   */
  async loadPluginFromPath(path: string): Promise<IPlugin> {
    throw new Error(`Dynamic path loading not supported in browser environment: ${path}`);
  }

  /**
   * Register a plugin factory for dynamic loading
   */
  registerPluginFactory(name: string, factory: () => Promise<IPlugin>): void {
    if (this.pluginFactories.has(name)) {
      console.warn(`[PluginDiscovery] Overriding existing factory for plugin: ${name}`);
    }

    this.pluginFactories.set(name, factory);
    console.log(`[PluginDiscovery] Registered factory for plugin: ${name}`);
  }

  /**
   * Get list of available plugin names
   */
  getAvailablePlugins(): readonly string[] {
    return Array.from(this.pluginFactories.keys());
  }

  /**
   * Remove a plugin factory registration
   */
  unregisterPluginFactory(name: string): boolean {
    const existed = this.pluginFactories.has(name);
    if (existed) {
      this.pluginFactories.delete(name);
      console.log(`[PluginDiscovery] Unregistered factory for plugin: ${name}`);
    }
    return existed;
  }

  /**
   * Check if a plugin factory is registered
   */
  hasPluginFactory(name: string): boolean {
    return this.pluginFactories.has(name);
  }

  /**
   * Get the number of registered plugin factories
   */
  getFactoryCount(): number {
    return this.pluginFactories.size;
  }

  /**
   * Clear all registered plugin factories
   */
  clearFactories(): void {
    const count = this.pluginFactories.size;
    this.pluginFactories.clear();
    console.log(`[PluginDiscovery] Cleared ${count} plugin factories`);
  }

  // Private methods

  /**
   * Initialize built-in plugin factories
   */
  private initializeBuiltInPlugins(): void {
    // Note: Actual plugin factories will be registered when plugins are updated 
    // to implement the new IPlugin interface. For now, we provide placeholder factories.
    
    console.log(`[PluginDiscovery] Plugin system ready. Plugins can be registered via registerPluginFactory()`);
  }
}
