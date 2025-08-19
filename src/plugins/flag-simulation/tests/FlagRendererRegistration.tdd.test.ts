
import { World } from "../../../core/ecs/World";
import { FlagSimulationPlugin } from "../index";
import { SimplifiedFlagRenderer } from "../SimplifiedFlagRenderer";

describe("FlagSimulationPlugin Renderer Registration Integration", () => {
  let world: World;
  let flagPlugin: FlagSimulationPlugin;
  let mockAdapter: any;

  beforeEach(() => {
    world = new World();
    flagPlugin = new FlagSimulationPlugin();
    flagPlugin.register(world);
    // Mock adapter-based render system
    mockAdapter = { registerRenderer: jest.fn(), constructor: { name: 'RenderSystemAdapter' } };
    (world as any).systemManager = {
      getAllSystems: () => [mockAdapter]
    };
    // Mock studio context with active simulation
    (window as any).studio = {
      selectedSimulation: { getSimulationName: () => 'flag-simulation' }
    };
  });

  test("should register SimplifiedFlagRenderer with adapter render system when simulation is active", async () => {
    await (flagPlugin as any).registerRendererIfActive(world);
    expect(mockAdapter.registerRenderer).toHaveBeenCalled();
    const callArg = mockAdapter.registerRenderer.mock.calls[0][0];
    expect(callArg).toBeInstanceOf(SimplifiedFlagRenderer);
  });
});
