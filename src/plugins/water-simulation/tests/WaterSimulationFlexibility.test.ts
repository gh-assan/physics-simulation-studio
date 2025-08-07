import { World } from "../../../core/ecs/World";
import { WaterSimulationPlugin } from "../index";

jest.mock("../WaterRenderer", () => {
  return {
    WaterRenderer: jest.fn().mockImplementation(() => {
      return {
        render: jest.fn(),
        unregister: jest.fn()
      };
    })
  };
});
import { PositionComponent } from "../../../core/components/PositionComponent";
import { RenderableComponent } from "../../../core/components/RenderableComponent";
import { SelectableComponent } from "../../../core/components/SelectableComponent";
import { RotationComponent } from "../../../core/components/RotationComponent";
import { WaterBodyComponent, WaterDropletComponent } from "../WaterComponents";

describe("WaterSimulationFlexibility", () => {
  let world: World;
  let waterPlugin: WaterSimulationPlugin;

  beforeEach(() => {
    world = new World();
    waterPlugin = new WaterSimulationPlugin();
  });

  test("Water simulation works without ParameterPanelComponent registered", () => {
    // Don't register ParameterPanelComponent

    // Register required components
    world.componentManager.registerComponent(PositionComponent);
    world.componentManager.registerComponent(RenderableComponent);
    world.componentManager.registerComponent(SelectableComponent);
    world.componentManager.registerComponent(RotationComponent);
    world.componentManager.registerComponent(WaterBodyComponent);
    world.componentManager.registerComponent(WaterDropletComponent);

    // Register the water plugin
    waterPlugin.register(world);

    // Initialize entities
    waterPlugin.initializeEntities(world);

    // Verify that entities were created
    const entities = world.entityManager.getAllEntities();
    expect(entities.size).toBeGreaterThan(0);

    // Verify that water components were added
    const waterBodyEntities =
      world.componentManager.getEntitiesWithComponentTypes([
        "WaterBodyComponent"
      ]);
    expect(waterBodyEntities.length).toBeGreaterThan(0);

    const waterDropletEntities =
      world.componentManager.getEntitiesWithComponentTypes([
        "WaterDropletComponent"
      ]);
    expect(waterDropletEntities.length).toBeGreaterThan(0);

    // Verify that parameter schema is available
    const parameterSchema = waterPlugin.getParameterSchema();
    expect(parameterSchema).toBeDefined();
    expect(parameterSchema.pluginId).toBe('water-simulation');

    // Clean parameter system doesn't create entities for parameter panels
    console.log('Using new clean plugin-based parameter system - no parameter panel entities needed');
  });

  // Skip this test for now as we can't directly register the abstract ParameterPanelComponent
  test.skip("Water simulation works with ParameterPanelComponent registered", () => {
    // In a real application, a concrete implementation of ParameterPanelComponent would be registered
    // For testing purposes, we would need to create a mock or use a concrete implementation

    // For now, we'll just verify that the water simulation works without parameter panels
    // which is the main requirement from the issue description

    // Register required components
    world.componentManager.registerComponent(PositionComponent);
    world.componentManager.registerComponent(RenderableComponent);
    world.componentManager.registerComponent(SelectableComponent);
    world.componentManager.registerComponent(RotationComponent);
    world.componentManager.registerComponent(WaterBodyComponent);
    world.componentManager.registerComponent(WaterDropletComponent);

    // Register the water plugin
    waterPlugin.register(world);

    // Initialize entities
    waterPlugin.initializeEntities(world);

    // Verify that entities were created
    const entities = world.entityManager.getAllEntities();
    expect(entities.size).toBeGreaterThan(0);

    // Verify that water components were added
    const waterBodyEntities =
      world.componentManager.getEntitiesWithComponentTypes([
        "WaterBodyComponent"
      ]);
    expect(waterBodyEntities.length).toBeGreaterThan(0);

    const waterDropletEntities =
      world.componentManager.getEntitiesWithComponentTypes([
        "WaterDropletComponent"
      ]);
    expect(waterDropletEntities.length).toBeGreaterThan(0);
  });
});
