import { WaterDropletParameterPanel } from "../WaterDropletParameterPanel";
import { WaterDropletComponent } from "../WaterComponents";
import { UIManager } from "../../../studio/uiManager";

// Mock UIManager
jest.mock("../../../studio/uiManager", () => {
  return {
    UIManager: jest.fn().mockImplementation(() => {
      return {
        registerComponentControls: jest.fn()
      };
    })
  };
});

describe("WaterDropletParameterPanel", () => {
  let waterDropletParameterPanel: WaterDropletParameterPanel;
  let uiManager: UIManager;
  let waterDropletComponent: WaterDropletComponent;

  beforeEach(() => {
    waterDropletParameterPanel = new WaterDropletParameterPanel();
    uiManager = new UIManager(null as any);
    waterDropletComponent = new WaterDropletComponent();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should have the correct component type", () => {
    expect(waterDropletParameterPanel.componentType).toBe(WaterDropletComponent.type);
  });

  it("should register UI controls for a WaterDropletComponent", () => {
    // Call the registerControls method
    waterDropletParameterPanel.registerControls(uiManager, waterDropletComponent);

    // The registerComponentControls method of the UIManager should be called
    expect(uiManager.registerComponentControls).toHaveBeenCalledWith(
      WaterDropletComponent.type,
      waterDropletComponent,
      expect.any(Array)
    );
  });

  it("should not register UI controls for a non-WaterDropletComponent", () => {
    // Create a mock console.error to suppress the error message
    const originalConsoleError = console.error;
    console.error = jest.fn();

    // Call the registerControls method with a non-WaterDropletComponent
    waterDropletParameterPanel.registerControls(uiManager, {} as any);

    // The registerComponentControls method of the UIManager should not be called
    expect(uiManager.registerComponentControls).not.toHaveBeenCalled();

    // Restore the original console.error
    console.error = originalConsoleError;
  });

  it("should be cloneable", () => {
    // Clone the parameter panel
    const clone = waterDropletParameterPanel.clone();

    // The clone should be a WaterDropletParameterPanel
    expect(clone).toBeInstanceOf(WaterDropletParameterPanel);
    expect(clone.componentType).toBe(WaterDropletComponent.type);
  });
});
