import { World } from '../../core/ecs/World';
import { Studio } from '../Studio';
import { StateManager } from '../state/StateManager';
class MockPluginManager {
  plugins: Record<string, any> = {};
  activatePlugin = jest.fn(async (_name: string, _studio: any) => {});
  deactivatePlugin = jest.fn((_name: string, _studio: any) => {});
  getPlugin = jest.fn((name: string) => this.plugins[name]);
  getAvailablePluginNames = jest.fn(() => Object.keys(this.plugins));
}
import { RenderSystemAdapter } from '../rendering/RenderSystemAdapter';

describe('Studio RenderSystem configuration', () => {
  it('defaults to adapter when no mode provided', () => {
    const world = new World();
    const pluginManager = new MockPluginManager();
    const stateManager = StateManager.getInstance();

    const pluginContext = {
      studio: undefined as any,
      world,
      eventBus: undefined,
      getStateManager: () => stateManager,
    } as any;

    const studio = new Studio(world as any, pluginManager as any, stateManager as any, pluginContext);
    pluginContext.studio = studio;

  studio.configureRenderSystem();
  const gfx = studio.getGraphicsManager();
  expect(gfx).toBeDefined();
  expect((studio as any).renderSystem).toBeInstanceOf(RenderSystemAdapter);
  });

  it('can select adapter mode and forwards minimal renderer from SimulationManager', () => {
    const world = new World();
    const pluginManager = new MockPluginManager();
    const stateManager = StateManager.getInstance();

    const pluginContext = {
      studio: undefined as any,
      world,
      eventBus: undefined,
      getStateManager: () => stateManager,
    } as any;

    const studio = new Studio(world as any, pluginManager as any, stateManager as any, pluginContext);
    pluginContext.studio = studio;

    studio.configureRenderSystem('adapter');
    expect((studio as any).renderSystem).toBeInstanceOf(RenderSystemAdapter);

    // Wire a fresh SimulationManager into orchestrator and ensure forwarding works end-to-end
    const { SimulationManager } = require('../simulation/SimulationManager');
    const simManager = new SimulationManager();
    studio.setOrchestratorSimulationManager(simManager);
    studio.setOrchestratorRenderSystem((studio as any).renderSystem);

    const minimalRenderer = {
      name: 'adapter-mode-minimal',
      priority: 1,
      update: jest.fn(),
      dispose: jest.fn(),
    };

    simManager.registerRenderer('adapter-mode-minimal', minimalRenderer as any);

    const adapter = (studio as any).renderSystem as RenderSystemAdapter;
    adapter.update(world as any, 0);

    expect(minimalRenderer.update).toHaveBeenCalled();
    const info = adapter.getDebugInfo();
    expect(info.rendererCount).toBe(1);
    expect(info.renderers[0].name).toBe('adapter-mode-minimal');
  });
});
