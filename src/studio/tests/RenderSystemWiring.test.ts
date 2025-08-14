import { Studio } from "../Studio";
import { World } from "../../core/ecs/World";
import { StateManager } from "../state/StateManager";

class MockPluginManager {
  plugins: Record<string, any> = {};
  activatePlugin = jest.fn(async (_name: string, _studio: any) => {});
  deactivatePlugin = jest.fn((_name: string, _studio: any) => {});
  getPlugin = jest.fn((name: string) => this.plugins[name]);
  getAvailablePluginNames = jest.fn(() => Object.keys(this.plugins));
}

class MockRenderSystem {
  getDebugInfo = jest.fn(() => ({ rendererCount: 1, renderers: [{ name: 'mock', priority: 10 }] }));
}

describe("Studio RenderSystem wiring (TDD)", () => {
  it("exposes render system debug info via Studio", () => {
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

    const renderSystem = new MockRenderSystem();
    studio.setRenderSystem(renderSystem as any);

    const info = (studio as any).getRenderSystemDebugInfo();
    expect(info.rendererCount).toBe(1);
    expect(info.renderers[0].name).toBe('mock');
  });
});
