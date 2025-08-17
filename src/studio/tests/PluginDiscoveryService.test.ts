/**
 * Tests for PluginDiscoveryService and its integration with PluginManager
 */
import { World } from '../../core/ecs/World';
import { PluginManager } from '../../core/plugin/PluginManager';
import { PluginDiscoveryService } from '../plugins/PluginDiscoveryService';

describe('PluginDiscoveryService', () => {
  let world: World;
  let pluginManager: PluginManager;
  let discovery: PluginDiscoveryService;

  beforeEach(() => {
    world = new World();
    pluginManager = new PluginManager(world);
    discovery = new PluginDiscoveryService(pluginManager);
  });

  it('exposes available plugin names without loading', () => {
    const names = discovery.getAvailablePluginNames();
    expect(names).toEqual(expect.arrayContaining(['flag-simulation', 'water-simulation', 'solar-system']));
  });

  it('loads a specific plugin and registers it with PluginManager', async () => {
    const ok = await discovery.loadPlugin('flag-simulation');
    expect(ok).toBe(true);
    const plugin = pluginManager.getPlugin('flag-simulation');
    expect(plugin).toBeTruthy();
    expect(plugin?.getName()).toBe('flag-simulation');
  });

  it('loads all plugins and de-duplicates registration', async () => {
    // First load one explicitly
    await discovery.loadPlugin('flag-simulation');
    const beforeAll = pluginManager.getAvailablePluginNames();

    // Then load all
    const loaded = await discovery.loadAllPlugins();
    expect(loaded.length).toBeGreaterThan(0);
    expect(loaded).toEqual(expect.arrayContaining(['flag-simulation']));

    const afterAll = pluginManager.getAvailablePluginNames();
    // Should contain the known discovered plugins
    expect(afterAll).toEqual(expect.arrayContaining(['flag-simulation', 'water-simulation', 'solar-system']));
    // And no obvious duplicates (size should be <= discovered set size)
    const unique = new Set(afterAll);
    expect(unique.size).toBe(afterAll.length);
  });
});
