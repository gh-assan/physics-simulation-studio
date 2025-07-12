import { PropertyInspectorSystem } from "../PropertyInspectorSystem";
import { UIManager } from "../../uiManager";
import { World } from "../../../core/ecs/World";
import { Studio } from "../../Studio";
import { PluginManager } from "../../../core/plugin/PluginManager";
import { StateManager } from "../../state/StateManager";
import { SelectableComponent } from "../../../core/components/SelectableComponent";
import { PositionComponent } from "../../../core/components/PositionComponent";
import { FlagComponent } from "../../../plugins/flag-simulation/FlagComponent";
import { WaterDropletComponent } from "../../../plugins/water-simulation/WaterComponents";
import { ParameterPanelComponent } from "../../../core/components/ParameterPanelComponent";
import { MockParameterPanelComponent } from "../../tests/MockParameterPanelComponent";
import { Vector3 } from "../../../plugins/water-simulation/utils/Vector3";
import { SelectionSystem } from "../SelectionSystem";

// Mock dependencies
jest.mock("../../uiManager");
jest.mock("../../Studio");
jest.mock("../../../core/plugin/PluginManager");
jest.mock("../../state/StateManager");
jest.mock("../SelectionSystem");

describe("PropertyInspectorSystem", () => {
  let world: World;
  let uiManager: jest.Mocked<UIManager>;
  let studio: jest.Mocked<Studio>;
  let pluginManager: jest.Mocked<PluginManager>;
  let selectionSystem: jest.Mocked<SelectionSystem>;
  let propertyInspectorSystem: PropertyInspectorSystem;
  let flagEntity: number;
  let waterDropletEntity: number;
  let mockFlagParameterPanel: any;
  let mockWaterParameterPanel: any;

  beforeEach(() => {
    // Create a new world for each test
    world = new World();

    // Explicitly mock dependencies
    uiManager = {
      registerComponentControls: jest.fn(),
      clearControls: jest.fn(),
      addFolder: jest.fn(() => ({ addBlade: jest.fn() })),
      refresh: jest.fn(),
    } as any;

    pluginManager = {
      getPlugin: jest.fn().mockImplementation((pluginName: string) => {
        return {
          getParameterPanels: jest.fn().mockReturnValue([
            { componentType: "FlagComponent", registerControls: jest.fn() },
            { componentType: "WaterDropletComponent", registerControls: jest.fn() }
          ]),
          getName: jest.fn(() => pluginName),
          initializeEntities: jest.fn(),
          register: jest.fn(),
          unregister: jest.fn(),
          getDependencies: jest.fn().mockReturnValue([]),
          getRenderer: jest.fn(),
        };
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

    let selectedEntityId: number | null = null;
    selectionSystem = {
      currentSelectedEntity: null,
      onSimulationLoaded: jest.fn(),
      getSelectedEntity: jest.fn(() => selectedEntityId),
      setSelectedEntity: jest.fn((id: number | null) => { selectedEntityId = id; }),
      update: jest.fn(),
      setDefaultSelectedEntity: jest.fn(),
      world: world,
      onRegister: jest.fn(),
      onRemove: jest.fn(),
    } as any;

    // Reset mocks before each test
    uiManager.clearControls.mockClear();
    uiManager.registerComponentControls.mockClear();
    uiManager.addFolder.mockClear();
    uiManager.refresh.mockClear();

    studio.getActiveSimulationName.mockClear();
    studio.play.mockClear();
    studio.pause.mockClear();
    studio.loadSimulation.mockClear();
    studio.getAvailableSimulationNames.mockClear();
    studio.setRenderSystem.mockClear();
    studio.reset.mockClear();
    studio.update.mockClear();
    studio.getIsPlaying.mockClear();
    studio.getRenderer.mockClear();

    pluginManager.getPlugin.mockClear();
    pluginManager.deactivatePlugin.mockClear();
    pluginManager.activatePlugin.mockClear();
    pluginManager.getAvailablePluginNames.mockClear();
    pluginManager.registerPlugin.mockClear();
    pluginManager.onPluginsChanged.mockClear();
    pluginManager.on.mockClear();

    selectionSystem.getSelectedEntity.mockClear();
    selectionSystem.setSelectedEntity.mockClear();
    selectionSystem.update.mockClear();
    selectionSystem.onRegister.mockClear();
    selectionSystem.onRemove.mockClear();
    // Explicitly mock setDefaultSelectedEntity as it's private
    (selectionSystem as any).setDefaultSelectedEntity = jest.fn();
    // Explicitly mock setDefaultSelectedEntity as it's private
    (selectionSystem as any).setDefaultSelectedEntity = jest.fn();
    // Explicitly mock setDefaultSelectedEntity as it's private
    (selectionSystem as any).setDefaultSelectedEntity = jest.fn();
    // Explicitly mock setDefaultSelectedEntity as it's private
    (selectionSystem as any).setDefaultSelectedEntity = jest.fn();

    mockFlagParameterPanel = { componentType: "FlagComponent", registerControls: jest.fn() };
    mockWaterParameterPanel = { componentType: "WaterDropletComponent", registerControls: jest.fn() };

    // Set up mock return values
    studio.getActiveSimulationName.mockReturnValue("flag-simulation");
    pluginManager.getPlugin.mockImplementation((pluginName: string) => {
      return {
        getParameterPanels: jest.fn().mockReturnValue([
          mockFlagParameterPanel,
          mockWaterParameterPanel
        ]),
        getName: jest.fn(() => pluginName),
        initializeEntities: jest.fn(),
        register: jest.fn(),
        unregister: jest.fn(),
        getDependencies: jest.fn().mockReturnValue([]),
      };
    });

    // Instantiate the system under test
    propertyInspectorSystem = new PropertyInspectorSystem(
      uiManager,
      world,
      studio,
      pluginManager,
      selectionSystem
    );

    // Register components
    world.componentManager.registerComponent(
      SelectableComponent.type,
      SelectableComponent
    );
    world.componentManager.registerComponent(
      PositionComponent.type,
      PositionComponent
    );
    world.componentManager.registerComponent(FlagComponent.type, FlagComponent);
    world.componentManager.registerComponent(
      WaterDropletComponent.type,
      WaterDropletComponent
    );
    world.componentManager.registerComponent(
      ParameterPanelComponent.type,
      MockParameterPanelComponent
    );

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
      new WaterDropletComponent(new Vector3(0, 0, 0))
    );

    // Ensure the SelectionSystem's world is set for its internal methods
    // This is needed because the mock is created before the actual world is fully set up in the test
    (selectionSystem as any).world = world;
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Reset pluginManager.getPlugin to ensure fresh parameter panels for each test
    pluginManager.getPlugin.mockClear();
  });

  it("should update the UI when the selected entity changes", () => {
    // Trigger initial update
    propertyInspectorSystem.update(world, 0);
    uiManager.clearControls.mockClear(); // Clear initial call

    // Simulate selecting the flag entity
    selectionSystem.setSelectedEntity(flagEntity);
    propertyInspectorSystem.update(world, 0);

    expect(uiManager.clearControls).toHaveBeenCalledTimes(1); // Only one call after selection
    // Check that the parameter panel's registerControls is called
    const mockFlagParameterPanel = ((pluginManager.getPlugin("flag-simulation") as any).getParameterPanels() || []).find(
      (panel: any) => panel.componentType === "FlagComponent"
    );
    expect(mockFlagParameterPanel.registerControls).toHaveBeenCalledWith(
      uiManager,
      expect.any(FlagComponent)
    );
  });

  it("should update the UI when the active simulation changes", () => {
    // Simulate initial state
    studio.getActiveSimulationName.mockReturnValue("flag-simulation");
    propertyInspectorSystem.update(world, 0);
    uiManager.clearControls.mockClear(); // Clear initial call

    // Deselect entity to avoid double clearControls
    selectionSystem.setSelectedEntity(null);

    // Simulate changing active simulation
    studio.getActiveSimulationName.mockReturnValue("water-simulation");
    propertyInspectorSystem.update(world, 0);

    expect(uiManager.clearControls).toHaveBeenCalledTimes(2); // Called for selection and simulation change
    // Expect parameter panels for water simulation to be registered
    expect(pluginManager.getPlugin).toHaveBeenCalledWith("water-simulation");
  });

  it("should register component controls using parameter panels", () => {
    // Ensure flag entity is selected for this test
    selectionSystem.setSelectedEntity(flagEntity);
    propertyInspectorSystem.update(world, 0);

    // Get the mock parameter panel for FlagComponent
    const mockFlagParameterPanel = ((pluginManager.getPlugin("flag-simulation") as any).getParameterPanels() || []).find(
      (panel: any) => panel.componentType === "FlagComponent"
    );

    if (mockFlagParameterPanel) {
      expect(mockFlagParameterPanel.registerControls).toHaveBeenCalledWith(
        uiManager,
        expect.any(FlagComponent)
      );
    } else {
      fail("mockFlagParameterPanel should not be undefined");
    }
  });

  it("should display general simulation settings when no entity is selected", () => {
    // Ensure no entity is selected
    selectionSystem.setSelectedEntity(null);
    propertyInspectorSystem.update(world, 0);

    expect(uiManager.clearControls).toHaveBeenCalled();
    // Expect the general parameter panels from the active plugin to be registered
    expect(pluginManager.getPlugin).toHaveBeenCalledWith("flag-simulation");
    const mockParameterPanels = (pluginManager.getPlugin("flag-simulation") as any).getParameterPanels() || [];
    expect(mockParameterPanels[0].registerControls).toHaveBeenCalledWith(uiManager);
  });
});
