import { Studio } from './Studio';
import { World } from '../core/ecs/World';
import { PluginManager } from '../core/plugin/PluginManager';
import { StateManager } from './state/StateManager';
import { RenderSystem } from './systems/RenderSystem';

// Mocks
class MockPlugin {
  initializeEntities = jest.fn();
  getRenderer = jest.fn(() => 'renderer');
}
class MockPluginManager {
  plugins: Record<string, any> = {};
  activatePlugin = jest.fn(async (name: string) => {});
  deactivatePlugin = jest.fn((name: string) => {});
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
    studio = new Studio(world, pluginManager as any, stateManager as any);
    studio.setRenderSystem(renderSystem as any);
    pluginManager.plugins['simA'] = new MockPlugin();
    stateManager.selectedSimulation.getSimulationName = jest.fn(() => null);
  });

  it('loads a simulation and updates state, dispatches event', async () => {
    const eventSpy = jest.fn();
    window.addEventListener('simulation-loaded', eventSpy);
    await studio.loadSimulation('simA');
    expect(pluginManager.activatePlugin).toHaveBeenCalledWith('simA');
    expect(stateManager.selectedSimulation.setSimulation).toHaveBeenCalledWith('simA');
    expect(eventSpy).toHaveBeenCalled();
    window.removeEventListener('simulation-loaded', eventSpy);
  });

  it('unloads previous simulation before loading new one', async () => {
    stateManager.selectedSimulation.getSimulationName = jest.fn(() => 'simA');
    await studio.loadSimulation('simB');
    expect(pluginManager.deactivatePlugin).toHaveBeenCalledWith('simA');
    expect(pluginManager.activatePlugin).toHaveBeenCalledWith('simB');
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
