import { IUIManager } from "../IUIManager";
import { UIManager } from "../uiManager";
import { IComponent } from "../../core/ecs/IComponent";
import { ComponentPropertyRegistry } from "../utils/ComponentPropertyRegistry";
import { ParameterPanelComponent } from "../../core/components/ParameterPanelComponent";
import { Logger } from "../../core/utils/Logger";
import { IPropertyInspectorUIManager } from "./IPropertyInspectorUIManager";
import { VisibilityManager } from "./VisibilityManager";

/**
 * Manages the rendering of properties in the Property Inspector UI.
 * This class is responsible for interacting with the UIManager to display
 * component properties, either via a dedicated ParameterPanelComponent
 * or by dynamically generating controls from the ComponentPropertyRegistry.
 */
export class PropertyInspectorUIManager implements IPropertyInspectorUIManager {
  /**
   * Required by IPropertyInspectorUIManager interface. Clears inspector controls.
   */
  public clearInspectorControls(): void {
    // Clear traditional controls
    this.clearControls();
    // Clear parameter panels from VisibilityManager
    this.clearParameterPanels();
  }
  private uiManager: IUIManager;
  private visibilityManager?: VisibilityManager;

  constructor(uiManager: IUIManager, visibilityManager?: VisibilityManager) {
    this.uiManager = uiManager;
    this.visibilityManager = visibilityManager;
  }

  /**
   * Clears all controls from the property inspector.
   */
  public clearControls(): void {
    this.uiManager.clearControls();
  }

  /**
   * Registers UI controls for a given component.
   * It first attempts to use a provided ParameterPanelComponent. If not found,
   * it falls back to dynamically generating controls based on the ComponentPropertyRegistry.
   * @param componentTypeKey The string key representing the component type (e.g., "FlagComponent").
   * @param componentInstance The instance of the component.
   * @param parameterPanels An array of available ParameterPanelComponents.
   */
  public registerComponentControls(
    componentTypeKey: string,
    componentInstance: IComponent,
    parameterPanels: ParameterPanelComponent[]
  ): void {
    const displayName = componentTypeKey;

    const parameterPanel = parameterPanels.find(
      (panel) => panel.componentType === componentTypeKey
    );

    if (parameterPanel) {
      Logger.getInstance().log(
        `[PropertyInspectorUIManager] Using parameter panel for component '${displayName}'`
      );
      parameterPanel.registerControls(this.uiManager as UIManager, componentInstance);
    } else {
      const properties = ComponentPropertyRegistry.getInstance().getComponentProperties(componentTypeKey);

      if (properties) {
        Logger.getInstance().log(
          `[PropertyInspectorUIManager] Found ${properties.length} properties for component '${displayName}'`
        );
      } else {
        Logger.getInstance().warn(
          `[PropertyInspectorUIManager] No properties found for component '${displayName}'`
        );
      }

      this.uiManager.registerComponentControls(
        displayName,
        componentInstance,
        properties
      );
    }
  }

  /**
   * Registers UI controls for a list of parameter panels.
   * This is typically used for simulation-level parameters when no entity is selected.
   * @param parameterPanels An array of ParameterPanelComponents to register.
   */
  public registerParameterPanels(parameterPanels: ParameterPanelComponent[]): void {
    console.log(`[PropertyInspectorUIManager] registerParameterPanels called with ${parameterPanels.length} panels`);
    Logger.getInstance().log(
      `[PropertyInspectorUIManager] Registering ${parameterPanels.length} parameter panels.`
    );

    for (const panel of parameterPanels) {
      console.log(`[PropertyInspectorUIManager] Registering panel for component type: ${panel.componentType}`);

      // Register controls with UIManager as before
      panel.registerControls(this.uiManager as UIManager);
      console.log(`[PropertyInspectorUIManager] Controls registered for ${panel.componentType}`);

      // If VisibilityManager is available, register plugin panel for centralized management
      if (this.visibilityManager) {
        const leftPanel = document.getElementById("left-panel");
        if (leftPanel) {
          const panelId = `plugin-panel-${panel.componentType}`;
          const pluginName = this.extractPluginNameFromPanel(panel);

          console.log(`[PropertyInspectorUIManager] Registering with VisibilityManager: ${panelId}`);
          const success = this.visibilityManager.registerPluginPanel(
            panelId,
            panel,
            leftPanel,
            {
              pluginName,
              componentType: panel.componentType,
              priority: this.calculatePanelPriority(panel)
            }
          );

          console.log(`[PropertyInspectorUIManager] VisibilityManager registration ${success ? 'succeeded' : 'failed'} for ${panelId}`);
          Logger.getInstance().log(
            `[PropertyInspectorUIManager] Registered parameter panel '${panelId}' with VisibilityManager`
          );
        } else {
          console.error(`[PropertyInspectorUIManager] left-panel element not found!`);
        }
      } else {
        console.log(`[PropertyInspectorUIManager] No VisibilityManager available`);
      }
    }
  }

  /**
   * Clears parameter panels from VisibilityManager
   */
  public clearParameterPanels(): void {
    if (this.visibilityManager) {
      const pluginPanels = this.visibilityManager.getPanelsByType('plugin');
      for (const [panelId] of pluginPanels) {
        this.visibilityManager.unregisterPanel(panelId);
      }
    }
  }

  /**
   * Extracts plugin name from a parameter panel
   * @param panel The parameter panel
   * @returns The plugin name or 'unknown'
   */
  private extractPluginNameFromPanel(panel: ParameterPanelComponent): string {
    const componentType = panel.componentType;

    // Try to extract plugin name from component type patterns
    // This is a fallback - ideally panels should include plugin metadata
    if (componentType.includes('Flag') || componentType.includes('Pole')) {
      return 'flag-simulation';
    } else if (componentType.includes('Water')) {
      return 'water-simulation';
    } else if (componentType.includes('Solar') || componentType.includes('Celestial')) {
      return 'solar-system';
    }

    // For unknown types, try to infer from component type naming convention
    // e.g., "MyPluginComponent" -> "my-plugin"
    const match = componentType.match(/^(\w+?)(?:Component|Panel)?$/);
    if (match) {
      return match[1].toLowerCase().replace(/([A-Z])/g, '-$1').replace(/^-/, '');
    }

    return 'unknown';
  }

  /**
   * Calculates panel priority based on component type
   * @param panel The parameter panel
   * @returns Priority number (lower = higher priority)
   */
  private calculatePanelPriority(panel: ParameterPanelComponent): number {
    const componentType = panel.componentType;

    // Core components get higher priority
    if (componentType.includes('Flag') || componentType.includes('Water')) {
      return 10;
    } else if (componentType.includes('Pole') || componentType.includes('Body')) {
      return 20;
    }

    return 30; // Default priority
  }

  /**
   * Sets the VisibilityManager instance
   * @param visibilityManager The VisibilityManager instance
   */
  public setVisibilityManager(visibilityManager: VisibilityManager): void {
    this.visibilityManager = visibilityManager;
  }
}
