export interface VisibilityState {
  panelId: string;
  visible: boolean;
  element: HTMLElement;
}

export interface PanelRegistration {
  element: HTMLElement;
  container: HTMLElement;
  visible: boolean;
  type: 'global' | 'plugin' | 'system';
  metadata?: {
    pluginName?: string;
    componentType?: string;
    priority?: number;
    isGlobalControl?: boolean;
    isSimulationSelector?: boolean;
    tweakpaneFolder?: any; // Tweakpane FolderApi
    parameterPanel?: any; // ParameterPanelComponent instance
  };
}

export type VisibilityEventType = "visibilityChanged" | "panelRegistered" | "panelUnregistered" | "globalPanelToggled" | "pluginPanelToggled";

export interface VisibilityEventData {
  panelId: string;
  visible: boolean;
  element: HTMLElement;
  type?: 'global' | 'plugin' | 'system';
  metadata?: any;
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
   * @param type The type of panel (global, plugin, or system)
   * @param metadata Optional metadata for the panel
   * @returns true if registration successful, false if panel already exists
   */
  public registerPanel(
    panelId: string,
    element: HTMLElement,
    container: HTMLElement,
    type: 'global' | 'plugin' | 'system' = 'system',
    metadata?: PanelRegistration['metadata']
  ): boolean {
    console.log(`[VisibilityManager] registerPanel called:`, { panelId, element, container, type });

    if (this.panels.has(panelId)) {
      console.warn(`Panel with ID '${panelId}' is already registered`);
      return false;
    }

    // Mount the element to the container if not already mounted
    if (container.contains(element)) {
      console.log(`[VisibilityManager] Element already in container`);
      // Still need to register the panel
    }

    if (!container.contains(element)) {
      console.log(`[VisibilityManager] Appending element to container`);
      container.appendChild(element);
    }

    // Register the panel
    this.panels.set(panelId, {
      element,
      container,
      visible: true, // Default to visible
      type,
      metadata
    });

    console.log(`[VisibilityManager] Panel registered. Total panels:`, this.panels.size);

    // Apply initial responsive layout
    this.applyResponsiveLayout(element);

    // Emit registration event
    this.emit("panelRegistered", {
      panelId,
      visible: true,
      element,
      type,
      metadata
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
      element: panel.element,
      type: panel.type,
      metadata: panel.metadata
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
      element: panel.element,
      type: panel.type,
      metadata: panel.metadata
    });

    // Emit specific event based on panel type
    if (panel.type === 'global') {
      this.emit("globalPanelToggled", {
        panelId,
        visible: true,
        element: panel.element,
        type: panel.type,
        metadata: panel.metadata
      });
    } else if (panel.type === 'plugin') {
      this.emit("pluginPanelToggled", {
        panelId,
        visible: true,
        element: panel.element,
        type: panel.type,
        metadata: panel.metadata
      });
    }
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
      element: panel.element,
      type: panel.type,
      metadata: panel.metadata
    });

    // Emit specific event based on panel type
    if (panel.type === 'global') {
      this.emit("globalPanelToggled", {
        panelId,
        visible: false,
        element: panel.element,
        type: panel.type,
        metadata: panel.metadata
      });
    } else if (panel.type === 'plugin') {
      this.emit("pluginPanelToggled", {
        panelId,
        visible: false,
        element: panel.element,
        type: panel.type,
        metadata: panel.metadata
      });
    }
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
      return;
    }

    this.showPanel(panelId);
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

    this.applyResponsiveStyles(element, isMobile);
  }

  /**
   * Applies responsive styles to an element based on mobile/desktop mode
   * @param element The element to style
   * @param isMobile Whether mobile styles should be applied
   */
  private applyResponsiveStyles(element: HTMLElement, isMobile: boolean): void {
    if (isMobile) {
      element.style.width = "100%";
      element.style.position = "relative";
      element.style.height = "auto";
      return;
    }

    // Reset to default desktop styles
    element.style.width = "";
    element.style.position = "";
    element.style.height = "";
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
   * Registers a global panel (Global Controls, Simulations dropdown, etc.)
   * @param panelId The panel ID
   * @param tweakpaneFolder The Tweakpane folder instance
   * @param container The container element
   * @param metadata Additional metadata
   */
  public registerGlobalPanel(
    panelId: string,
    tweakpaneFolder: any,
    container: HTMLElement,
    metadata?: { isGlobalControl?: boolean; isSimulationSelector?: boolean; priority?: number }
  ): boolean {
    const element = tweakpaneFolder.element || tweakpaneFolder.view?.element || container;
    return this.registerPanel(panelId, element, container, 'global', {
      ...metadata,
      tweakpaneFolder
    });
  }

  /**
   * Registers a plugin parameter panel
   * @param panelId The panel ID
   * @param parameterPanel The ParameterPanelComponent instance
   * @param container The container element
   * @param metadata Additional metadata including plugin info
   */
  public registerPluginPanel(
    panelId: string,
    parameterPanel: any,
    container: HTMLElement,
    metadata?: { pluginName?: string; componentType?: string; priority?: number }
  ): boolean {
    console.log(`[VisibilityManager] registerPluginPanel called:`, { panelId, parameterPanel, container, metadata });

    // Get the panel element - may need to be created or found
    const element = this.getOrCreatePanelElement(panelId, parameterPanel);
    console.log(`[VisibilityManager] Got panel element:`, element);

    const success = this.registerPanel(panelId, element, container, 'plugin', {
      ...metadata,
      parameterPanel
    });

    console.log(`[VisibilityManager] registerPanel returned:`, success);

    // Ensure plugin panels are visible by default
    if (success) {
      console.log(`[VisibilityManager] Showing panel ${panelId}`);
      this.showPanel(panelId);

      // Force the element to be visible with inline styles as a debug measure
      element.style.display = 'block';
      element.style.visibility = 'visible';
      element.style.opacity = '1';
      console.log(`[VisibilityManager] Forced visibility styles on element`);
    }

    return success;
  }

  /**
   * Gets or creates a panel element for a parameter panel
   * @param panelId The panel ID
   * @param parameterPanel The parameter panel instance
   */
  private getOrCreatePanelElement(panelId: string, parameterPanel: any): HTMLElement {
    console.log(`[VisibilityManager] getOrCreatePanelElement called for ${panelId}`, parameterPanel);

    // If the parameter panel has an element, use it
    if (parameterPanel.element) {
      console.log(`[VisibilityManager] Using parameterPanel.element`);
      return parameterPanel.element;
    }

    // Try to find the Tweakpane folder element that was already created
    // The componentType is used as the folder title in UIManager.registerComponentControls
    if (parameterPanel.componentType) {
      console.log(`[VisibilityManager] Looking for component type: ${parameterPanel.componentType}`);

      // Look for existing Tweakpane folder with this component type
      const existingFolder = document.querySelector(`[data-tp-folder-title="${parameterPanel.componentType}"]`);
      if (existingFolder) {
        console.log(`[VisibilityManager] Found existing folder by data-tp-folder-title`);
        return existingFolder as HTMLElement;
      }

      // Also try looking by the component type in the DOM
      const folderElements = document.querySelectorAll('.tp-fldv_t');
      console.log(`[VisibilityManager] Found ${folderElements.length} tp-fldv_t elements`);
      for (let i = 0; i < folderElements.length; i++) {
        const element = folderElements[i];
        console.log(`[VisibilityManager] Checking element ${i}: "${element.textContent}"`);
        if (element.textContent?.includes(parameterPanel.componentType)) {
          console.log(`[VisibilityManager] Found matching element by text content`);
          return element.parentElement as HTMLElement;
        }
      }

      // Try to find by known panel titles
      const matchingTitleElement = this.findElementByPanelTitle();
      if (matchingTitleElement) {
        console.log(`[VisibilityManager] Found panel by title: "${matchingTitleElement.textContent}"`);
        return matchingTitleElement.parentElement as HTMLElement;
      }
    }

    console.log(`[VisibilityManager] No existing element found, creating new container`);
    // If no existing element found, create a container element for the parameter panel
    const element = document.createElement('div');
    element.className = 'parameter-panel';
    element.id = `parameter-panel-${panelId}`;
    element.setAttribute('data-panel-id', panelId);

    return element;
  }

  /**
   * Finds a panel element by known panel titles
   * @returns The matching element or null
   */
  private findElementByPanelTitle(): HTMLElement | null {
    const knownTitles = [
      'Flag Simulation Settings',
      'Water Droplet Settings',
      'Water Body Settings'
    ];

    const panelTitleElements = document.querySelectorAll('.tp-fldv_t');
    for (let i = 0; i < panelTitleElements.length; i++) {
      const element = panelTitleElements[i];
      const textContent = element.textContent || '';

      for (const title of knownTitles) {
        if (textContent.includes(title)) {
          return element as HTMLElement;
        }
      }
    }

    return null;
  }

  /**
   * Shows all global panels
   */
  public showAllGlobalPanels(): void {
    for (const [panelId, panel] of this.panels) {
      if (panel.type === 'global') {
        this.showPanel(panelId);
      }
    }
  }

  /**
   * Hides all global panels
   */
  public hideAllGlobalPanels(): void {
    for (const [panelId, panel] of this.panels) {
      if (panel.type === 'global') {
        this.hidePanel(panelId);
      }
    }
  }

  /**
   * Shows all plugin panels
   */
  public showAllPluginPanels(): void {
    for (const [panelId, panel] of this.panels) {
      if (panel.type === 'plugin') {
        this.showPanel(panelId);
      }
    }
  }

  /**
   * Hides all plugin panels
   */
  public hideAllPluginPanels(): void {
    for (const [panelId, panel] of this.panels) {
      if (panel.type === 'plugin') {
        this.hidePanel(panelId);
      }
    }
  }

  /**
   * Gets panels by type
   * @param type The type of panels to get
   * @returns Map of panel IDs to panel registrations of the specified type
   */
  public getPanelsByType(type: 'global' | 'plugin' | 'system'): Map<string, PanelRegistration> {
    const result = new Map<string, PanelRegistration>();
    for (const [panelId, panel] of this.panels) {
      if (panel.type === type) {
        result.set(panelId, panel);
      }
    }
    return result;
  }

  /**
   * Gets panels by plugin name
   * @param pluginName The plugin name to filter by
   * @returns Map of panel IDs to panel registrations for the specified plugin
   */
  public getPanelsByPlugin(pluginName: string): Map<string, PanelRegistration> {
    const result = new Map<string, PanelRegistration>();
    for (const [panelId, panel] of this.panels) {
      if (panel.metadata?.pluginName === pluginName) {
        result.set(panelId, panel);
      }
    }
    return result;
  }

  /**
   * Toggles all panels for a specific plugin
   * @param pluginName The plugin name
   * @param visible Whether to show or hide the panels (toggles if not specified)
   */
  public togglePluginPanels(pluginName: string, visible?: boolean): void {
    const pluginPanels = this.getPanelsByPlugin(pluginName);
    for (const [panelId] of pluginPanels) {
      if (visible === undefined) {
        this.togglePanel(panelId);
      } else {
        visible ? this.showPanel(panelId) : this.hidePanel(panelId);
      }
    }
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
