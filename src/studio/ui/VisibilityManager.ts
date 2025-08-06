export interface VisibilityState {
  panelId: string;
  visible: boolean;
  element: HTMLElement;
}

export interface PanelRegistration {
  element: HTMLElement;
  container: HTMLElement;
  visible: boolean;
}

export type VisibilityEventType = "visibilityChanged" | "panelRegistered" | "panelUnregistered";

export interface VisibilityEventData {
  panelId: string;
  visible: boolean;
  element: HTMLElement;
}

/**
 * Centralized Visibility Manager for UI panels and components
 * Provides a unified API for managing panel visibility, mounting, and responsive layout
 */
export class VisibilityManager {
  private panels = new Map<string, PanelRegistration>();
  private eventListeners = new Map<VisibilityEventType, Array<(data: VisibilityEventData) => void>>();
  private initialized = false;

  constructor() {
    this.setupResizeListener();
  }

  /**
   * Registers a panel with the visibility manager
   * @param panelId Unique identifier for the panel
   * @param element The panel element
   * @param container The container to mount the panel in
   * @returns true if registration successful, false if panel already exists
   */
  public registerPanel(panelId: string, element: HTMLElement, container: HTMLElement): boolean {
    if (this.panels.has(panelId)) {
      console.warn(`Panel with ID '${panelId}' is already registered`);
      return false;
    }

    // Mount the element to the container if not already mounted
    if (!container.contains(element)) {
      container.appendChild(element);
    }

    // Register the panel
    this.panels.set(panelId, {
      element,
      container,
      visible: true // Default to visible
    });

    // Apply initial responsive layout
    this.applyResponsiveLayout(element);

    // Emit registration event
    this.emit("panelRegistered", {
      panelId,
      visible: true,
      element
    });

    return true;
  }

  /**
   * Unregisters a panel from the visibility manager
   * @param panelId The panel ID to unregister
   */
  public unregisterPanel(panelId: string): void {
    const panel = this.panels.get(panelId);
    if (!panel) return;

    // Remove from DOM if still mounted
    if (panel.container.contains(panel.element)) {
      panel.container.removeChild(panel.element);
    }

    // Emit unregistration event
    this.emit("panelUnregistered", {
      panelId,
      visible: false,
      element: panel.element
    });

    this.panels.delete(panelId);
  }

  /**
   * Shows a panel
   * @param panelId The panel ID to show
   */
  public showPanel(panelId: string): void {
    const panel = this.panels.get(panelId);
    if (!panel) {
      console.warn(`Panel '${panelId}' not found`);
      return;
    }

    panel.element.style.display = "";
    panel.visible = true;

    this.emit("visibilityChanged", {
      panelId,
      visible: true,
      element: panel.element
    });
  }

  /**
   * Hides a panel
   * @param panelId The panel ID to hide
   */
  public hidePanel(panelId: string): void {
    const panel = this.panels.get(panelId);
    if (!panel) {
      console.warn(`Panel '${panelId}' not found`);
      return;
    }

    panel.element.style.display = "none";
    panel.visible = false;

    this.emit("visibilityChanged", {
      panelId,
      visible: false,
      element: panel.element
    });
  }

  /**
   * Toggles panel visibility
   * @param panelId The panel ID to toggle
   */
  public togglePanel(panelId: string): void {
    const panel = this.panels.get(panelId);
    if (!panel) return;

    if (panel.visible) {
      this.hidePanel(panelId);
    } else {
      this.showPanel(panelId);
    }
  }

  /**
   * Checks if a panel is visible
   * @param panelId The panel ID to check
   * @returns true if visible, false otherwise
   */
  public isPanelVisible(panelId: string): boolean {
    const panel = this.panels.get(panelId);
    return panel ? panel.visible : false;
  }

  /**
   * Shows all registered panels
   */
  public showAllPanels(): void {
    for (const [panelId] of this.panels) {
      this.showPanel(panelId);
    }
  }

  /**
   * Hides all registered panels
   */
  public hideAllPanels(): void {
    for (const [panelId] of this.panels) {
      this.hidePanel(panelId);
    }
  }

  /**
   * Gets the visibility state of all panels
   * @returns Object mapping panel IDs to their visibility state
   */
  public getAllPanelStates(): Record<string, boolean> {
    const states: Record<string, boolean> = {};
    for (const [panelId, panel] of this.panels) {
      states[panelId] = panel.visible;
    }
    return states;
  }

  /**
   * Updates the layout for responsive design
   */
  public updateLayout(): void {
    for (const [, panel] of this.panels) {
      this.applyResponsiveLayout(panel.element);
    }
  }

  /**
   * Applies responsive layout to a panel element
   * @param element The element to apply responsive layout to
   */
  private applyResponsiveLayout(element: HTMLElement): void {
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
      element.style.width = "100%";
      element.style.position = "relative";
      element.style.height = "auto";
    } else {
      // Reset to default desktop styles
      element.style.width = "";
      element.style.position = "";
      element.style.height = "";
    }
  }

  /**
   * Sets up window resize listener for responsive layout updates
   */
  private setupResizeListener(): void {
    window.addEventListener("resize", () => {
      this.updateLayout();
    });
  }

  /**
   * Adds an event listener
   * @param event The event type to listen for
   * @param callback The callback function
   */
  public on(event: VisibilityEventType, callback: (data: VisibilityEventData) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Removes an event listener
   * @param event The event type
   * @param callback The callback to remove
   */
  public off(event: VisibilityEventType, callback: (data: VisibilityEventData) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emits an event to all listeners
   * @param event The event type
   * @param data The event data
   */
  private emit(event: VisibilityEventType, data: VisibilityEventData): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  /**
   * Gets a panel element by ID
   * @param panelId The panel ID
   * @returns The panel element or undefined
   */
  public getPanelElement(panelId: string): HTMLElement | undefined {
    const panel = this.panels.get(panelId);
    return panel?.element;
  }

  /**
   * Gets all registered panel IDs
   * @returns Array of panel IDs
   */
  public getRegisteredPanelIds(): string[] {
    return Array.from(this.panels.keys());
  }

  /**
   * Ensures proper initialization and mounting of core UI elements
   */
  public initializeCoreUI(): void {
    if (this.initialized) return;

    // Find or create the left panel container
    let leftPanel = document.getElementById("left-panel");
    if (!leftPanel) {
      leftPanel = document.createElement("div");
      leftPanel.id = "left-panel";
      leftPanel.className = "studio--left";
      document.body.appendChild(leftPanel);
    }

    // Apply proper styling to ensure visibility
    leftPanel.style.display = "block";
    leftPanel.style.visibility = "visible";
    leftPanel.style.opacity = "1";

    this.initialized = true;
  }

  /**
   * Destroys the visibility manager and cleans up all panels
   */
  public destroy(): void {
    for (const panelId of this.getRegisteredPanelIds()) {
      this.unregisterPanel(panelId);
    }
    this.eventListeners.clear();
  }
}
