/**
 * PluginDiscoveryService Tests - Phase 3 Implementation
 * Comprehensive tests for plugin discovery and dynamic loading
 */

import { PluginDiscoveryService } from '../PluginDiscoveryService';
import { IPlugin, IPluginMetadata, IPluginContext, PluginState, PluginCategory } from '../interfaces';
import { ISimulationAlgorithm } from '../../simulation/interfaces';

// Mock plugin for testing
class MockTestPlugin implements IPlugin {
  public readonly metadata: IPluginMetadata;
  public state: PluginState = 'unloaded';

  constructor(name: string) {
    this.metadata = {
      name,
      version: '1.0.0',
      description: `Mock plugin ${name}`,
      author: 'Test Author',
      dependencies: [],
      requiredCoreVersion: '1.0.0',
      category: 'simulation' as PluginCategory,
      tags: ['test', 'mock']
    };
  }

  async initialize(context: IPluginContext): Promise<void> {
    this.state = 'loaded';
  }

  getAlgorithms(): ISimulationAlgorithm[] {
    return [];
  }

  async cleanup(): Promise<void> {
    this.state = 'unloaded';
  }
}

describe('PluginDiscoveryService', () => {
  let discoveryService: PluginDiscoveryService;

  beforeEach(() => {
    discoveryService = new PluginDiscoveryService();
  });

  describe('Plugin Factory Registration', () => {
    test('should register a plugin factory', () => {
      const factory = async () => new MockTestPlugin('test-plugin');

      discoveryService.registerPluginFactory('test-plugin', factory);

      expect(discoveryService.hasPluginFactory('test-plugin')).toBe(true);
      expect(discoveryService.getAvailablePlugins()).toContain('test-plugin');
    });

    test('should allow overriding existing factory', () => {
      const factory1 = async () => new MockTestPlugin('plugin-v1');
      const factory2 = async () => new MockTestPlugin('plugin-v2');

      discoveryService.registerPluginFactory('test-plugin', factory1);
      discoveryService.registerPluginFactory('test-plugin', factory2);

      expect(discoveryService.hasPluginFactory('test-plugin')).toBe(true);
      expect(discoveryService.getFactoryCount()).toBe(1);
    });

    test('should unregister a plugin factory', () => {
      const factory = async () => new MockTestPlugin('test-plugin');
      discoveryService.registerPluginFactory('test-plugin', factory);

      const result = discoveryService.unregisterPluginFactory('test-plugin');

      expect(result).toBe(true);
      expect(discoveryService.hasPluginFactory('test-plugin')).toBe(false);
      expect(discoveryService.getAvailablePlugins()).not.toContain('test-plugin');
    });

    test('should return false when unregistering non-existent factory', () => {
      const result = discoveryService.unregisterPluginFactory('non-existent');

      expect(result).toBe(false);
    });

    test('should clear all factories', () => {
      const factory1 = async () => new MockTestPlugin('plugin1');
      const factory2 = async () => new MockTestPlugin('plugin2');
      
      discoveryService.registerPluginFactory('plugin1', factory1);
      discoveryService.registerPluginFactory('plugin2', factory2);

      discoveryService.clearFactories();

      expect(discoveryService.getFactoryCount()).toBe(0);
      expect(discoveryService.getAvailablePlugins()).toHaveLength(0);
    });
  });

  describe('Plugin Discovery', () => {
    test('should discover registered plugins', async () => {
      const factory1 = async () => new MockTestPlugin('plugin1');
      const factory2 = async () => new MockTestPlugin('plugin2');
      
      discoveryService.registerPluginFactory('plugin1', factory1);
      discoveryService.registerPluginFactory('plugin2', factory2);

      const discovered = await discoveryService.discoverPlugins();

      expect(discovered).toHaveLength(2);
      expect(discovered).toContain('plugin1');
      expect(discovered).toContain('plugin2');
    });

    test('should return empty array when no plugins registered', async () => {
      discoveryService.clearFactories();

      const discovered = await discoveryService.discoverPlugins();

      expect(discovered).toHaveLength(0);
    });

    test('should get available plugins synchronously', () => {
      const factory = async () => new MockTestPlugin('sync-plugin');
      discoveryService.registerPluginFactory('sync-plugin', factory);

      const available = discoveryService.getAvailablePlugins();

      expect(available).toContain('sync-plugin');
    });
  });

  describe('Plugin Loading', () => {
    test('should load plugin using factory', async () => {
      const expectedPlugin = new MockTestPlugin('loadable-plugin');
      const factory = async () => expectedPlugin;
      
      discoveryService.registerPluginFactory('loadable-plugin', factory);

      const loadedPlugin = await discoveryService.loadPlugin('loadable-plugin');

      expect(loadedPlugin).toBe(expectedPlugin);
      expect(loadedPlugin.metadata.name).toBe('loadable-plugin');
    });

    test('should handle plugin loading errors', async () => {
      const errorFactory = async () => {
        throw new Error('Factory failed');
      };
      
      discoveryService.registerPluginFactory('error-plugin', errorFactory);

      await expect(discoveryService.loadPlugin('error-plugin'))
        .rejects.toThrow('Failed to load plugin error-plugin: Factory failed');
    });

    test('should throw error for non-existent plugin', async () => {
      await expect(discoveryService.loadPlugin('non-existent'))
        .rejects.toThrow('Plugin factory not found: non-existent');
    });

    test('should handle async factory execution', async () => {
      const delayedFactory = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return new MockTestPlugin('delayed-plugin');
      };
      
      discoveryService.registerPluginFactory('delayed-plugin', delayedFactory);

      const startTime = Date.now();
      const plugin = await discoveryService.loadPlugin('delayed-plugin');
      const endTime = Date.now();

      expect(plugin.metadata.name).toBe('delayed-plugin');
      expect(endTime - startTime).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Directory Scanning', () => {
    test('should register scanned paths', async () => {
      const testPath = '/test/plugins';

      const result = await discoveryService.scanDirectory(testPath);

      // In browser environment, should return empty but record the path
      expect(result).toHaveLength(0);
    });

    test('should throw error for path-based loading', async () => {
      const testPath = '/path/to/plugin.js';

      await expect(discoveryService.loadPluginFromPath(testPath))
        .rejects.toThrow('Dynamic path loading not supported in browser environment');
    });
  });

  describe('Factory Management', () => {
    test('should track factory count correctly', () => {
      expect(discoveryService.getFactoryCount()).toBe(0);

      const factory1 = async () => new MockTestPlugin('plugin1');
      const factory2 = async () => new MockTestPlugin('plugin2');
      
      discoveryService.registerPluginFactory('plugin1', factory1);
      expect(discoveryService.getFactoryCount()).toBe(1);

      discoveryService.registerPluginFactory('plugin2', factory2);
      expect(discoveryService.getFactoryCount()).toBe(2);

      discoveryService.unregisterPluginFactory('plugin1');
      expect(discoveryService.getFactoryCount()).toBe(1);
    });

    test('should handle complex plugin metadata', async () => {
      const complexMetadata = {
        name: 'complex-plugin',
        version: '2.1.0',
        description: 'A complex test plugin',
        author: 'Advanced Developer',
        dependencies: ['base-plugin', 'utility-plugin'],
        requiredCoreVersion: '1.2.0',
        category: 'visualization' as PluginCategory,
        tags: ['advanced', 'visualization', 'graphics']
      };

      class ComplexTestPlugin extends MockTestPlugin {
        constructor() {
          super('complex-plugin');
          Object.assign(this.metadata, complexMetadata);
        }
      }

      const factory = async () => new ComplexTestPlugin();
      discoveryService.registerPluginFactory('complex-plugin', factory);

      const plugin = await discoveryService.loadPlugin('complex-plugin');

      expect(plugin.metadata.name).toBe('complex-plugin');
      expect(plugin.metadata.version).toBe('2.1.0');
      expect(plugin.metadata.dependencies).toHaveLength(2);
      expect(plugin.metadata.category).toBe('visualization');
      expect(plugin.metadata.tags).toContain('advanced');
    });
  });

  describe('Error Handling', () => {
    test('should handle factory throwing synchronous errors', async () => {
      const syncErrorFactory = () => {
        throw new Error('Synchronous error');
      };
      
      discoveryService.registerPluginFactory('sync-error-plugin', syncErrorFactory as any);

      await expect(discoveryService.loadPlugin('sync-error-plugin'))
        .rejects.toThrow('Failed to load plugin sync-error-plugin: Synchronous error');
    });

    test('should handle factory throwing non-Error objects', async () => {
      const stringErrorFactory = async () => {
        throw 'String error';
      };
      
      discoveryService.registerPluginFactory('string-error-plugin', stringErrorFactory);

      await expect(discoveryService.loadPlugin('string-error-plugin'))
        .rejects.toThrow('Failed to load plugin string-error-plugin: String error');
    });

    test('should handle factory returning null/undefined', async () => {
      const nullFactory = async () => null as any;
      
      discoveryService.registerPluginFactory('null-plugin', nullFactory);

      const plugin = await discoveryService.loadPlugin('null-plugin');
      
      expect(plugin).toBeNull();
    });
  });

  describe('Integration Scenarios', () => {
    test('should support multiple plugin types', async () => {
      class SimulationPlugin extends MockTestPlugin {
        constructor() {
          super('sim-plugin');
          (this.metadata as any).category = 'simulation';
        }
      }

      class VisualizationPlugin extends MockTestPlugin {
        constructor() {
          super('viz-plugin');
          (this.metadata as any).category = 'visualization';
        }
      }

      const simulationFactory = async () => new SimulationPlugin();
      const visualizationFactory = async () => new VisualizationPlugin();

      discoveryService.registerPluginFactory('sim-plugin', simulationFactory);
      discoveryService.registerPluginFactory('viz-plugin', visualizationFactory);

      const simPlugin = await discoveryService.loadPlugin('sim-plugin');
      const vizPlugin = await discoveryService.loadPlugin('viz-plugin');

      expect(simPlugin.metadata.category).toBe('simulation');
      expect(vizPlugin.metadata.category).toBe('visualization');
    });

    test('should maintain plugin independence', async () => {
      const sharedData = { count: 0 };

      const factory1 = async () => {
        sharedData.count++;
        return new MockTestPlugin('plugin1');
      };

      const factory2 = async () => {
        sharedData.count++;
        return new MockTestPlugin('plugin2');
      };

      discoveryService.registerPluginFactory('plugin1', factory1);
      discoveryService.registerPluginFactory('plugin2', factory2);

      const plugin1 = await discoveryService.loadPlugin('plugin1');
      const plugin2 = await discoveryService.loadPlugin('plugin2');

      expect(sharedData.count).toBe(2);
      expect(plugin1.metadata.name).toBe('plugin1');
      expect(plugin2.metadata.name).toBe('plugin2');
    });
  });
});
