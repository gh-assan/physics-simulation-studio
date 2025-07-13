// Mock three.js for test environment
jest.mock('three', () => ({
  Object3D: jest.fn(() => ({})),
  Mesh: jest.fn(() => ({})),
  Scene: jest.fn(() => ({})),
  PerspectiveCamera: jest.fn(() => ({})),
  WebGLRenderer: jest.fn(() => ({
    setSize: jest.fn(),
    render: jest.fn(),
    domElement: {},
    dispose: jest.fn(),
  })),
  Vector3: jest.fn(() => ({ x: 0, y: 0, z: 0 })),
  Color: jest.fn(() => ({})),
  BoxGeometry: jest.fn(() => ({})),
  MeshBasicMaterial: jest.fn(() => ({})),
  // Add more as needed
}));

import { World } from "../../core/ecs/World";
import { PluginManager } from "../../core/plugin/PluginManager";
import { Studio } from "../Studio";
jest.mock("../ui/PropertyInspectorUIManager");
import { PropertyInspectorUIManager } from "../ui/PropertyInspectorUIManager";
import { PropertyInspectorSystem } from "../systems/PropertyInspectorSystem";
import { FlagSimulationPlugin } from "../../plugins/flag-simulation";
import { WaterSimulationPlugin } from "../../plugins/water-simulation";
import { SelectableComponent } from "../../core/components/SelectableComponent";
import { FlagComponent } from "../../plugins/flag-simulation/FlagComponent";
import { WaterDropletComponent } from "../../plugins/water-simulation/WaterComponents";
import { ParameterPanelComponent } from "../../core/components/ParameterPanelComponent";
import { MockParameterPanelComponent } from "./MockParameterPanelComponent";
import { StateManager } from "../state/StateManager";
import { SelectionSystem } from "../systems/SelectionSystem";

