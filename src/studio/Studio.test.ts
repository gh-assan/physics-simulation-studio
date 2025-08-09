import { Studio } from './Studio';
import { World } from '../core/ecs/World';
import { PluginManager } from '../core/plugin/PluginManager';
import { StateManager } from './state/StateManager';
import { SimplifiedRenderSystem } from './rendering/simplified/SimplifiedRenderSystem';

// Mocks
class MockPlugin {
  initializeEntities = jest.fn();
  getRenderer = jest.fn(() => 'renderer');
}
class MockPluginManager {
  plugins: Record<string, any> = {};
  activatePlugin = jest.fn(async (name: string, studio: any) => {});
  deactivatePlugin = jest.fn((name: string, studio: any) => {});
  getPlugin = jest.fn((name: string) => this.plugins[name]);
  getAvailablePluginNames = jest.fn(() => Object.keys(this.plugins));
}
class MockStateManager {
  selectedSimulation = {
    name: null,
    setSimulation: jest.fn(),
    getSimulationName: ((): string | null => null)
  };
}
class MockRenderSystem {
  update = jest.fn();
  clear = jest.fn();
  getScene = jest.fn(() => ({
    children: [],
    add: jest.fn(),
    remove: jest.fn(),
  }));
}

describe('Studio', () => {
  let studio: Studio;
  let world: World;
  let pluginManager: MockPluginManager;
  let stateManager: MockStateManager;
  let renderSystem: MockRenderSystem;

  beforeEach(() => {
    world = new World();
    pluginManager = new MockPluginManager();
    stateManager = new MockStateManager();
    renderSystem = new MockRenderSystem();

    // Create mock plugin context
    const mockPluginContext = {
      studio: undefined as any, // will be set after Studio is constructed
      world: world,
      eventBus: undefined,
      getStateManager: () => stateManager as any,
    };

    studio = new Studio(world, pluginManager as any, stateManager as any, mockPluginContext as any);
    mockPluginContext.studio = studio;
    studio.setRenderSystem(renderSystem as any);
    pluginManager.plugins['simA'] = new MockPlugin();
    stateManager.selectedSimulation.getSimulationName = jest.fn(() => null);
  });

  it('loads a simulation and updates state, dispatches event', async () => {
    const eventSpy = jest.fn();
    window.addEventListener('simulation-loaded', eventSpy);
    await studio.loadSimulation('simA');
    expect(pluginManager.activatePlugin).toHaveBeenCalledWith('simA', studio);
    expect(stateManager.selectedSimulation.setSimulation).toHaveBeenCalledWith('simA');
    expect(eventSpy).toHaveBeenCalled();
    window.removeEventListener('simulation-loaded', eventSpy);
  });

  it('unloads previous simulation before loading new one', async () => {
    stateManager.selectedSimulation.getSimulationName = jest.fn(() => 'simA');
    await studio.loadSimulation('simB');
    expect(pluginManager.deactivatePlugin).toHaveBeenCalledWith('simA', studio);
    expect(pluginManager.activatePlugin).toHaveBeenCalledWith('simB', studio);
  });

  it('returns renderer from active plugin', async () => {
    stateManager.selectedSimulation.getSimulationName = jest.fn(() => 'simA');
    expect(studio.getRenderer()).toBe('renderer');
  });

  it('returns available simulation names', () => {
    expect(studio.getAvailableSimulationNames()).toContain('simA');
  });

  it('updates world when playing', () => {
    studio['isPlaying'] = true;
    const updateSpy = jest.spyOn(world, 'update');
    studio.update(0.016);
    expect(updateSpy).toHaveBeenCalledWith(0.016);
  });

  it('does not update world when paused', () => {
    studio['isPlaying'] = false;
    const updateSpy = jest.spyOn(world, 'update');
    studio.update(0.016);
    expect(updateSpy).not.toHaveBeenCalled();
  });
});
