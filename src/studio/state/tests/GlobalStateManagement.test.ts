import {GlobalStateStore} from '../GlobalStore';
import {createInitialAppState, PluginInfo, SystemInfo, ComponentInfo} from '../AppState';
import {Actions} from '../Actions';
import {PluginSelectors, SystemSelectors, ComponentSelectors, SimulationSelectors} from '../Selectors';

describe('Global State Management System', () => {
  let store: GlobalStateStore;

  beforeEach(() => {
    store = new GlobalStateStore(createInitialAppState());
  });

  describe('Store Functionality', () => {
    it('should initialize with empty state', () => {
      const state = store.getState();
      expect(state.plugins.length).toBe(0);
      expect(state.systems.length).toBe(0);
      expect(state.components.length).toBe(0);
      expect(state.simulation.isRunning).toBe(false);
    });

    it('should handle plugin registration', () => {
      const pluginInfo: PluginInfo = {
        name: 'TestPlugin',
        version: '1.0.0',
        dependencies: [],
        isRegistered: true,
        isActive: false,
        metadata: {
          displayName: 'Test Plugin',
          description: 'A test plugin',
          author: 'Test Author'
        }
      };

      const action = Actions.pluginRegistered(pluginInfo);
      store.dispatch(action);
      const state = store.getState();

      expect(state.plugins.length).toBe(1);
      expect(state.plugins[0].name).toBe('TestPlugin');
      expect(state.plugins[0].version).toBe('1.0.0');
      expect(state.plugins[0].isRegistered).toBe(true);
    });

    it('should handle system registration', () => {
      const systemInfo: SystemInfo = {
        name: 'TestSystem',
        priority: 100,
        isActive: false,
        componentDependencies: []
      };

      const action = Actions.systemRegistered(systemInfo);
      store.dispatch(action);
      const state = store.getState();

      expect(state.systems.length).toBe(1);
      expect(state.systems[0].name).toBe('TestSystem');
      expect(state.systems[0].priority).toBe(100);
    });

    it('should handle component registration', () => {
      const componentInfo: ComponentInfo = {
        name: 'TestComponent',
        type: 'test',
        isRegistered: true,
        entityCount: 0
      };

      const action = Actions.componentRegistered(componentInfo);
      store.dispatch(action);
      const state = store.getState();

      expect(state.components.length).toBe(1);
      expect(state.components[0].name).toBe('TestComponent');
      expect(state.components[0].type).toBe('test');
    });
  });

  describe('Selectors', () => {
    beforeEach(() => {
      // Add test plugins
      const plugin1: PluginInfo = {
        name: 'Plugin1',
        version: '1.0.0',
        dependencies: [],
        isRegistered: true,
        isActive: false,
        metadata: {
          displayName: 'Plugin 1',
          description: 'First test plugin',
          author: 'Test Author'
        }
      };

      const plugin2: PluginInfo = {
        name: 'Plugin2',
        version: '2.0.0',
        dependencies: [],
        isRegistered: true,
        isActive: true,
        metadata: {
          displayName: 'Plugin 2',
          description: 'Second test plugin',
          author: 'Test Author'
        }
      };

      const system1: SystemInfo = {
        name: 'System1',
        priority: 100,
        isActive: true,
        componentDependencies: []
      };

      const component1: ComponentInfo = {
        name: 'Component1',
        type: 'test',
        isRegistered: true,
        entityCount: 5
      };

      store.dispatch(Actions.pluginRegistered(plugin1));
      store.dispatch(Actions.pluginRegistered(plugin2));
      store.dispatch(Actions.systemRegistered(system1));
      store.dispatch(Actions.componentRegistered(component1));
    });

    it('should correctly select all plugins', () => {
      const plugins = PluginSelectors.getAllPlugins(store.getState());
      expect(plugins.length).toBe(2);
      expect(plugins[0].name).toBe('Plugin1');
      expect(plugins[1].name).toBe('Plugin2');
    });

    it('should correctly select active plugins', () => {
      const activePlugins = PluginSelectors.getActivePlugins(store.getState());
      expect(activePlugins.length).toBe(1);
      expect(activePlugins[0].name).toBe('Plugin2');
    });

    it('should correctly select all systems', () => {
      const systems = SystemSelectors.getAllSystems(store.getState());
      expect(systems.length).toBe(1);
      expect(systems[0].name).toBe('System1');
    });

    it('should correctly select all components', () => {
      const components = ComponentSelectors.getAllComponents(store.getState());
      expect(components.length).toBe(1);
      expect(components[0].name).toBe('Component1');
    });

    it('should correctly get simulation state', () => {
      const simState = SimulationSelectors.getSimulationState(store.getState());
      expect(simState.isRunning).toBe(false);
      expect(simState.currentSimulation).toBeNull();
    });
  });

  describe('Subscription System', () => {
    it('should notify subscribers of state changes', () => {
      const mockCallback = jest.fn();
      const subscription = store.subscribe(mockCallback);

      const pluginInfo: PluginInfo = {
        name: 'TestPlugin',
        version: '1.0.0',
        dependencies: [],
        isRegistered: true,
        isActive: false,
        metadata: {
          displayName: 'Test Plugin',
          description: 'A test plugin',
          author: 'Test Author'
        }
      };

      store.dispatch(Actions.pluginRegistered(pluginInfo));

      expect(mockCallback).toHaveBeenCalledTimes(1);
      subscription.unsubscribe();
    });

    it('should stop notifications after unsubscribing', () => {
      const mockCallback = jest.fn();
      const subscription = store.subscribe(mockCallback);

      subscription.unsubscribe();

      const pluginInfo: PluginInfo = {
        name: 'TestPlugin',
        version: '1.0.0',
        dependencies: [],
        isRegistered: true,
        isActive: false,
        metadata: {
          displayName: 'Test Plugin',
          description: 'A test plugin',
          author: 'Test Author'
        }
      };

      store.dispatch(Actions.pluginRegistered(pluginInfo));

      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('Action History', () => {
    it('should track action history', () => {
      const pluginInfo: PluginInfo = {
        name: 'TestPlugin',
        version: '1.0.0',
        dependencies: [],
        isRegistered: true,
        isActive: false,
        metadata: {
          displayName: 'Test Plugin',
          description: 'A test plugin',
          author: 'Test Author'
        }
      };

      store.dispatch(Actions.pluginRegistered(pluginInfo));
      store.dispatch(Actions.pluginActivated('TestPlugin'));

      const history = store.getActionHistory();
      expect(history).toHaveLength(2);
      expect(history[0].type).toBe('PLUGIN_REGISTERED');
      expect(history[1].type).toBe('PLUGIN_ACTIVATED');
    });
  });

  describe('Simulation State Management', () => {
    it('should handle simulation loading', () => {
      store.dispatch(Actions.simulationLoaded('test-sim'));
      const state = store.getState();

      expect(state.simulation.currentSimulation).toBe('test-sim');
    });

    it('should handle simulation unloading', () => {
      // First load a simulation
      store.dispatch(Actions.simulationLoaded('test-sim'));

      // Then unload it
      store.dispatch(Actions.simulationUnloaded());
      const state = store.getState();

      expect(state.simulation.currentSimulation).toBeNull();
    });
  });
});
