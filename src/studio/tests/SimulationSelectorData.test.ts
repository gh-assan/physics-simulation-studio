/**
 * Tests that Studio.getAvailableSimulationNames reflects PluginManager registrations,
 * which is used by the simulation selector UI.
 */
import { World } from '../../core/ecs/World';
import { PluginManager } from '../../core/plugin/PluginManager';
import FlagSimulationPlugin from '../../plugins/flag-simulation';
import { StateManager } from '../state/StateManager';
import { Studio } from '../Studio';

describe('Simulation selector data via Studio', () => {
  it('returns plugin names registered in PluginManager', () => {
    const world = new World();
    const pluginManager = new PluginManager(world);
    const stateManager = StateManager.getInstance();

    // Minimal pluginContext for Studio constructor
    const pluginContext: any = {
      studio: null,
      world,
      eventBus: undefined,
      getStateManager: () => stateManager,
    };

    const studio = new Studio(world as any, pluginManager as any, stateManager as any, pluginContext);
    pluginContext.studio = studio;

    // Initially empty
    expect(studio.getAvailableSimulationNames()).toEqual([]);

    // Register one plugin
    const flagPlugin = new FlagSimulationPlugin();
    pluginManager.registerPlugin(flagPlugin as any);
    expect(studio.getAvailableSimulationNames()).toEqual(['flag-simulation']);

    // Register another plugin dynamically (if available)
    class DummyPlugin {
      getName() { return 'dummy-sim'; }
      getDependencies() { return []; }
      register() {/* no-op */ }
      unregister() {/* no-op */ }
      async initializeEntities() {/* no-op */ }
      getSystems() { return []; }
    }
    pluginManager.registerPlugin(new DummyPlugin() as any);
    const names = studio.getAvailableSimulationNames();
    expect(names).toEqual(expect.arrayContaining(['flag-simulation', 'dummy-sim']));
  });
});
