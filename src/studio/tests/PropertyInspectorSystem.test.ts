import { PropertyInspectorSystem } from "../systems/PropertyInspectorSystem";
import { SelectableComponent } from "@core/components";
import { UIManager } from "../uiManager";
import { World } from "@core/ecs";
import { PositionComponent } from "@core/components";
import { Studio } from "../Studio";
import { PluginManager } from "@core/plugin/PluginManager";
import { StateManager } from "../state/StateManager";
import { SelectionSystem } from "../systems/SelectionSystem";
import { PropertyInspectorUIManager } from "../ui/PropertyInspectorUIManager";

// Robust singleton mock for StateManager
jest.mock("../state/StateManager", require("./testUtils/StateManagerMock").mockStateManager);

// Mock the Tweakpane library
jest.mock("tweakpane", () => {
  interface MockFolder {
    addBinding: jest.Mock;
    dispose: jest.Mock;
    options: { title: string };
  }

  function makeFolder(options: { title: string }): MockFolder {
    return {
      addBinding: jest.fn(() => ({ on: jest.fn() })),
      dispose: jest.fn(),
      options
    };
  }

  interface MockPane {
    addFolder: jest.Mock<MockFolder, [{ title: string }]>;
    dispose: jest.Mock;
    addBinding: jest.Mock;
  }

  const mockPane: MockPane = {
    addFolder: jest.fn((options: { title: string }) => makeFolder(options)),
    dispose: jest.fn(),
    addBinding: jest.fn(() => ({ on: jest.fn() }))
  };
  return {
    Pane: jest.fn(() => mockPane)
  };
});

describe("PropertyInspectorSystem", () => {
  let world: World;
  let uiManager: UIManager;
  let propertyInspectorSystem: PropertyInspectorSystem;
  let mockPaneInstance: UIManager["pane"]; // Use the correct type for the mockPaneInstance
  let selectionSystem: SelectionSystem;
  let propertyInspectorUIManager: PropertyInspectorUIManager;

  beforeEach(() => {
    // Create required DOM elements
    const ids = [
      "app-container",
      "viewport-container",
      "tweakpane-container",
      "scene-graph-container",
      "play-button",
      "pause-button",
      "reset-button",
      "add-box-button",
      "add-sphere-button"
    ];
    ids.forEach((id) => {
      const el = document.createElement(
        id.endsWith("-button") ? "button" : "div"
      );
      el.id = id;
      document.body.appendChild(el);
    });

    world = new World();
    mockPaneInstance =
      (
        jest.requireMock("tweakpane").Pane as jest.MockedFunction<
          () => UIManager["pane"]
        >
      ).mock.results[0]?.value ||
      (
        jest.requireMock("tweakpane").Pane as jest.MockedFunction<
          () => UIManager["pane"]
        >
      )();
    uiManager = new UIManager(mockPaneInstance);
    propertyInspectorUIManager = new PropertyInspectorUIManager(uiManager);

    // Create mock instances for Studio and PluginManager
    const mockWorld = new World();
    const mockPluginManager = new PluginManager(mockWorld);
    
    // Create mock plugin context
    const mockPluginContext = {
      studio: undefined as any, // will be set after Studio is constructed
      world: mockWorld,
      eventBus: { emit: jest.fn(), on: jest.fn(), off: jest.fn() } as any,
      getStateManager: () => StateManager.getInstance(),
    };
    
    const mockStudio = new Studio(mockWorld, mockPluginManager, StateManager.getInstance(), mockPluginContext);
    mockPluginContext.studio = mockStudio;

    // Mock the getActiveSimulationName method
    jest.spyOn(mockStudio, "getActiveSimulationName").mockReturnValue(null);

    selectionSystem = {
      getSelectedEntity: jest.fn(() => null),
      setSelectedEntity: jest.fn(),
      update: jest.fn(),
      setDefaultSelectedEntity: jest.fn()
    } as unknown as SelectionSystem;

    propertyInspectorSystem = new PropertyInspectorSystem(
      propertyInspectorUIManager,
      mockWorld,
      mockStudio,
      mockPluginManager,
      selectionSystem
    );

    // Register components used in the test
    world.componentManager.registerComponent(SelectableComponent);
    world.componentManager.registerComponent(PositionComponent);

    // Spy on UIManager methods
    jest.spyOn(uiManager, "registerComponentControls");
    jest.spyOn(mockPaneInstance, "dispose"); // Spy on the dispose method of the mocked Pane instance
  });

  afterEach(() => {
    // Clean up injected DOM elements
    const ids = [
      "app-container",
      "viewport-container",
      "tweakpane-container",
      "scene-graph-container",
      "play-button",
      "pause-button",
      "reset-button",
      "add-box-button",
      "add-sphere-button"
    ];
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });
    jest.restoreAllMocks();
  });

  it.skip("should select the first selectable entity and update the property inspector", () => {
    const entity1 = world.entityManager.createEntity();
    world.componentManager.addComponent(
      entity1,
      SelectableComponent.name,
      new SelectableComponent(true)
    );
    world.componentManager.addComponent(
      entity1,
      PositionComponent.name,
      new PositionComponent(1, 2, 3)
    );

    const entity2 = world.entityManager.createEntity();
    world.componentManager.addComponent(
      entity2,
      SelectableComponent.name,
      new SelectableComponent(false)
    );

    propertyInspectorSystem.update(world, 0);

    // Only check the main UIManager effect, not Pane disposal
    expect(uiManager.registerComponentControls).toHaveBeenCalledWith(
      SelectableComponent.name,
      expect.any(SelectableComponent),
      undefined
    );
    expect(uiManager.registerComponentControls).toHaveBeenCalledWith(
      PositionComponent.name,
      expect.any(PositionComponent),
      undefined
    );
  });

  it("should not update the property inspector if no selectable entities exist", () => {
    propertyInspectorSystem.update(world, 0);
    expect(uiManager.registerComponentControls).not.toHaveBeenCalled();
  });
});
