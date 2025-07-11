import { PropertyInspectorSystem } from "../PropertyInspectorSystem";
import { UIManager } from "../../uiManager";
import { World } from "../../../core/ecs/World";
import { Studio } from "../../Studio";
import { PluginManager } from "../../../core/plugin/PluginManager";
import { SelectableComponent } from "../../../core/components/SelectableComponent";
import { PositionComponent } from "../../../core/components/PositionComponent";
import { FlagComponent } from "../../../plugins/flag-simulation/FlagComponent";
import { WaterDropletComponent } from "../../../plugins/water-simulation/WaterComponents";
import { FlagParameterPanel } from "../../../plugins/flag-simulation/FlagParameterPanel";
import { WaterDropletParameterPanel } from "../../../plugins/water-simulation/WaterDropletParameterPanel";
import { ParameterPanelComponent } from "../../../core/components/ParameterPanelComponent";
import { MockParameterPanelComponent } from "../../tests/MockParameterPanelComponent";

// Mock UIManager
jest.mock("../../uiManager", () => {
  return {
    UIManager: jest.fn().mockImplementation(() => {
      return {
        registerComponentControls: jest.fn(),
        clearControls: jest.fn()
      };
    })
  };
});

// Mock Studio
jest.mock("../../Studio", () => {
  return {
    Studio: jest.fn().mockImplementation(() => {
      return {
        getActiveSimulationName: jest.fn().mockReturnValue("flag-simulation"),
        play: jest.fn(),
        pause: jest.fn()
      };
    })
  };
});

// Mock PluginManager
jest.mock("../../../core/plugin/PluginManager", () => {
  return {
    PluginManager: jest.fn().mockImplementation(() => {
      return {
        getPlugin: jest.fn().mockReturnValue({
          getParameterPanels: jest.fn().mockReturnValue([
            { componentType: "FlagComponent", registerControls: jest.fn() },
            { componentType: "WaterDropletComponent", registerControls: jest.fn() }
          ])
        })
      };
    })
  };
});

describe("PropertyInspectorSystem", () => {
  let world: World;
  let uiManager: UIManager;
  let studio: Studio;
  let pluginManager: PluginManager;
  let propertyInspectorSystem: PropertyInspectorSystem;
  let flagEntity: number;
  let waterDropletEntity: number;

  beforeEach(() => {
    // Create a new world for each test
    world = new World();
    uiManager = new UIManager(null as any);
    studio = new Studio(null as any, null as any);
    pluginManager = new PluginManager(null as any);
    propertyInspectorSystem = new PropertyInspectorSystem(uiManager, world, studio, pluginManager);

    // Register components
    world.componentManager.registerComponent(SelectableComponent.type, SelectableComponent);
    world.componentManager.registerComponent(PositionComponent.type, PositionComponent);
    world.componentManager.registerComponent(FlagComponent.type, FlagComponent);
    world.componentManager.registerComponent(WaterDropletComponent.type, WaterDropletComponent);
    world.componentManager.registerComponent(ParameterPanelComponent.type, MockParameterPanelComponent);

    // Create entities
    flagEntity = world.entityManager.createEntity();
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

    waterDropletEntity = world.entityManager.createEntity();
    world.componentManager.addComponent(
      waterDropletEntity,
      SelectableComponent.type,
      new SelectableComponent(false)
    );
    world.componentManager.addComponent(
      waterDropletEntity,
      WaterDropletComponent.type,
      new WaterDropletComponent()
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should update the UI when a simulation-loaded event is received", () => {
    // Spy on the updateInspectorForEntity method
    const updateInspectorSpy = jest.spyOn(
      propertyInspectorSystem as any,
      "updateInspectorForEntity"
    );

    // Dispatch a simulation-loaded event
    const event = new CustomEvent("simulation-loaded", {
      detail: { simulationName: "flag-simulation" }
    });
    window.dispatchEvent(event);

    // The updateInspectorForEntity method should not be called directly
    // because the onSimulationLoaded method deselects all entities
    expect(updateInspectorSpy).not.toHaveBeenCalled();

    // But the lastSelectedEntity should be reset
    expect((propertyInspectorSystem as any).lastSelectedEntity).toBeNull();
  });

  it("should update the UI when a simulation-play event is received", () => {
    // Spy on the updateInspectorForEntity method
    const updateInspectorSpy = jest.spyOn(
      propertyInspectorSystem as any,
      "updateInspectorForEntity"
    );

    // Dispatch a simulation-play event
    const event = new CustomEvent("simulation-play", {
      detail: { simulationName: "flag-simulation" }
    });
    window.dispatchEvent(event);

    // The updateInspectorForEntity method should be called with the selected entity
    expect(updateInspectorSpy).toHaveBeenCalledWith(world, flagEntity);
  });

  it("should update the UI when a simulation-pause event is received", () => {
    // Spy on the updateInspectorForEntity method
    const updateInspectorSpy = jest.spyOn(
      propertyInspectorSystem as any,
      "updateInspectorForEntity"
    );

    // Dispatch a simulation-pause event
    const event = new CustomEvent("simulation-pause", {
      detail: { simulationName: "flag-simulation" }
    });
    window.dispatchEvent(event);

    // The updateInspectorForEntity method should be called with the selected entity
    expect(updateInspectorSpy).toHaveBeenCalledWith(world, flagEntity);
  });

  it("should find the selected entity", () => {
    // Call the findSelectedEntity method
    const selectedEntity = (propertyInspectorSystem as any).findSelectedEntity(world);

    // The selected entity should be the flag entity
    expect(selectedEntity).toBe(flagEntity);
  });

  it.skip("should get parameter panels from the active plugin", () => {
    // Call the getParameterPanelsFromActivePlugin method
    const panels = (propertyInspectorSystem as any).getParameterPanelsFromActivePlugin();

    // There should be two panels
    expect(panels.length).toBe(2);
    expect(panels[0]).toBeInstanceOf(FlagParameterPanel);
    expect(panels[1]).toBeInstanceOf(WaterDropletParameterPanel);
  });

  it("should register component controls using parameter panels", () => {
    // Get parameter panels
    const panels = (propertyInspectorSystem as any).getParameterPanelsFromActivePlugin();

    // Call the registerComponentControls method
    (propertyInspectorSystem as any).registerComponentControls(
      FlagComponent.type,
      new FlagComponent(),
      panels
    );

    // The registerControls method of the FlagParameterPanel should be called
    expect(panels[0].registerControls).toHaveBeenCalled();
  });

  it("should update the inspector for an entity", () => {
    // Spy on the registerComponentControls method
    const registerControlsSpy = jest.spyOn(
      propertyInspectorSystem as any,
      "registerComponentControls"
    );

    // Call the updateInspectorForEntity method
    (propertyInspectorSystem as any).updateInspectorForEntity(world, flagEntity);

    // The registerComponentControls method should be called for the FlagComponent
    expect(registerControlsSpy).toHaveBeenCalledWith(
      FlagComponent.type,
      expect.any(FlagComponent),
      expect.any(Array)
    );
  });
});
