import { World } from "../../../core/ecs/World";
import flagSimulationPluginInstance, { FlagSimulationPlugin } from "../index";
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
    flagPlugin = new FlagSimulationPlugin(); // Create new instance for testing

    // Mock graphics manager
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

  test("should create flag entities when studio context is available", async () => {
    // Act: Initialize entities with world only (as per interface) - await async operation
    await flagPlugin.initializeEntities(world);

    // Wait a bit more for the async setTimeout in the plugin
    await new Promise(resolve => setTimeout(resolve, 50));

    // Assert: Flag entities should be created using the IWorld interface
    const flagEntities = world.getEntitiesWithComponents([FlagComponent]);
    expect(flagEntities.length).toBeGreaterThan(0);
  });

  test("should initialize entities without camera configuration", () => {
    // Act: Initialize entities
    flagPlugin.initializeEntities(world);

    // Assert: Camera should not be configured in initializeEntities (handled by systems)
    // The plugin focuses on entity creation, not camera setup
    expect(mockGraphicsManager.getCamera).not.toHaveBeenCalled();
  });

  test("should create parameter panels when ParameterPanelComponent is registered", () => {
    // Act: Initialize entities
    flagPlugin.initializeEntities(world);

    // Assert: Parameter schema should be available
    const parameterSchema = flagPlugin.getParameterSchema();
    expect(parameterSchema).toBeDefined();
    expect(parameterSchema.pluginId).toBe('flag-simulation');
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