describe("Plugin Parameter Panel Integration", () => {
  let world: World;
  let pluginManager: jest.Mocked<PluginManager>;
  let studio: jest.Mocked<Studio>;
  let propertyInspectorUIManager: jest.Mocked<PropertyInspectorUIManager>;
  let propertyInspectorSystem: PropertyInspectorSystem;
  let flagPlugin: FlagSimulationPlugin;
  let waterPlugin: WaterSimulationPlugin;
  let selectionSystem: jest.Mocked<SelectionSystem>;

  beforeEach(() => {
    // Create a new world for each test
    world = new World();

    // Explicitly mock dependencies
    propertyInspectorUIManager = {
      registerComponentControls: jest.fn(),
      clearInspectorControls: jest.fn(),
      registerParameterPanels: jest.fn(),
      uiManager: {} as any,
    } as unknown as jest.Mocked<PropertyInspectorUIManager>;

    pluginManager = {
      getPlugin: jest.fn().mockImplementation((pluginName: string) => {
        if (pluginName === "flag-simulation") return flagPlugin;
        if (pluginName === "water-simulation") return waterPlugin;
        return undefined;
      }),
      deactivatePlugin: jest.fn(),
      activatePlugin: jest.fn(),
      getAvailablePluginNames: jest.fn().mockReturnValue(["flag-simulation", "water-simulation"]),
      registerPlugin: jest.fn(),
      onPluginsChanged: jest.fn(),
      on: jest.fn(),
      getActivePluginNames: jest.fn().mockReturnValue(["flag-simulation", "water-simulation"]),
    } as any;

    studio = {
      _world: world,
      pluginManager: pluginManager,
      renderSystem: null,
      isPlaying: true,
      selectedSimulation: {} as any, // Mock as needed
      _activePluginName: null,
      getActiveSimulationName: jest.fn(),
      play: jest.fn(),
      pause: jest.fn(),
      loadSimulation: jest.fn(),
      getAvailableSimulationNames: jest.fn().mockReturnValue(["flag-simulation", "water-simulation"]),
      setRenderSystem: jest.fn(),
      reset: jest.fn(),
      update: jest.fn(),
      getIsPlaying: jest.fn(),
      getRenderer: jest.fn(),
      world: world,
    } as any;

    selectionSystem = {
      currentSelectedEntity: null,
      onSimulationLoaded: jest.fn(),
      getSelectedEntity: jest.fn(() => 0), // Always return the first entity ID
      setSelectedEntity: jest.fn(),
      update: jest.fn(),
      setDefaultSelectedEntity: jest.fn(),
      world: world,
      onRegister: jest.fn(),
      onRemove: jest.fn(),
    } as any;

    // Instantiate the system under test
    propertyInspectorSystem = new PropertyInspectorSystem(
      propertyInspectorUIManager,
      world,
      studio,
      pluginManager,
      selectionSystem
    );

    // Register components
    world.componentManager.registerComponent(SelectableComponent);
    world.componentManager.registerComponent(FlagComponent);
    world.componentManager.registerComponent(WaterDropletComponent);
    world.componentManager.registerComponent(MockParameterPanelComponent);

    // Create and register plugins
    const flagPanelMock = { componentType: FlagComponent.type, registerControls: jest.fn() };
    const waterPanelMock = { componentType: WaterDropletComponent.type, registerControls: jest.fn() };
    flagPlugin = new FlagSimulationPlugin();
    waterPlugin = new WaterSimulationPlugin();
    // Mock getParameterPanels for plugins with shared mock instances
    flagPlugin.getParameterPanels = jest.fn().mockReturnValue([flagPanelMock]);
    waterPlugin.getParameterPanels = jest.fn().mockReturnValue([waterPanelMock]);
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
    studio.getActiveSimulationName.mockReturnValue("flag-simulation");

    // Mock the pluginManager.getPlugin method
    pluginManager.getPlugin.mockReturnValue(flagPlugin);

    // Activate the flag simulation plugin
    await pluginManager.activatePlugin("flag-simulation");

    // Get parameter panels from the active plugin
    const panels = (
      propertyInspectorSystem as any
    ).getParameterPanelsFromActivePlugin();

    // There should be at least one panel
    expect(panels.length).toBeGreaterThan(0);
    expect(panels[0].componentType).toBe(FlagComponent.type);
  });

  it("should get parameter panels from the water simulation plugin", async () => {
    // Mock the studio.getActiveSimulationName method
    studio.getActiveSimulationName.mockReturnValue("water-simulation");

    // Mock the pluginManager.getPlugin method
    pluginManager.getPlugin.mockReturnValue(waterPlugin);

    // Activate the water simulation plugin
    await pluginManager.activatePlugin("water-simulation");

    // Get parameter panels from the active plugin
    const panels = (
      propertyInspectorSystem as any
    ).getParameterPanelsFromActivePlugin();

    // There should be at least one panel
    expect(panels.length).toBeGreaterThan(0);
    expect(
      panels.some(
        (panel: ParameterPanelComponent) =>
          panel.componentType === WaterDropletComponent.type
      )
    ).toBe(true);
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
    studio.getActiveSimulationName.mockReturnValue("flag-simulation");
    pluginManager.getPlugin.mockReturnValue(flagPlugin);
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
    studio.getActiveSimulationName.mockReturnValue("water-simulation");
    pluginManager.getPlugin.mockReturnValue(waterPlugin);
    // Deselect the flag entity before activating the water simulation
    const flagSelectable = world.componentManager.getComponent(
      flagEntity,
      SelectableComponent.type
    ) as SelectableComponent | undefined;
    if (flagSelectable) {
      flagSelectable.isSelected = false;
    }
    await pluginManager.activatePlugin("water-simulation");

    // Select the water droplet entity
    const waterDropletSelectable = world.componentManager.getComponent(
      waterDropletEntity,
      SelectableComponent.type
    ) as SelectableComponent | undefined;
    if (waterDropletSelectable) {
      waterDropletSelectable.isSelected = true;
    }
    selectionSystem.setSelectedEntity(waterDropletEntity);
    // Ensure the selection system returns the correct entity
    selectionSystem.getSelectedEntity.mockReturnValue(waterDropletEntity);

    // Update the system for water simulation
    propertyInspectorSystem.update(world, 0);
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
    studio.getActiveSimulationName.mockReturnValue("flag-simulation");
    pluginManager.getPlugin.mockReturnValue(flagPlugin);
    await pluginManager.activatePlugin("flag-simulation");

    // Dispatch a simulation-play event
    const playEvent = new CustomEvent("simulation-play", {
      detail: { simulationName: "flag-simulation" }
    });
    window.dispatchEvent(playEvent);

    // Update the system
    propertyInspectorSystem.update(world, 0);

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
    studio.getActiveSimulationName.mockReturnValue("flag-simulation");
    pluginManager.getPlugin.mockReturnValue(flagPlugin);
    await pluginManager.activatePlugin("flag-simulation");

    // Dispatch a simulation-pause event
    const pauseEvent = new CustomEvent("simulation-pause", {
      detail: { simulationName: "flag-simulation" }
    });
    window.dispatchEvent(pauseEvent);

    // Update the system
    propertyInspectorSystem.update(world, 0);

    // The updateInspectorForEntity method should be called with the flag entity
    expect(updateInspectorSpy).toHaveBeenCalledWith(world, flagEntity);
  });
});
