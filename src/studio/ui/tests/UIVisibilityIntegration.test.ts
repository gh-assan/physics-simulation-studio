import { UIVisibilityIntegration } from "../UIVisibilityIntegration";
import { VisibilityManager } from "../VisibilityManager";
import { UIManager } from "../../uiManager";
import { Pane } from "tweakpane";

// Mock Tweakpane
jest.mock("tweakpane");

describe("UIVisibilityIntegration", () => {
  let integration: UIVisibilityIntegration;
  let visibilityManager: VisibilityManager;
  let uiManager: UIManager;
  let mockPane: any;

  beforeEach(() => {
    // Create DOM structure
    const leftPanel = document.createElement("div");
    leftPanel.id = "left-panel";
    document.body.appendChild(leftPanel);

    // Create mock Tweakpane element
    const paneElement = document.createElement("div");
    paneElement.className = "tp-dfwv";
    document.body.appendChild(paneElement);

    // Create mocks
    mockPane = {
      addFolder: jest.fn(),
      refresh: jest.fn(),
      element: paneElement
    };
    (Pane as jest.Mock).mockReturnValue(mockPane);

    // Create instances
    visibilityManager = new VisibilityManager();
    uiManager = new UIManager(mockPane);
    integration = new UIVisibilityIntegration(visibilityManager, uiManager);
  });

  afterEach(() => {
    document.body.innerHTML = "";
    jest.clearAllMocks();
  });

  describe("Initialization", () => {
    it("should initialize properly", () => {
      expect(() => integration.initialize()).not.toThrow();
    });

    it("should mount Tweakpane to left panel", () => {
      integration.initialize();

      const leftPanel = document.getElementById("left-panel");
      const paneElement = document.querySelector(".tp-dfwv");

      expect(leftPanel).toBeTruthy();
      expect(paneElement).toBeTruthy();
      expect(leftPanel?.contains(paneElement as Node)).toBe(true);
    });

    it("should register main UI panel with visibility manager", () => {
      const registerSpy = jest.spyOn(visibilityManager, "registerPanel");

      integration.initialize();

      expect(registerSpy).toHaveBeenCalledWith(
        "main-ui",
        expect.any(HTMLElement),
        expect.any(HTMLElement)
      );
    });
  });

  describe("Panel Management", () => {
    beforeEach(() => {
      integration.initialize();
    });

    it("should show all panels", () => {
      const showAllSpy = jest.spyOn(visibilityManager, "showAllPanels");

      integration.showAllPanels();

      expect(showAllSpy).toHaveBeenCalled();
    });

    it("should hide all panels", () => {
      const hideAllSpy = jest.spyOn(visibilityManager, "hideAllPanels");

      integration.hideAllPanels();

      expect(hideAllSpy).toHaveBeenCalled();
    });

    it("should toggle main panel", () => {
      const toggleSpy = jest.spyOn(visibilityManager, "togglePanel");

      integration.toggleMainPanel();

      expect(toggleSpy).toHaveBeenCalledWith("main-ui");
    });

    it("should get panel states", () => {
      const getStatesSpy = jest.spyOn(visibilityManager, "getAllPanelStates");

      integration.getPanelStates();

      expect(getStatesSpy).toHaveBeenCalled();
    });
  });

  describe("Layout Management", () => {
    beforeEach(() => {
      integration.initialize();
    });

    it("should refresh layout", () => {
      const updateLayoutSpy = jest.spyOn(visibilityManager, "updateLayout");
      const refreshSpy = jest.spyOn(uiManager, "refresh");

      integration.refreshLayout();

      expect(updateLayoutSpy).toHaveBeenCalled();
      expect(refreshSpy).toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should handle missing left panel gracefully", () => {
      // Remove left panel
      const leftPanel = document.getElementById("left-panel");
      if (leftPanel) {
        leftPanel.remove();
      }

      expect(() => integration.initialize()).not.toThrow();
    });

    it("should handle missing Tweakpane element gracefully", () => {
      // Remove Tweakpane element
      const paneElement = document.querySelector(".tp-dfwv");
      if (paneElement) {
        paneElement.remove();
      }

      expect(() => integration.initialize()).not.toThrow();
    });
  });

  describe("Cleanup", () => {
    it("should destroy properly", () => {
      integration.initialize();
      const destroySpy = jest.spyOn(visibilityManager, "destroy");

      integration.destroy();

      expect(destroySpy).toHaveBeenCalled();
    });
  });
});
