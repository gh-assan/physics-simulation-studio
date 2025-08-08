/**
 * EnhancedPluginManager Tests - Phase 3 Implementation
 * Comprehensive tests for the plugin system orchestrator
 */

import { EnhancedPluginManager } from '../EnhancedPluginManager';
import { PluginRegistry } from '../PluginRegistry';
import { PluginDiscoveryService } from '../PluginDiscoveryService';
import {
  IPlugin,
  IPluginMetadata,
  IPluginContext,
  PluginState,
  PluginCategory,
  IPluginRegistry,
  IPluginDiscoveryService
} from '../interfaces';
import { ISimulationAlgorithm } from '../../simulation/interfaces';

// Mock plugin for testing
class MockTestPlugin implements IPlugin {
  public readonly metadata: IPluginMetadata;
  public state: PluginState = 'unloaded';
  public initializeCalled = false;
  public cleanupCalled = false;

  constructor(name: string) {
    this.metadata = {
      name,
      version: '1.0.0',
      description: `Mock plugin ${name}`,
      author: 'Test Author',
      dependencies: [],
      requiredCoreVersion: '1.0.0',
      category: 'simulation' as PluginCategory,
      tags: ['test']
    };
  }

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
}

describe('EnhancedPluginManager', () => {
  let pluginManager: EnhancedPluginManager;
  let mockRegistry: jest.Mocked<IPluginRegistry>;
  let mockDiscovery: jest.Mocked<IPluginDiscoveryService>;

  beforeEach(() => {
    // Create mock services
    mockRegistry = {
      register: jest.fn(),
      unregister: jest.fn(),
      load: jest.fn(),
      unload: jest.fn(),
      activate: jest.fn(),
      deactivate: jest.fn(),
      getPlugin: jest.fn(),
      getAllPlugins: jest.fn().mockReturnValue([]),
      getActivePlugins: jest.fn().mockReturnValue([]),
      getPluginsByCategory: jest.fn().mockReturnValue([]),
      validateDependencies: jest.fn(),
      resolveDependencies: jest.fn(),
      isLoaded: jest.fn().mockReturnValue(false),
      isActive: jest.fn().mockReturnValue(false),
      getPluginState: jest.fn().mockReturnValue('unloaded'),
      onPluginStateChanged: jest.fn(),
      onPluginError: jest.fn()
    } as jest.Mocked<IPluginRegistry>;

    mockDiscovery = {
      discoverPlugins: jest.fn().mockResolvedValue([]),
      scanDirectory: jest.fn().mockResolvedValue([]),
      loadPlugin: jest.fn(),
      loadPluginFromPath: jest.fn(),
      registerPluginFactory: jest.fn(),
      getAvailablePlugins: jest.fn().mockReturnValue([])
    } as jest.Mocked<IPluginDiscoveryService>;

    pluginManager = new EnhancedPluginManager(mockRegistry, mockDiscovery);
  });

  describe('System Initialization', () => {
    test('should initialize plugin system successfully', async () => {
      mockDiscovery.discoverPlugins.mockResolvedValue(['plugin1', 'plugin2']);

      await pluginManager.initializePluginSystem();

      expect(mockDiscovery.discoverPlugins).toHaveBeenCalled();
    });

    test('should handle initialization only once', async () => {
      mockDiscovery.discoverPlugins.mockResolvedValue(['plugin1']);

      await pluginManager.initializePluginSystem();
      await pluginManager.initializePluginSystem(); // Second call

      expect(mockDiscovery.discoverPlugins).toHaveBeenCalledTimes(1);
    });

    test('should handle initialization errors', async () => {
      mockDiscovery.discoverPlugins.mockRejectedValue(new Error('Discovery failed'));

      await expect(pluginManager.initializePluginSystem())
        .rejects.toThrow('Failed to initialize plugin system: Discovery failed');
    });

    test('should require initialization before other operations', async () => {
      await expect(pluginManager.loadPlugin('test-plugin'))
        .rejects.toThrow('Plugin system not initialized');
    });
  });

  describe('Plugin Loading', () => {
    beforeEach(async () => {
      mockDiscovery.discoverPlugins.mockResolvedValue([]);
      await pluginManager.initializePluginSystem();
    });

    test('should load a plugin successfully', async () => {
      const testPlugin = new MockTestPlugin('test-plugin');
      mockDiscovery.loadPlugin.mockResolvedValue(testPlugin);
      mockRegistry.isLoaded.mockReturnValue(false);

      await pluginManager.loadPlugin('test-plugin');

      expect(mockDiscovery.loadPlugin).toHaveBeenCalledWith('test-plugin');
      expect(mockRegistry.register).toHaveBeenCalledWith(testPlugin);
    });

    test('should skip loading if plugin already loaded', async () => {
      mockRegistry.isLoaded.mockReturnValue(true);

      await pluginManager.loadPlugin('already-loaded');

      expect(mockDiscovery.loadPlugin).not.toHaveBeenCalled();
      expect(mockRegistry.register).not.toHaveBeenCalled();
    });

    test('should handle plugin loading errors', async () => {
      mockDiscovery.loadPlugin.mockRejectedValue(new Error('Load failed'));
      mockRegistry.isLoaded.mockReturnValue(false);

      await expect(pluginManager.loadPlugin('error-plugin'))
        .rejects.toThrow('Failed to load plugin error-plugin: Load failed');
    });

    test('should load all available plugins', async () => {
      const plugin1 = new MockTestPlugin('plugin1');
      const plugin2 = new MockTestPlugin('plugin2');

      mockDiscovery.discoverPlugins.mockResolvedValue(['plugin1', 'plugin2']);
      mockDiscovery.loadPlugin
        .mockResolvedValueOnce(plugin1)
        .mockResolvedValueOnce(plugin2);
      mockRegistry.isLoaded.mockReturnValue(false);

      await pluginManager.loadAllPlugins();

      expect(mockRegistry.register).toHaveBeenCalledWith(plugin1);
      expect(mockRegistry.register).toHaveBeenCalledWith(plugin2);
    });

    test('should handle partial failures when loading all plugins', async () => {
      mockDiscovery.discoverPlugins.mockResolvedValue(['plugin1', 'plugin2']);
      mockDiscovery.loadPlugin
        .mockResolvedValueOnce(new MockTestPlugin('plugin1'))
        .mockRejectedValueOnce(new Error('Failed to load plugin2'));
      mockRegistry.isLoaded.mockReturnValue(false);

      // Should not throw, but should log warnings
      await expect(pluginManager.loadAllPlugins()).resolves.not.toThrow();
    });
  });

  describe('Plugin Unloading', () => {
    beforeEach(async () => {
      await pluginManager.initializePluginSystem();
    });

    test('should unload a plugin successfully', async () => {
      mockRegistry.isLoaded.mockReturnValue(true);

      await pluginManager.unloadPlugin('test-plugin');

      expect(mockRegistry.unregister).toHaveBeenCalledWith('test-plugin');
    });

    test('should skip unloading if plugin not loaded', async () => {
      mockRegistry.isLoaded.mockReturnValue(false);

      await pluginManager.unloadPlugin('not-loaded');

      expect(mockRegistry.unregister).not.toHaveBeenCalled();
    });

    test('should handle plugin unloading errors', async () => {
      mockRegistry.isLoaded.mockReturnValue(true);
      mockRegistry.unregister.mockRejectedValue(new Error('Unload failed'));

      await expect(pluginManager.unloadPlugin('error-plugin'))
        .rejects.toThrow('Failed to unload plugin error-plugin: Unload failed');
    });
  });

  describe('Plugin Reloading', () => {
    beforeEach(async () => {
      await pluginManager.initializePluginSystem();
    });

    test('should reload a plugin successfully', async () => {
      const testPlugin = new MockTestPlugin('reload-plugin');
      mockRegistry.isLoaded.mockReturnValue(true);
      mockDiscovery.loadPlugin.mockResolvedValue(testPlugin);

      // Mock the loadPlugin method to track the final call
      jest.spyOn(pluginManager, 'loadPlugin');

      await pluginManager.reloadPlugin('reload-plugin');

      // Should unload first, then load
      expect(mockRegistry.unregister).toHaveBeenCalledWith('reload-plugin');
      expect(pluginManager.loadPlugin).toHaveBeenCalledWith('reload-plugin');
    });

    test('should handle reload when plugin not initially loaded', async () => {
      const testPlugin = new MockTestPlugin('not-loaded-plugin');
      mockRegistry.isLoaded.mockReturnValue(false);
      mockDiscovery.loadPlugin.mockResolvedValue(testPlugin);

      await pluginManager.reloadPlugin('not-loaded-plugin');

      expect(mockRegistry.unregister).not.toHaveBeenCalled();
      expect(mockDiscovery.loadPlugin).toHaveBeenCalledWith('not-loaded-plugin');
      expect(mockRegistry.register).toHaveBeenCalledWith(testPlugin);
    });

    test('should handle reload errors', async () => {
      mockRegistry.isLoaded.mockReturnValue(false);
      mockDiscovery.loadPlugin.mockRejectedValue(new Error('Load failed'));

      await expect(pluginManager.reloadPlugin('error-plugin'))
        .rejects.toThrow('Failed to reload plugin error-plugin: Failed to load plugin error-plugin: Load failed');
    });
  });

  describe('Plugin Information', () => {
    beforeEach(async () => {
      await pluginManager.initializePluginSystem();
    });

    test('should get loaded plugin names', () => {
      const mockEntries = [
        { metadata: { name: 'plugin1' } },
        { metadata: { name: 'plugin2' } }
      ];
      mockRegistry.getAllPlugins.mockReturnValue(mockEntries as any);

      const loadedPlugins = pluginManager.getLoadedPlugins();

      expect(loadedPlugins).toEqual(['plugin1', 'plugin2']);
    });

    test('should get plugin info', () => {
      const mockMetadata = { name: 'test-plugin', version: '1.0.0' };
      mockRegistry.getPlugin.mockReturnValue({ metadata: mockMetadata } as any);

      const pluginInfo = pluginManager.getPluginInfo('test-plugin');

      expect(pluginInfo).toBe(mockMetadata);
      expect(mockRegistry.getPlugin).toHaveBeenCalledWith('test-plugin');
    });

    test('should return undefined for non-existent plugin info', () => {
      mockRegistry.getPlugin.mockReturnValue(undefined);

      const pluginInfo = pluginManager.getPluginInfo('non-existent');

      expect(pluginInfo).toBeUndefined();
    });
  });

  describe('Event Handling', () => {
    beforeEach(async () => {
      await pluginManager.initializePluginSystem();
    });

    test('should register state change callbacks', () => {
      const callback = jest.fn();

      pluginManager.onPluginStateChanged(callback);

      expect(mockRegistry.onPluginStateChanged).toHaveBeenCalled();
    });

    test('should register error callbacks', () => {
      const callback = jest.fn();

      pluginManager.onPluginError(callback);

      expect(mockRegistry.onPluginError).toHaveBeenCalled();
    });

    test('should handle callback registration errors gracefully', () => {
      const faultyCallback = () => {
        throw new Error('Callback error');
      };

      expect(() => pluginManager.onPluginStateChanged(faultyCallback)).not.toThrow();
      expect(() => pluginManager.onPluginError(faultyCallback)).not.toThrow();
    });
  });

  describe('Integration with Real Services', () => {
    let realPluginManager: EnhancedPluginManager;

    beforeEach(() => {
      realPluginManager = new EnhancedPluginManager();
    });

    test('should create with default services', () => {
      expect(realPluginManager.registry).toBeInstanceOf(PluginRegistry);
      expect(realPluginManager.discoveryService).toBeInstanceOf(PluginDiscoveryService);
    });

    test('should initialize with real services', async () => {
      await expect(realPluginManager.initializePluginSystem()).resolves.not.toThrow();
    });

    test('should handle real plugin loading workflow', async () => {
      await realPluginManager.initializePluginSystem();

      // Register a test plugin factory
      const testPlugin = new MockTestPlugin('integration-test-plugin');
      realPluginManager.discoveryService.registerPluginFactory(
        'integration-test-plugin',
        async () => testPlugin
      );

      // Load the plugin
      await realPluginManager.loadPlugin('integration-test-plugin');

      // Verify it's loaded
      expect(realPluginManager.getLoadedPlugins()).toContain('integration-test-plugin');

      // Get plugin info
      const pluginInfo = realPluginManager.getPluginInfo('integration-test-plugin');
      expect(pluginInfo?.name).toBe('integration-test-plugin');

      // Unload the plugin
      await realPluginManager.unloadPlugin('integration-test-plugin');
      expect(realPluginManager.getLoadedPlugins()).not.toContain('integration-test-plugin');
    });

    test('should handle plugin state changes in real system', async () => {
      const stateChangeCallback = jest.fn();
      realPluginManager.onPluginStateChanged(stateChangeCallback);

      await realPluginManager.initializePluginSystem();

      const testPlugin = new MockTestPlugin('state-test-plugin');
      realPluginManager.discoveryService.registerPluginFactory(
        'state-test-plugin',
        async () => testPlugin
      );

      await realPluginManager.loadPlugin('state-test-plugin');

      // Should have received state change notifications
      expect(stateChangeCallback).toHaveBeenCalled();
    });
  });
});
