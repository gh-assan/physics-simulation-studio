import { World } from "../../core/ecs/World";
import { PluginManager } from "../../core/plugin/PluginManager";
import { Studio } from "../Studio";
import { UIManager } from "../uiManager";
import { PropertyInspectorSystem } from "../systems/PropertyInspectorSystem";
import { FlagSimulationPlugin } from "../../plugins/flag-simulation";
import { WaterSimulationPlugin } from "../../plugins/water-simulation";
import { SelectableComponent } from "../../core/components/SelectableComponent";
import { FlagComponent } from "../../plugins/flag-simulation/FlagComponent";
import { WaterDropletComponent } from "../../plugins/water-simulation/WaterComponents";
import { ParameterPanelComponent } from "../../core/components/ParameterPanelComponent";

// Mock UIManager
jest.mock("../uiManager", () => {
  return {
    UIManager: jest.fn().mockImplementation(() => {
      return {
        registerComponentControls: jest.fn(),
        clearControls: jest.fn()
      };
    })
  };
});

describe("Plugin Parameter Panel Integration", () => {
  let world: World;
  let pluginManager: PluginManager;
  let studio: Studio;
  let uiManager: UIManager;
  let propertyInspectorSystem: PropertyInspectorSystem;
  let flagPlugin: FlagSimulationPlugin;
  let waterPlugin: WaterSimulationPlugin;

  beforeEach(() => {
    // Create a new world for each test
    world = new World();
    pluginManager = new PluginManager(world);
    studio = new Studio(world, pluginManager);
    uiManager = new UIManager(null as any);
    propertyInspectorSystem = new PropertyInspectorSystem(uiManager, world, studio, pluginManager);

    // Register components
    world.componentManager.registerComponent(SelectableComponent.type, SelectableComponent);
    world.componentManager.registerComponent(FlagComponent.type, FlagComponent);
    world.componentManager.registerComponent(WaterDropletComponent.type, WaterDropletComponent);
    world.componentManager.registerComponent(ParameterPanelComponent.type, ParameterPanelComponent);

    // Create and register plugins
    flagPlugin = new FlagSimulationPlugin();
    waterPlugin = new WaterSimulationPlugin();
    pluginManager.registerPlugin(flagPlugin);
    pluginManager.registerPlugin(waterPlugin);

    // Register the PropertyInspectorSystem
    world.systemManager.registerSystem(propertyInspectorSystem);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should get parameter panels from the flag simulation plugin", async () => {
    // Mock the studio.getActiveSimulationName method
    jest.spyOn(studio, "getActiveSimulationName").mockReturnValue("flag-simulation");

    // Mock the pluginManager.getPlugin method
    jest.spyOn(pluginManager, "getPlugin").mockReturnValue(flagPlugin);

    // Activate the flag simulation plugin
    await pluginManager.activatePlugin("flag-simulation");

    // Get parameter panels from the active plugin
    const panels = (propertyInspectorSystem as any).getParameterPanelsFromActivePlugin();

    // There should be at least one panel
    expect(panels.length).toBeGreaterThan(0);
    expect(panels[0].componentType).toBe(FlagComponent.type);
  });

  it("should get parameter panels from the water simulation plugin", async () => {
    // Mock the studio.getActiveSimulationName method
    jest.spyOn(studio, "getActiveSimulationName").mockReturnValue("water-simulation");

    // Mock the pluginManager.getPlugin method
    jest.spyOn(pluginManager, "getPlugin").mockReturnValue(waterPlugin);

    // Activate the water simulation plugin
    await pluginManager.activatePlugin("water-simulation");

    // Get parameter panels from the active plugin
    const panels = (propertyInspectorSystem as any).getParameterPanelsFromActivePlugin();

    // There should be at least one panel
    expect(panels.length).toBeGreaterThan(0);
    expect(panels.some(panel => panel.componentType === WaterDropletComponent.type)).toBe(true);
  });

  it("should update the UI when switching between simulations", async () => {
    // Create entities for both simulations
    const flagEntity = world.entityManager.createEntity();
    world.componentManager.addComponent(
      flagEntity,
      SelectableComponent.type,
      new SelectableComponent(true)
    );
    world.componentManager.addComponent(
      flagEntity,
      FlagComponent.type,
      new FlagComponent()
    );

    const waterDropletEntity = world.entityManager.createEntity();
    world.componentManager.addComponent(
      waterDropletEntity,
      SelectableComponent.type,
      new SelectableComponent(true)
    );
    world.componentManager.addComponent(
      waterDropletEntity,
      WaterDropletComponent.type,
      new WaterDropletComponent()
    );

    // Spy on the updateInspectorForEntity method
    const updateInspectorSpy = jest.spyOn(
      propertyInspectorSystem as any,
      "updateInspectorForEntity"
    );

    // Activate the flag simulation plugin
    jest.spyOn(studio, "getActiveSimulationName").mockReturnValue("flag-simulation");
    jest.spyOn(pluginManager, "getPlugin").mockReturnValue(flagPlugin);
    await pluginManager.activatePlugin("flag-simulation");

    // Dispatch a simulation-loaded event
    const flagEvent = new CustomEvent("simulation-loaded", {
      detail: { simulationName: "flag-simulation" }
    });
    window.dispatchEvent(flagEvent);

    // Update the system
    propertyInspectorSystem.update(world, 0);

    // The updateInspectorForEntity method should be called with the flag entity
    expect(updateInspectorSpy).toHaveBeenCalledWith(world, flagEntity);

    // Clear the mock
    updateInspectorSpy.mockClear();

    // Activate the water simulation plugin
    jest.spyOn(studio, "getActiveSimulationName").mockReturnValue("water-simulation");
    jest.spyOn(pluginManager, "getPlugin").mockReturnValue(waterPlugin);
    await pluginManager.activatePlugin("water-simulation");

    // Dispatch a simulation-loaded event
    const waterEvent = new CustomEvent("simulation-loaded", {
      detail: { simulationName: "water-simulation" }
    });
    window.dispatchEvent(waterEvent);

    // Update the system
    propertyInspectorSystem.update(world, 0);

    // The updateInspectorForEntity method should be called with the water droplet entity
    expect(updateInspectorSpy).toHaveBeenCalledWith(world, waterDropletEntity);
  });

  it("should update the UI when play is clicked", async () => {
    // Create a flag entity
    const flagEntity = world.entityManager.createEntity();
    world.componentManager.addComponent(
      flagEntity,
      SelectableComponent.type,
      new SelectableComponent(true)
    );
    world.componentManager.addComponent(
      flagEntity,
      FlagComponent.type,
      new FlagComponent()
    );

    // Spy on the updateInspectorForEntity method
    const updateInspectorSpy = jest.spyOn(
      propertyInspectorSystem as any,
      "updateInspectorForEntity"
    );

    // Activate the flag simulation plugin
    jest.spyOn(studio, "getActiveSimulationName").mockReturnValue("flag-simulation");
    jest.spyOn(pluginManager, "getPlugin").mockReturnValue(flagPlugin);
    await pluginManager.activatePlugin("flag-simulation");

    // Dispatch a simulation-play event
    const playEvent = new CustomEvent("simulation-play", {
      detail: { simulationName: "flag-simulation" }
    });
    window.dispatchEvent(playEvent);

    // The updateInspectorForEntity method should be called with the flag entity
    expect(updateInspectorSpy).toHaveBeenCalledWith(world, flagEntity);
  });

  it("should update the UI when pause is clicked", async () => {
    // Create a flag entity
    const flagEntity = world.entityManager.createEntity();
    world.componentManager.addComponent(
      flagEntity,
      SelectableComponent.type,
      new SelectableComponent(true)
    );
    world.componentManager.addComponent(
      flagEntity,
      FlagComponent.type,
      new FlagComponent()
    );

    // Spy on the updateInspectorForEntity method
    const updateInspectorSpy = jest.spyOn(
      propertyInspectorSystem as any,
      "updateInspectorForEntity"
    );

    // Activate the flag simulation plugin
    jest.spyOn(studio, "getActiveSimulationName").mockReturnValue("flag-simulation");
    jest.spyOn(pluginManager, "getPlugin").mockReturnValue(flagPlugin);
    await pluginManager.activatePlugin("flag-simulation");

    // Dispatch a simulation-pause event
    const pauseEvent = new CustomEvent("simulation-pause", {
      detail: { simulationName: "flag-simulation" }
    });
    window.dispatchEvent(pauseEvent);

    // The updateInspectorForEntity method should be called with the flag entity
    expect(updateInspectorSpy).toHaveBeenCalledWith(world, flagEntity);
  });
});
