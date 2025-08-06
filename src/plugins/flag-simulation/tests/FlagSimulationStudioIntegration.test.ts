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

describe("FlagSimulationPlugin Studio Integration Tests", () => {
  let world: World;
  let flagPlugin: FlagSimulationPlugin;
  let mockStudio: IStudio;
  let mockGraphicsManager: ThreeGraphicsManager;

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

    mockGraphicsManager = {
      getCamera: jest.fn().mockReturnValue(mockCamera),
      getControlsManager: jest.fn().mockReturnValue(mockControlsManager)
    } as any;

    mockStudio = {
      getGraphicsManager: jest.fn().mockReturnValue(mockGraphicsManager)
    } as any;

    // Register the plugin and get its systems to provide studio context
    flagPlugin.register(world); // Register components first
    flagPlugin.getSystems(mockStudio); // This should provide studio context to the plugin
  });

  test("should create flag entities when studio context is available", () => {
    // Act: Initialize entities with world only (as per interface)
    flagPlugin.initializeEntities(world);

    // Assert: Flag entities should be created
    const flagEntities = world.componentManager.getEntitiesWithComponents([FlagComponent]);
    expect(flagEntities.length).toBeGreaterThan(0);
  });

  test("should configure camera when studio context is available", () => {
    // Act: Initialize entities
    flagPlugin.initializeEntities(world);

    // Assert: Camera should be configured
    expect(mockGraphicsManager.getCamera).toHaveBeenCalled();
    expect(mockGraphicsManager.getCamera().position.set).toHaveBeenCalledWith(0, 30, 60);
    expect(mockGraphicsManager.getCamera().lookAt).toHaveBeenCalledWith(0, 0, 0);
    expect(mockGraphicsManager.getControlsManager).toHaveBeenCalled();
    expect(mockGraphicsManager.getControlsManager().enable).toHaveBeenCalled();
  });

  test("should create parameter panels when ParameterPanelComponent is registered", () => {
    // Act: Initialize entities
    flagPlugin.initializeEntities(world);

    // Assert: Parameter panels should be available
    const parameterPanels = flagPlugin.getParameterPanels(world);
    expect(parameterPanels.length).toBeGreaterThan(0);
  });

  test("should handle missing studio context gracefully", () => {
    // Arrange: Create a new plugin without studio context
    const newPlugin = new FlagSimulationPlugin();
    newPlugin.register(world); // Register components but don't call getSystems

    // Act & Assert: Should not throw error, but should log warning
    expect(() => {
      newPlugin.initializeEntities(world);
    }).not.toThrow();

    // Should not create entities when studio is not available
    const flagEntities = world.componentManager.getEntitiesWithComponents([FlagComponent]);
    expect(flagEntities.length).toBe(0);
  });
});
