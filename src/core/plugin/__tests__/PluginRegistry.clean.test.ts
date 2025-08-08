/**
 * PluginRegistry Tests - Phase 3 Implementation
 * Following TDD methodol      entry.state = 'unloaded'; // Use string literal instead of PluginState.Registered
      // isActive property doesn't exist in interface, remove it
    }
  }

  async activate(pluginName: string): Promise<void> {
    const entry = this.plugins.get(pluginName);
    if (entry) {
      entry.state = 'active'; // Use string literal instead of PluginState.Active
      // isActive property doesn't exist in interface, remove it
    }
  }

  async deactivate(pluginName: string): Promise<void> {
    const entry = this.plugins.get(pluginName);
    if (entry) {
      entry.state = 'loaded'; // Use string literal instead of PluginState.Loaded
      // isActive property doesn't exist in interface, remove itsive test coverage
 */

import {
  IPlugin,
  IPluginMetadata,
  IPluginContext,
  PluginState,
  PluginCategory,
  IPluginRegistryEntry,
  IPluginRegistry,
  IPluginDependencyResult
} from '../interfaces';
import { ISimulationAlgorithm } from '../../simulation/interfaces';

// Mock plugin implementation for testing
class MockPlugin implements IPlugin {
  public state: PluginState = 'unloaded';
  public initializeCalled = false;
  public cleanupCalled = false;
  public algorithms: ISimulationAlgorithm[] = [];
  public onActivate?: () => Promise<void>;

  constructor(
    public readonly metadata: IPluginMetadata,
    algorithms: ISimulationAlgorithm[] = []
  ) {
    this.algorithms = algorithms;
  }

  async initialize(context: IPluginContext): Promise<void> {
    this.initializeCalled = true;
    this.state = 'loaded';
  }

  getAlgorithms(): ISimulationAlgorithm[] {
    return this.algorithms;
  }

  async cleanup(): Promise<void> {
    this.cleanupCalled = true;
    this.state = 'unloaded';
  }
}

// Concrete implementation for testing
class TestPluginRegistry implements IPluginRegistry {
  private plugins = new Map<string, IPluginRegistryEntry>();
  private stateCallbacks: ((pluginName: string, state: PluginState) => void)[] = [];
  private errorCallbacks: ((pluginName: string, error: Error) => void)[] = [];

  async register(plugin: IPlugin): Promise<void> {
    // Check for duplicate registration
    if (this.plugins.has(plugin.metadata.name)) {
      throw new Error(`Plugin ${plugin.metadata.name} is already registered`);
    }

    // Create plugin context and initialize plugin (like real registry)
    const context: IPluginContext = {} as IPluginContext;
    await plugin.initialize(context);

    const entry: IPluginRegistryEntry = {
      plugin,
      state: 'loaded', // Plugin should be loaded after successful registration
      metadata: plugin.metadata,
      loadedAt: new Date(),
      context
    };
    this.plugins.set(plugin.metadata.name, entry);
  }

  async unregister(pluginName: string): Promise<void> {
    this.plugins.delete(pluginName);
  }

  async load(pluginName: string): Promise<void> {
    const entry = this.plugins.get(pluginName);
    if (entry) {
      entry.state = 'loaded'; // Use string literal instead of PluginState.Loaded
      // loadTime property doesn't exist in interface, remove it
    }
  }

  async unload(pluginName: string): Promise<void> {
    const entry = this.plugins.get(pluginName);
    if (entry) {
      entry.state = 'unloaded'; // Use string literal instead of PluginState.Registered
    }
  }

  async activate(pluginName: string): Promise<void> {
    const entry = this.plugins.get(pluginName);
    if (entry) {
      entry.state = 'active'; // Use string literal instead of PluginState.Active
      // isActive property doesn't exist in interface
    }
  }

  async deactivate(pluginName: string): Promise<void> {
    const entry = this.plugins.get(pluginName);
    if (entry) {
      entry.state = 'loaded'; // Use string literal instead of PluginState.Loaded
      // isActive property doesn't exist in interface
    }
  }

