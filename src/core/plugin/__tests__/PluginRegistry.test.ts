/**
 * PluginRegistry Tests - Phase 3 Implementation  
 * Comprehensive test suite for production PluginRegistry
 */

import { PluginRegistry } from '../PluginRegistry';
import { 
  IPlugin, 
  IPluginMetadata, 
  IPluginContext, 
  PluginState, 
  PluginCategory 
} from '../interfaces';
import { ISimulationAlgorithm } from '../../simulation/interfaces';

// Mock plugin implementation for testing
class MockPlugin implements IPlugin {
  public state: PluginState = 'unloaded';
  public initializeCalled = false;
  public cleanupCalled = false;
  public onLoadCalled = false;
  public onUnloadCalled = false;
  public onActivateCalled = false;
  public onDeactivateCalled = false;
  
  // Mock methods that can be overridden for error testing
  public onActivate?: () => Promise<void>;
  public onDeactivate?: () => Promise<void>;
  public onLoad?: () => Promise<void>;
  public onUnload?: () => Promise<void>;

  constructor(public readonly metadata: IPluginMetadata) {}

  async initialize(context: IPluginContext): Promise<void> {
    this.initializeCalled = true;
    this.state = 'loaded';
  }

  getAlgorithms(): ISimulationAlgorithm[] {
    return [];
  }

  async cleanup(): Promise<void> {
    this.cleanupCalled = true;
    this.state = 'unloaded';
  }

  // Override lifecycle methods for testing
  async mockOnLoad(): Promise<void> {
    this.onLoadCalled = true;
  }

  async mockOnUnload(): Promise<void> {
    this.onUnloadCalled = true;
  }

  async mockOnActivate(): Promise<void> {
    this.onActivateCalled = true;
  }

  async mockOnDeactivate(): Promise<void> {
    this.onDeactivateCalled = true;
  }
}

