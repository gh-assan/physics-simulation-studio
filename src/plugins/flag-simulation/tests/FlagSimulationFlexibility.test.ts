import { World } from "../../../core/ecs/World";
import { FlagSimulationPlugin } from "../index";
import { ParameterPanelComponent } from "../../../core/components/ParameterPanelComponent";
import { FlagComponent } from "../FlagComponent";
import { IStudio } from "../../../studio/IStudio";
import { ThreeGraphicsManager } from "../../../studio/graphics/ThreeGraphicsManager";

// Mock THREE library
jest.mock("three", () => {
  return {
    Vector3: jest.fn().mockImplementation(() => {
      return { x: 0, y: 0, z: 0 };
    }),
    Quaternion: jest.fn().mockImplementation(() => {
      return {
        x: 0, y: 0, z: 0, w: 1,
        setFromAxisAngle: jest.fn().mockReturnThis()
      };
    })
  };
});

describe("FlagSimulationPlugin UI Tests", () => {
  let world: World;
  let flagPlugin: FlagSimulationPlugin;
  let mockStudio: IStudio;

  beforeEach(() => {
    world = new World();
    flagPlugin = new FlagSimulationPlugin();

    // Create mock studio with required methods
    const mockCamera = {
      position: { set: jest.fn() },
      lookAt: jest.fn()
    };

    const mockControlsManager = {
      enable: jest.fn()
    };

    const mockGraphicsManager = {
      getCamera: jest.fn().mockReturnValue(mockCamera),
      getControlsManager: jest.fn().mockReturnValue(mockControlsManager)
    } as any;

    mockStudio = {
      getGraphicsManager: jest.fn().mockReturnValue(mockGraphicsManager)
    } as any;

    // Register the plugin and provide studio context
    flagPlugin.register(world);
    flagPlugin.getSystems(mockStudio);

    // Initialize entities and components
    flagPlugin.initializeEntities(world);
  });

  test("Global parameter panel should be rendered", () => {
    // Check that parameter panels are available from the plugin
    const parameterPanels = flagPlugin.getParameterPanels(world);
    expect(parameterPanels.length).toBeGreaterThan(0);

    const globalPanel = parameterPanels[0];
    expect(globalPanel).toBeDefined();
    expect(globalPanel?.isVisible()).toBe(true);
  });

  test("Simulation parameter panel should be rendered", () => {
    // Check that parameter panels are available from the plugin
    const parameterPanels = flagPlugin.getParameterPanels(world);
    expect(parameterPanels.length).toBeGreaterThan(0);

    const simulationPanel = parameterPanels[0];
    expect(simulationPanel).toBeDefined();
    expect(simulationPanel?.isVisible()).toBe(true);
  });

  test("Flag should be rendered and visible", () => {
    // Find entities with FlagComponent instead of assuming entity ID 0
    const flagEntities = world.componentManager.getEntitiesWithComponents([FlagComponent]);
    expect(flagEntities.length).toBeGreaterThan(0);

    const flagEntity = flagEntities[0];
    const flag = world.componentManager.getComponent(flagEntity, FlagComponent.type) as FlagComponent;
    expect(flag).toBeDefined();
    expect(flag?.isVisible()).toBe(true);
  });
});
