import { FlagParameterPanel } from "../FlagParameterPanel";
import { FlagComponent } from "../FlagComponent";
import { UIManager } from "../../../studio/uiManager";
import { World } from "../../../core/ecs/World"; // Import World

// Mock UIManager
jest.mock("../../../studio/uiManager", () => {
  return {
    UIManager: jest.fn().mockImplementation(() => {
      return {
        registerComponentControls: jest.fn(),
        addFolder: jest.fn(), // Mock addFolder
        refresh: jest.fn() // Mock refresh
      };
    })
  };
});

describe("FlagParameterPanel", () => {
  let flagParameterPanel: FlagParameterPanel;
  let uiManager: UIManager;
  let flagComponent: FlagComponent;
  let world: World; // Declare world

  beforeEach(() => {
    world = { // Mock World
      componentManager: {
        getEntitiesWithComponents: jest.fn().mockReturnValue([]),
        getComponent: jest.fn(),
        addComponent: jest.fn()
      },
      entityManager: {
        createEntity: jest.fn().mockReturnValue('test-entity-id'),
        getEntityById: jest.fn()
      }
    } as any; // Cast to any to satisfy type checking for partial mock
    flagParameterPanel = new FlagParameterPanel(world);
    uiManager = new UIManager(null as any);
    flagComponent = new FlagComponent();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should have the correct component type", () => {
    expect(flagParameterPanel.componentType).toBe(FlagComponent.type);
  });

  it("should register UI controls for a FlagComponent", () => {
    // Call the registerControls method
    flagParameterPanel.registerControls(uiManager, flagComponent);

    // The registerComponentControls method of the UIManager should be called
    expect(uiManager.registerComponentControls).toHaveBeenCalledWith(
      FlagComponent.type,
      flagComponent,
      expect.any(Array)
    );
  });

  it("should not register UI controls for a non-FlagComponent", () => {
    // Create a mock console.error to suppress the error message
    const originalConsoleError = console.error;
    console.error = jest.fn();

    // Call the registerControls method with a non-FlagComponent
    flagParameterPanel.registerControls(uiManager, {} as any);

    // The registerComponentControls method of the UIManager should not be called
    expect(uiManager.registerComponentControls).not.toHaveBeenCalled();

    // Restore the original console.error
    console.error = originalConsoleError;
  });

  it("should be cloneable", () => {
    // Clone the parameter panel
    const clone = flagParameterPanel.clone();

    // The clone should be a FlagParameterPanel
    expect(clone).toBeInstanceOf(FlagParameterPanel);
    expect(clone.componentType).toBe(FlagComponent.type);
  });
});
