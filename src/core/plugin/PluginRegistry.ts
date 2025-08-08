/**
 * PluginRegistry Implementation - Phase 3
 * Production-ready plugin registry following clean architecture principles
 */

import {
  IPluginRegistry,
  IPlugin,
  IPluginRegistryEntry,
  IPluginContext,
  PluginState,
  PluginCategory,
  IPluginDependencyResult
} from './interfaces';

/**
 * Concrete implementation of plugin registry providing centralized plugin management
 */
export class PluginRegistry implements IPluginRegistry {
  private readonly plugins = new Map<string, IPluginRegistryEntry>();
  private readonly eventHandlers: {
    stateChanged: Array<(pluginName: string, state: PluginState) => void>;
    error: Array<(pluginName: string, error: Error) => void>;
  } = {
    stateChanged: [],
    error: []
  };

  /**
   * Register a new plugin in the registry
   */
  async register(plugin: IPlugin): Promise<void> {
    if (this.plugins.has(plugin.metadata.name)) {
      throw new Error(`Plugin ${plugin.metadata.name} is already registered`);
    }

    // Validate plugin metadata
    this.validatePluginMetadata(plugin.metadata);

    // Create plugin context
    const context: IPluginContext = this.createPluginContext();

    try {
      // Set plugin state to loading
      const entry: IPluginRegistryEntry = {
        plugin,
        metadata: plugin.metadata,
        loadedAt: new Date(),
        context,
        state: 'loading'
      };

      this.plugins.set(plugin.metadata.name, entry);
      this.notifyStateChanged(plugin.metadata.name, 'loading');

      // Initialize plugin
      await plugin.initialize(context);
      
      // Update state to loaded
      entry.state = 'loaded';
      this.notifyStateChanged(plugin.metadata.name, 'loaded');

    } catch (error) {
      // Remove failed plugin from registry
      this.plugins.delete(plugin.metadata.name);
      
      const pluginError = error instanceof Error ? error : new Error(String(error));
      this.notifyError(plugin.metadata.name, pluginError);
      throw pluginError;
    }
  }

  /**
   * Unregister a plugin from the registry
   */
  async unregister(pluginName: string): Promise<void> {
    const entry = this.plugins.get(pluginName);
    if (!entry) {
      throw new Error(`Plugin ${pluginName} is not registered`);
    }

    try {
      // Set state to unloading
      entry.state = 'unloading';
      this.notifyStateChanged(pluginName, 'unloading');

      // Cleanup plugin
      await entry.plugin.cleanup();
      
      // Remove from registry
      this.plugins.delete(pluginName);

    } catch (error) {
      const pluginError = error instanceof Error ? error : new Error(String(error));
      entry.state = 'error';
      entry.error = pluginError;
      this.notifyStateChanged(pluginName, 'error');
      this.notifyError(pluginName, pluginError);
      throw pluginError;
    }
  }

  /**
   * Load a plugin (transition from unloaded to loaded state)
   */
  async load(pluginName: string): Promise<void> {
    const entry = this.plugins.get(pluginName);
    if (!entry) {
      throw new Error(`Plugin ${pluginName} is not registered`);
    }

    if (entry.state === 'loaded' || entry.state === 'active') {
      return; // Already loaded or active
    }

    try {
      entry.state = 'loading';
      this.notifyStateChanged(pluginName, 'loading');

      // Call plugin lifecycle hook if available
      if (entry.plugin.onLoad) {
        await entry.plugin.onLoad();
      }

      entry.state = 'loaded';
      this.notifyStateChanged(pluginName, 'loaded');

    } catch (error) {
      const pluginError = error instanceof Error ? error : new Error(String(error));
      entry.state = 'error';
      entry.error = pluginError;
      this.notifyStateChanged(pluginName, 'error');
      this.notifyError(pluginName, pluginError);
      throw pluginError;
    }
  }

