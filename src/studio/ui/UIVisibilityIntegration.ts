import { VisibilityManager } from "./VisibilityManager";
import { UIManager } from "../uiManager";
import { Pane } from "tweakpane";
import { Logger } from "../../core/utils/Logger";

/**
 * Manages the integration between the UI system and visibility management
 * This class ensures proper mounting and visibility of all UI panels
 */
export class UIVisibilityIntegration {
  private visibilityManager: VisibilityManager;
  private uiManager: UIManager;
  private initialized = false;

  constructor(visibilityManager: VisibilityManager, uiManager: UIManager) {
    this.visibilityManager = visibilityManager;
    this.uiManager = uiManager;
  }

  /**
   * Initializes the UI visibility integration
   * This ensures proper mounting of all UI elements
   */
  public initialize(): void {
    if (this.initialized) return;

    try {
      // Initialize core UI structure
      this.visibilityManager.initializeCoreUI();

      // Mount the main Tweakpane to the left panel
      this.mountTweakpane();

      // Set up event listeners for UI state changes
      this.setupEventListeners();

      this.initialized = true;
      Logger.getInstance().log("[UIVisibilityIntegration] Initialized successfully");
    } catch (error) {
      Logger.getInstance().error("[UIVisibilityIntegration] Failed to initialize:", error);
    }
  }

  /**
   * Mounts the Tweakpane to the left panel container
   */
  private mountTweakpane(): void {
    const leftPanel = document.getElementById("left-panel");
    if (!leftPanel) {
      Logger.getInstance().error("[UIVisibilityIntegration] Left panel container not found");
      return;
    }

    // Get the Tweakpane element from the UIManager
    const paneElement = this.getPaneElement();
    if (!paneElement) {
      Logger.getInstance().error("[UIVisibilityIntegration] Tweakpane element not found");
      return;
    }

    // Register the main UI panel with the visibility manager
    const success = this.visibilityManager.registerPanel("main-ui", paneElement, leftPanel);
    if (success) {
      Logger.getInstance().log("[UIVisibilityIntegration] Main UI panel mounted successfully");
    } else {
      Logger.getInstance().warn("[UIVisibilityIntegration] Main UI panel already registered");
    }
  }

  /**
   * Gets the Tweakpane DOM element
   */
  private getPaneElement(): HTMLElement | null {
    // The Tweakpane should have been created with a specific class
    return document.querySelector(".tp-dfwv") as HTMLElement;
  }

  /**
   * Sets up event listeners for UI state management
   */
  private setupEventListeners(): void {
    // Listen for visibility changes
    this.visibilityManager.on("visibilityChanged", (data) => {
      Logger.getInstance().log(`[UIVisibilityIntegration] Panel '${data.panelId}' visibility changed to: ${data.visible}`);
    });

    // Listen for window focus to ensure panels remain visible
    window.addEventListener("focus", () => {
      this.ensurePanelsVisible();
    });

    // Listen for DOM changes that might affect panel mounting
    const observer = new MutationObserver(() => {
      this.ensurePanelsVisible();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Ensures that all registered panels are properly visible
   */
  private ensurePanelsVisible(): void {
    const states = this.visibilityManager.getAllPanelStates();
    let hasIssues = false;

    for (const [panelId, isVisible] of Object.entries(states)) {
      const element = this.visibilityManager.getPanelElement(panelId);
      if (element && isVisible) {
        // Check if element is actually visible in the DOM
        const computedStyle = window.getComputedStyle(element);
        if (computedStyle.display === "none" || computedStyle.visibility === "hidden") {
          Logger.getInstance().warn(`[UIVisibilityIntegration] Panel '${panelId}' should be visible but is hidden`);
          this.visibilityManager.showPanel(panelId);
          hasIssues = true;
        }
      }
    }

    if (hasIssues) {
      Logger.getInstance().log("[UIVisibilityIntegration] Fixed visibility issues");
    }
  }

  /**
   * Shows all UI panels
   */
  public showAllPanels(): void {
    this.visibilityManager.showAllPanels();
  }

  /**
   * Hides all UI panels
   */
  public hideAllPanels(): void {
    this.visibilityManager.hideAllPanels();
  }

  /**
   * Toggles the main UI panel visibility
   */
  public toggleMainPanel(): void {
    this.visibilityManager.togglePanel("main-ui");
  }

  /**
   * Gets the current visibility state of all panels
   */
  public getPanelStates(): Record<string, boolean> {
    return this.visibilityManager.getAllPanelStates();
  }

  /**
   * Refreshes the UI layout
   */
  public refreshLayout(): void {
    this.visibilityManager.updateLayout();
    this.uiManager.refresh();
  }

  /**
   * Destroys the integration and cleans up resources
   */
  public destroy(): void {
    this.visibilityManager.destroy();
    this.initialized = false;
  }
}