describe('PluginRegistry', () => {
  let registry: PluginRegistry;

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
    registry = new PluginRegistry();
  });

  describe('Plugin Registration', () => {
    test('should register a plugin successfully', async () => {
      const metadata = createMockMetadata('test-plugin');
      const plugin = new MockPlugin(metadata);

      await registry.register(plugin);

      expect(registry.isLoaded('test-plugin')).toBe(true);
      expect(registry.getPluginState('test-plugin')).toBe('loaded');
      expect(plugin.initializeCalled).toBe(true);
      
      const entry = registry.getPlugin('test-plugin');
      expect(entry).toBeDefined();
      expect(entry?.plugin).toBe(plugin);
      expect(entry?.metadata).toBe(metadata);
      expect(entry?.loadedAt).toBeInstanceOf(Date);
    });

    test('should not register plugin with duplicate name', async () => {
      const metadata = createMockMetadata('duplicate-plugin');
      const plugin1 = new MockPlugin(metadata);
      const plugin2 = new MockPlugin(metadata);

      await registry.register(plugin1);

      await expect(registry.register(plugin2))
        .rejects.toThrow('Plugin duplicate-plugin is already registered');
      
      // First plugin should still be registered
      expect(registry.isLoaded('duplicate-plugin')).toBe(true);
    });

    test('should handle plugin initialization errors', async () => {
      const metadata = createMockMetadata('error-plugin');
      const plugin = new MockPlugin(metadata);
      plugin.initialize = jest.fn().mockRejectedValue(new Error('Initialization failed'));

      await expect(registry.register(plugin)).rejects.toThrow('Initialization failed');
      
      expect(registry.isLoaded('error-plugin')).toBe(false);
      expect(registry.getPlugin('error-plugin')).toBeUndefined();
    });

    test('should validate plugin metadata', async () => {
      const invalidMetadata = { name: '', version: '1.0.0' } as IPluginMetadata;
      const plugin = new MockPlugin(invalidMetadata);

      await expect(registry.register(plugin))
        .rejects.toThrow('Plugin metadata missing or invalid field');
    });
  });

  describe('Plugin Lifecycle Management', () => {
    test('should activate plugin successfully', async () => {
      const metadata = createMockMetadata('activate-plugin');
      const plugin = new MockPlugin(metadata);
      plugin.onActivate = plugin.mockOnActivate.bind(plugin);
      await registry.register(plugin);

      await registry.activate('activate-plugin');

      expect(registry.isActive('activate-plugin')).toBe(true);
      expect(registry.getPluginState('activate-plugin')).toBe('active');
      expect(plugin.onActivateCalled).toBe(true);
    });

    test('should handle activation errors', async () => {
      const metadata = createMockMetadata('error-plugin');
      const plugin = new MockPlugin(metadata);
      plugin.onActivate = jest.fn().mockRejectedValue(new Error('Activation failed'));
      await registry.register(plugin);

      await expect(registry.activate('error-plugin')).rejects.toThrow('Activation failed');
      
      expect(registry.getPluginState('error-plugin')).toBe('error');
      expect(registry.isActive('error-plugin')).toBe(false);
    });

    test('should prevent activation with missing dependencies', async () => {
      const dependentPlugin = new MockPlugin(createMockMetadata('dependent-plugin', ['missing-plugin']));
      await registry.register(dependentPlugin);

      await expect(registry.activate('dependent-plugin'))
        .rejects.toThrow('Cannot activate dependent-plugin: missing dependencies [missing-plugin]');
    });
  });

  describe('Plugin Discovery', () => {
    test('should get all registered plugins', async () => {
      const plugin1 = new MockPlugin(createMockMetadata('plugin1'));
      const plugin2 = new MockPlugin(createMockMetadata('plugin2'));
      await registry.register(plugin1);
      await registry.register(plugin2);

      const plugins = registry.getAllPlugins();

      expect(plugins).toHaveLength(2);
      const names = plugins.map(p => p.plugin.metadata.name);
      expect(names).toContain('plugin1');
      expect(names).toContain('plugin2');
    });

    test('should get plugins by category', async () => {
      const simPlugin = new MockPlugin(createMockMetadata('sim-plugin', [], 'simulation'));
      const vizPlugin = new MockPlugin(createMockMetadata('viz-plugin', [], 'visualization'));
      
      await registry.register(simPlugin);
      await registry.register(vizPlugin);

      const simPlugins = registry.getPluginsByCategory('simulation');
      const vizPlugins = registry.getPluginsByCategory('visualization');

      expect(simPlugins).toHaveLength(1);
      expect(simPlugins[0].plugin.metadata.name).toBe('sim-plugin');
      expect(vizPlugins).toHaveLength(1);
      expect(vizPlugins[0].plugin.metadata.name).toBe('viz-plugin');
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

    test('should detect missing dependencies', async () => {
      const dependentPlugin = new MockPlugin(createMockMetadata('dependent-plugin', ['missing-plugin']));
      await registry.register(dependentPlugin);

      const result = registry.validateDependencies('dependent-plugin');

      expect(result.isValid).toBe(false);
      expect(result.missingDependencies).toContain('missing-plugin');
    });

    test('should resolve dependency load order', async () => {
      const basePlugin = new MockPlugin(createMockMetadata('base'));
      const middlePlugin = new MockPlugin(createMockMetadata('middle', ['base']));
      const topPlugin = new MockPlugin(createMockMetadata('top', ['middle']));
      
      await registry.register(basePlugin);
      await registry.register(middlePlugin);
      await registry.register(topPlugin);

      const loadOrder = registry.resolveDependencies(['top', 'middle', 'base']);

      expect(loadOrder).toEqual(['base', 'middle', 'top']);
    });

    test('should detect circular dependencies', async () => {
      const plugin1 = new MockPlugin(createMockMetadata('plugin1', ['plugin2']));
      const plugin2 = new MockPlugin(createMockMetadata('plugin2', ['plugin1']));
      
      await registry.register(plugin1);
      await registry.register(plugin2);

      expect(() => registry.resolveDependencies(['plugin1', 'plugin2']))
        .toThrow('Circular dependency detected involving plugin');
    });
  });

  describe('Event Handling', () => {
    test('should notify state change handlers', async () => {
      const stateChangeHandler = jest.fn();
      registry.onPluginStateChanged(stateChangeHandler);

      const plugin = new MockPlugin(createMockMetadata('event-plugin'));
      await registry.register(plugin);

      expect(stateChangeHandler).toHaveBeenCalledWith('event-plugin', 'loading');
      expect(stateChangeHandler).toHaveBeenCalledWith('event-plugin', 'loaded');
      expect(stateChangeHandler).toHaveBeenCalledTimes(2);
    });

    test('should notify error handlers', async () => {
      const errorHandler = jest.fn();
      registry.onPluginError(errorHandler);

      const plugin = new MockPlugin(createMockMetadata('error-plugin'));
      plugin.initialize = jest.fn().mockRejectedValue(new Error('Test error'));

      await expect(registry.register(plugin)).rejects.toThrow();

      expect(errorHandler).toHaveBeenCalledWith('error-plugin', expect.any(Error));
    });
  });
});