  /**
   * Unload a plugin (transition to unloaded state)
   */
  async unload(pluginName: string): Promise<void> {
    const entry = this.plugins.get(pluginName);
    if (!entry) {
      throw new Error(`Plugin ${pluginName} is not registered`);
    }

    if (entry.state === 'active') {
      await this.deactivate(pluginName);
    }

    try {
      entry.state = 'unloading';
      this.notifyStateChanged(pluginName, 'unloading');

      // Call plugin lifecycle hook if available
      if (entry.plugin.onUnload) {
        await entry.plugin.onUnload();
      }

      entry.state = 'unloaded';
      this.notifyStateChanged(pluginName, 'unloaded');

    } catch (error) {
      const pluginError = error instanceof Error ? error : new Error(String(error));
      entry.state = 'error';
      entry.error = pluginError;
      this.notifyStateChanged(pluginName, 'error');
      this.notifyError(pluginName, pluginError);
      throw pluginError;
    }
  }

  /**
   * Activate a plugin (make it active in the system)
   */
  async activate(pluginName: string): Promise<void> {
    const entry = this.plugins.get(pluginName);
    if (!entry) {
      throw new Error(`Plugin ${pluginName} is not registered`);
    }

    if (entry.state === 'active') {
      return; // Already active
    }

    // Ensure plugin is loaded first
    if (entry.state !== 'loaded') {
      await this.load(pluginName);
    }

    // Validate dependencies before activation
    const depResult = this.validateDependencies(pluginName);
    if (!depResult.isValid) {
      throw new Error(`Cannot activate ${pluginName}: missing dependencies [${depResult.missingDependencies.join(', ')}]`);
    }

    try {
      // Call plugin lifecycle hook if available
      if (entry.plugin.onActivate) {
        await entry.plugin.onActivate();
      }

      entry.state = 'active';
      this.notifyStateChanged(pluginName, 'active');

    } catch (error) {
      const pluginError = error instanceof Error ? error : new Error(String(error));
      entry.state = 'error';
      entry.error = pluginError;
      this.notifyStateChanged(pluginName, 'error');
      this.notifyError(pluginName, pluginError);
      throw pluginError;
    }
  }

  /**
   * Deactivate a plugin (transition from active to loaded state)
   */
  async deactivate(pluginName: string): Promise<void> {
    const entry = this.plugins.get(pluginName);
    if (!entry) {
      throw new Error(`Plugin ${pluginName} is not registered`);
    }

    if (entry.state !== 'active') {
      return; // Not active
    }

    try {
      // Call plugin lifecycle hook if available
      if (entry.plugin.onDeactivate) {
        await entry.plugin.onDeactivate();
      }

      entry.state = 'loaded';
      this.notifyStateChanged(pluginName, 'loaded');

    } catch (error) {
      const pluginError = error instanceof Error ? error : new Error(String(error));
      entry.state = 'error';
      entry.error = pluginError;
      this.notifyStateChanged(pluginName, 'error');
      this.notifyError(pluginName, pluginError);
      throw pluginError;
    }
  }

  /**
   * Get a specific plugin by name
   */
  getPlugin(name: string): IPluginRegistryEntry | undefined {
    return this.plugins.get(name);
  }

