import { VisibilityManager } from "../VisibilityManager";

describe("VisibilityManager Integration", () => {
  let visibilityManager: VisibilityManager;

  beforeEach(() => {
    // Set up DOM
    document.body.innerHTML = `
      <div id="left-panel" class="studio--left"></div>
      <div id="main-content" class="studio--main"></div>
    `;
    visibilityManager = new VisibilityManager();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("should initialize core UI properly", () => {
    visibilityManager.initializeCoreUI();

    const leftPanel = document.getElementById("left-panel");
    expect(leftPanel).toBeTruthy();
    expect(leftPanel?.style.display).toBe("block");
    expect(leftPanel?.style.visibility).toBe("visible");
    expect(leftPanel?.style.opacity).toBe("1");
  });

  it("should handle panel registration correctly", () => {
    const panel = document.createElement("div");
    const container = document.getElementById("left-panel")!;

    const success = visibilityManager.registerPanel("test", panel, container);
    expect(success).toBe(true);
    expect(container.contains(panel)).toBe(true);
    expect(visibilityManager.isPanelVisible("test")).toBe(true);
  });

  it("should manage visibility state centrally", () => {
    const panel1 = document.createElement("div");
    const panel2 = document.createElement("div");
    const container = document.getElementById("left-panel")!;

    visibilityManager.registerPanel("panel1", panel1, container);
    visibilityManager.registerPanel("panel2", panel2, container);

    // Test individual visibility
    visibilityManager.hidePanel("panel1");
    expect(visibilityManager.isPanelVisible("panel1")).toBe(false);
    expect(visibilityManager.isPanelVisible("panel2")).toBe(true);

    // Test show all
    visibilityManager.showAllPanels();
    expect(visibilityManager.isPanelVisible("panel1")).toBe(true);
    expect(visibilityManager.isPanelVisible("panel2")).toBe(true);

    // Test hide all
    visibilityManager.hideAllPanels();
    expect(visibilityManager.isPanelVisible("panel1")).toBe(false);
    expect(visibilityManager.isPanelVisible("panel2")).toBe(false);
  });

  it("should provide comprehensive state management", () => {
    const panel1 = document.createElement("div");
    const panel2 = document.createElement("div");
    const container = document.getElementById("left-panel")!;

    visibilityManager.registerPanel("panel1", panel1, container);
    visibilityManager.registerPanel("panel2", panel2, container);

    visibilityManager.hidePanel("panel1");

    const states = visibilityManager.getAllPanelStates();
    expect(states).toEqual({
      panel1: false,
      panel2: true
    });

    const panelIds = visibilityManager.getRegisteredPanelIds();
    expect(panelIds).toEqual(["panel1", "panel2"]);
  });

  it("should prevent visibility issues systematically", () => {
    const panel = document.createElement("div");
    const container = document.getElementById("left-panel")!;

    // Test duplicate registration protection
    visibilityManager.registerPanel("test", panel, container);
    const duplicateResult = visibilityManager.registerPanel("test", panel, container);
    expect(duplicateResult).toBe(false);

    // Test graceful handling of non-existent panels
    expect(() => {
      visibilityManager.hidePanel("nonexistent");
      visibilityManager.showPanel("nonexistent");
      visibilityManager.togglePanel("nonexistent");
    }).not.toThrow();

    expect(visibilityManager.isPanelVisible("nonexistent")).toBe(false);
  });
});
