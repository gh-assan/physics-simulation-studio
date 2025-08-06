import { VisibilityManager } from "../VisibilityManager";

describe("VisibilityManager", () => {
  let visibilityManager: VisibilityManager;
  let mockContainer: HTMLElement;
  let mockPanel: HTMLElement;

  beforeEach(() => {
    // Create mock DOM elements
    mockContainer = document.createElement("div");
    mockContainer.id = "left-panel";
    mockPanel = document.createElement("div");
    mockPanel.className = "tp-dfwv";

    document.body.appendChild(mockContainer);

    visibilityManager = new VisibilityManager();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  describe("Panel Management", () => {
    it("should register a panel with container", () => {
      const success = visibilityManager.registerPanel("main", mockPanel, mockContainer);
      expect(success).toBe(true);
      expect(mockContainer.contains(mockPanel)).toBe(true);
    });

    it("should show and hide panels", () => {
      visibilityManager.registerPanel("main", mockPanel, mockContainer);

      visibilityManager.hidePanel("main");
      expect(mockPanel.style.display).toBe("none");

      visibilityManager.showPanel("main");
      expect(mockPanel.style.display).toBe("");
    });

    it("should get panel visibility state", () => {
      visibilityManager.registerPanel("main", mockPanel, mockContainer);

      expect(visibilityManager.isPanelVisible("main")).toBe(true);

      visibilityManager.hidePanel("main");
      expect(visibilityManager.isPanelVisible("main")).toBe(false);
    });

    it("should toggle panel visibility", () => {
      visibilityManager.registerPanel("main", mockPanel, mockContainer);

      const initialState = visibilityManager.isPanelVisible("main");
      visibilityManager.togglePanel("main");
      expect(visibilityManager.isPanelVisible("main")).toBe(!initialState);
    });
  });

  describe("Centralized State Management", () => {
    it("should maintain visibility state across operations", () => {
      visibilityManager.registerPanel("panel1", mockPanel, mockContainer);
      const panel2 = document.createElement("div");
      visibilityManager.registerPanel("panel2", panel2, mockContainer);

      visibilityManager.hidePanel("panel1");
      visibilityManager.hidePanel("panel2");

      expect(visibilityManager.isPanelVisible("panel1")).toBe(false);
      expect(visibilityManager.isPanelVisible("panel2")).toBe(false);

      visibilityManager.showAllPanels();

      expect(visibilityManager.isPanelVisible("panel1")).toBe(true);
      expect(visibilityManager.isPanelVisible("panel2")).toBe(true);
    });

    it("should get all panel states", () => {
      visibilityManager.registerPanel("panel1", mockPanel, mockContainer);
      const panel2 = document.createElement("div");
      visibilityManager.registerPanel("panel2", panel2, mockContainer);

      visibilityManager.hidePanel("panel1");

      const states = visibilityManager.getAllPanelStates();
      expect(states).toEqual({
        panel1: false,
        panel2: true
      });
    });
  });

  describe("Event System", () => {
    it("should emit events when panel visibility changes", () => {
      const onVisibilityChange = jest.fn();
      visibilityManager.on("visibilityChanged", onVisibilityChange);

      visibilityManager.registerPanel("main", mockPanel, mockContainer);
      visibilityManager.hidePanel("main");

      expect(onVisibilityChange).toHaveBeenCalledWith({
        panelId: "main",
        visible: false,
        element: mockPanel
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle operations on non-existent panels gracefully", () => {
      expect(() => visibilityManager.hidePanel("nonexistent")).not.toThrow();
      expect(() => visibilityManager.showPanel("nonexistent")).not.toThrow();
      expect(visibilityManager.isPanelVisible("nonexistent")).toBe(false);
    });

    it("should reject duplicate panel registration", () => {
      visibilityManager.registerPanel("main", mockPanel, mockContainer);
      const success = visibilityManager.registerPanel("main", mockPanel, mockContainer);
      expect(success).toBe(false);
    });
  });

  describe("Responsive Layout", () => {
    it("should handle responsive layout changes", () => {
      visibilityManager.registerPanel("main", mockPanel, mockContainer);

      // Simulate mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      });

      visibilityManager.updateLayout();

      // Should adapt panel for mobile
      expect(mockPanel.style.width).toBe("100%");
    });
  });
});