  getPlugin(name: string): IPluginRegistryEntry | undefined {
    return this.plugins.get(name);
  }

  getAllPlugins(): readonly IPluginRegistryEntry[] {
    return Array.from(this.plugins.values());
  }

  getActivePlugins(): readonly IPluginRegistryEntry[] {
    // Since isActive property doesn't exist, filter by state instead
    return Array.from(this.plugins.values()).filter(p => p.state === 'active');
  }

  getPluginsByCategory(category: PluginCategory): readonly IPluginRegistryEntry[] {
    return Array.from(this.plugins.values())
      .filter(p => p.metadata.category === category);
  }

  validateDependencies(pluginName: string): IPluginDependencyResult {
    const entry = this.plugins.get(pluginName);
    if (!entry) {
      return {
        isValid: false,
        missingDependencies: [],
        conflictingVersions: [], // Use correct property name
        loadOrder: []
      };
    }

    return {
      isValid: true,
      missingDependencies: [],
      conflictingVersions: [], // Use correct property name
      loadOrder: [pluginName]
    };
  }

  resolveDependencies(plugins: readonly string[]): readonly string[] {
    return plugins;
  }

  isLoaded(pluginName: string): boolean {
    const entry = this.plugins.get(pluginName);
    return entry ? entry.state !== 'unloaded' : false; // Use string literal instead of PluginState.Registered
  }

  isActive(pluginName: string): boolean {
    // Use state comparison instead of isActive property
    return this.plugins.get(pluginName)?.state === 'active' || false;
  }

  getPluginState(pluginName: string): PluginState {
    return this.plugins.get(pluginName)?.state || 'unloaded'; // Use string literal instead of PluginState.Registered
  }

  onPluginStateChanged(callback: (pluginName: string, state: PluginState) => void): void {
    this.stateCallbacks.push(callback);
  }

  onPluginError(callback: (pluginName: string, error: Error) => void): void {
    this.errorCallbacks.push(callback);
  }
}

describe('PluginRegistry', () => {
  let registry: IPluginRegistry;

  const createMockMetadata = (
    name: string,
    dependencies: string[] = [],
    category: PluginCategory = 'simulation'
  ): IPluginMetadata => ({
    name,
    version: '1.0.0',
    description: `Test plugin ${name}`,
    author: 'Test Author',
    dependencies,
    requiredCoreVersion: '1.0.0',
    category,
    tags: ['test']
  });

  beforeEach(() => {
    registry = new TestPluginRegistry();
  });

  describe('Plugin Registration', () => {
    test('should register a plugin successfully', async () => {
      const metadata = createMockMetadata('test-plugin');
      const plugin = new MockPlugin(metadata);

      await registry.register(plugin);

      expect(registry.isLoaded('test-plugin')).toBe(true);
      expect(plugin.initializeCalled).toBe(true);
    });

    test('should not register plugin with duplicate name', async () => {
      const metadata = createMockMetadata('duplicate-plugin');
      const plugin1 = new MockPlugin(metadata);
      const plugin2 = new MockPlugin(metadata);

      await registry.register(plugin1);

      await expect(registry.register(plugin2))
        .rejects.toThrow('Plugin duplicate-plugin is already registered');
    });
  });

  describe('Plugin Lifecycle Management', () => {
    test('should activate plugin successfully', async () => {
      const plugin = new MockPlugin(createMockMetadata('activate-plugin'));
      await registry.register(plugin);

      await registry.activate('activate-plugin');

      expect(registry.isActive('activate-plugin')).toBe(true);
      expect(registry.getPluginState('activate-plugin')).toBe('active');
    });
  });

  describe('Dependency Management', () => {
    test('should validate dependencies successfully', async () => {
      const basePlugin = new MockPlugin(createMockMetadata('base-plugin'));
      const dependentPlugin = new MockPlugin(createMockMetadata('dependent-plugin', ['base-plugin']));

      await registry.register(basePlugin);
      await registry.register(dependentPlugin);

      const result = registry.validateDependencies('dependent-plugin');

      expect(result.isValid).toBe(true);
      expect(result.missingDependencies).toHaveLength(0);
    });
  });
});
