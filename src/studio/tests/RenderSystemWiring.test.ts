import { World } from "../../core/ecs/World";
import { ThreeGraphicsManager } from "../graphics/ThreeGraphicsManager";
import { RenderSystem } from "../rendering/RenderSystem";
import { RenderSystemAdapter } from "../rendering/RenderSystemAdapter";
import { StateManager } from "../state/StateManager";
import { Studio } from "../Studio";

class MockPluginManager {
  plugins: Record<string, any> = {};
  activatePlugin = jest.fn(async (_name: string, _studio: any) => { });
  deactivatePlugin = jest.fn((_name: string, _studio: any) => { });
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

  it("exposes simulation debug info via Studio", () => {
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

    const simInfo = studio.getSimulationDebugInfo();
    expect(simInfo).toHaveProperty('algorithmsCount');
    expect(simInfo).toHaveProperty('entityCount');
  });

  it("adapts minimal RenderSystem to legacy surface (register + debug)", () => {
    const world = new World();
    const pluginManager = new MockPluginManager();
    const stateManager = StateManager.getInstance();

    const gfx = new ThreeGraphicsManager();
    const inner = new RenderSystem(gfx.getScene());
    const adapter = new RenderSystemAdapter(gfx, inner);

    const minimalRenderer = {
      name: 'minimal',
      priority: 5,
      update: jest.fn(),
      dispose: jest.fn()
    };

    adapter.registerRenderer(minimalRenderer);
    adapter.update(world as any, 0);
    expect(minimalRenderer.update).toHaveBeenCalled();
    const info = adapter.getDebugInfo();
    expect(info.rendererCount).toBe(1);
    expect(info.renderers[0].name).toBe('minimal');
  });

  it("SimulationManager forwards minimal renderer to adapter-backed RenderSystem", () => {
    const gfx = new ThreeGraphicsManager();
    const inner = new RenderSystem(gfx.getScene());
    const adapter = new RenderSystemAdapter(gfx, inner);

    // Fresh SimulationManager instance to avoid singleton cross-test state
    const { SimulationManager } = require('../simulation/SimulationManager');
    const simManager = new SimulationManager();
    simManager.setRenderSystem(adapter as any);

    const minimalRenderer = {
      name: 'from-sim-manager',
      priority: 1,
      update: jest.fn(),
      dispose: jest.fn(),
    };

    // Register via SimulationManager – should be forwarded to adapter/inner system
    simManager.registerRenderer('from-sim-manager', minimalRenderer as any);

    // Tick once
    adapter.update({} as any, 0);

    expect(minimalRenderer.update).toHaveBeenCalled();
    const info = adapter.getDebugInfo();
    expect(info.rendererCount).toBe(1);
    expect(info.renderers[0].name).toBe('from-sim-manager');
  });

  it("Studio/Orchestrator can use adapter-backed RenderSystem (end-to-end forwarding)", () => {
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

    // Prepare adapter-backed minimal render system
    const gfx = new ThreeGraphicsManager();
    const inner = new RenderSystem(gfx.getScene());
    const adapter = new RenderSystemAdapter(gfx, inner);

    // Inject fresh SimulationManager into orchestrator for isolation
    const { SimulationManager } = require('../simulation/SimulationManager');
    const simManager = new SimulationManager();
    studio.setOrchestratorSimulationManager(simManager);

    // Configure Studio/Orchestrator to use the adapter-backed system
    studio.setRenderSystem(adapter as any);

    // Register a minimal renderer via SimulationManager and verify it forwards
    const minimalRenderer = {
      name: 'studio-e2e',
      priority: 2,
      update: jest.fn(),
      dispose: jest.fn(),
    };

    simManager.registerRenderer('studio-e2e', minimalRenderer as any);

    // Tick adapter once to drive inner updates
    adapter.update(world as any, 0);

    expect(minimalRenderer.update).toHaveBeenCalled();
    const info = (studio as any).getRenderSystemDebugInfo();
    expect(info.rendererCount).toBe(1);
    expect(info.renderers[0].name).toBe('studio-e2e');
  });

  it("Adapter can unregister minimal renderer by name", () => {
    const world = new World();
    const gfx = new ThreeGraphicsManager();
    const inner = new RenderSystem(gfx.getScene());
    const adapter = new RenderSystemAdapter(gfx, inner);

    const r = { name: 'temp', priority: 1, update: jest.fn(), dispose: jest.fn() };
    adapter.registerRenderer(r as any);
    adapter.update(world as any, 0);
    expect(r.update).toHaveBeenCalledTimes(1);

    // Unregister by name and verify it's no longer updated
    adapter.unregisterRenderer('temp');
    adapter.update(world as any, 0);
    expect(r.update).toHaveBeenCalledTimes(1); // no new calls
    const info = adapter.getDebugInfo();
    expect(info.rendererCount).toBe(0);
  });

  it("Adapter.dispose() disposes inner minimal renderers and clears registry", () => {
    const gfx = new ThreeGraphicsManager();
    const inner = new RenderSystem(gfx.getScene());
    const adapter = new RenderSystemAdapter(gfx, inner);

    const r = { name: 'to-dispose', priority: 1, update: jest.fn(), dispose: jest.fn() };
    adapter.registerRenderer(r as any);
    const before = adapter.getDebugInfo();
    expect(before.rendererCount).toBe(1);

    adapter.dispose();
    expect(r.dispose).toHaveBeenCalled();
    const after = adapter.getDebugInfo();
    expect(after.rendererCount).toBe(0);
  });
});