  /**
   * Get all registered plugins
   */
  getAllPlugins(): readonly IPluginRegistryEntry[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get all active plugins
   */
  getActivePlugins(): readonly IPluginRegistryEntry[] {
    return Array.from(this.plugins.values()).filter(entry => entry.state === 'active');
  }

  /**
   * Get plugins by category
   */
  getPluginsByCategory(category: PluginCategory): readonly IPluginRegistryEntry[] {
    return Array.from(this.plugins.values()).filter(entry => entry.metadata.category === category);
  }

  /**
   * Validate plugin dependencies
   */
  validateDependencies(pluginName: string): IPluginDependencyResult {
    const entry = this.plugins.get(pluginName);
    if (!entry) {
      return {
        isValid: false,
        missingDependencies: [],
        conflictingVersions: [],
        loadOrder: []
      };
    }

    const missingDependencies: string[] = [];
    const conflictingVersions: string[] = [];

    // Check each dependency
    for (const depName of entry.metadata.dependencies) {
      const depEntry = this.plugins.get(depName);
      if (!depEntry) {
        missingDependencies.push(depName);
      }
      // TODO: Add version compatibility checking
    }

    return {
      isValid: missingDependencies.length === 0 && conflictingVersions.length === 0,
      missingDependencies,
      conflictingVersions,
      loadOrder: this.calculateLoadOrder(entry.metadata.dependencies)
    };
  }

  /**
   * Resolve dependency load order using topological sort
   */
  resolveDependencies(plugins: readonly string[]): readonly string[] {
    const visited = new Set<string>();
    const visiting = new Set<string>(); // For cycle detection
    const result: string[] = [];

    const visit = (pluginName: string): void => {
      if (visited.has(pluginName)) {
        return;
      }

      if (visiting.has(pluginName)) {
        throw new Error(`Circular dependency detected involving plugin: ${pluginName}`);
      }

      const entry = this.plugins.get(pluginName);
      if (!entry) {
        return; // Skip missing plugins
      }

      visiting.add(pluginName);

      // Visit dependencies first
      for (const dep of entry.metadata.dependencies) {
        if (plugins.includes(dep)) {
          visit(dep);
        }
      }

      visiting.delete(pluginName);
      visited.add(pluginName);
      result.push(pluginName);
    };

    for (const pluginName of plugins) {
      visit(pluginName);
    }

    return result;
  }

  /**
   * Check if plugin is loaded
   */
  isLoaded(pluginName: string): boolean {
    const entry = this.plugins.get(pluginName);
    return entry !== undefined && entry.state !== 'unloaded';
  }

  /**
   * Check if plugin is active
   */
  isActive(pluginName: string): boolean {
    const entry = this.plugins.get(pluginName);
    return entry !== undefined && entry.state === 'active';
  }

  /**
   * Get plugin state
   */
  getPluginState(pluginName: string): PluginState {
    const entry = this.plugins.get(pluginName);
    return entry?.state || 'unloaded';
  }

  /**
   * Register state change callback
   */
  onPluginStateChanged(callback: (pluginName: string, state: PluginState) => void): void {
    this.eventHandlers.stateChanged.push(callback);
  }

  /**
   * Register error callback
   */
  onPluginError(callback: (pluginName: string, error: Error) => void): void {
    this.eventHandlers.error.push(callback);
  }

  // Private helper methods

  private validatePluginMetadata(metadata: any): void {
    const required = ['name', 'version', 'description', 'author'];
    for (const field of required) {
      if (!metadata[field] || typeof metadata[field] !== 'string') {
        throw new Error(`Plugin metadata missing or invalid field: ${field}`);
      }
    }

    if (!Array.isArray(metadata.dependencies)) {
      throw new Error('Plugin metadata dependencies must be an array');
    }
  }

  private createPluginContext(): IPluginContext {
    // TODO: Inject actual service instances from DI container
    return {
      simulationManager: {},
      parameterManager: {},
      renderManager: {},
      eventBus: {}
    };
  }

  private calculateLoadOrder(dependencies: readonly string[]): readonly string[] {
    try {
      return this.resolveDependencies(dependencies);
    } catch {
      return []; // Return empty array if circular dependency detected
    }
  }

  private notifyStateChanged(pluginName: string, state: PluginState): void {
    for (const handler of this.eventHandlers.stateChanged) {
      try {
        handler(pluginName, state);
      } catch (error) {
        console.error(`Error in plugin state change handler:`, error);
      }
    }
  }

  private notifyError(pluginName: string, error: Error): void {
    for (const handler of this.eventHandlers.error) {
      try {
        handler(pluginName, error);
      } catch (handlerError) {
        console.error(`Error in plugin error handler:`, handlerError);
      }
    }
  }
}
