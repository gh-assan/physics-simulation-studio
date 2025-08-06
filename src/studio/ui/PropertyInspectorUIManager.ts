import { IUIManager } from "../IUIManager";
import { UIManager } from "../uiManager";
import { IComponent } from "../../core/ecs/IComponent";
import { ComponentPropertyRegistry } from "../utils/ComponentPropertyRegistry";
import { ParameterPanelComponent } from "../../core/components/ParameterPanelComponent";
import { Logger } from "../../core/utils/Logger";
import { IPropertyInspectorUIManager } from "./IPropertyInspectorUIManager";
import { VisibilityManager } from "./VisibilityManager";
import { ComponentTypeRegistry } from "../utils/ComponentTypeRegistry";

/**
 * Manages the rendering of properties in the Property Inspector UI.
 * This class is responsible for interacting with the UIManager to display
 * component properties, either via a dedicated ParameterPanelComponent
 * or by dynamically generating controls from the ComponentPropertyRegistry.
 */
export class PropertyInspectorUIManager implements IPropertyInspectorUIManager {
  private uiManager: IUIManager;
  private visibilityManager?: VisibilityManager;
  private componentTypeRegistry: ComponentTypeRegistry;

  constructor(uiManager: IUIManager, visibilityManager?: VisibilityManager) {
    this.uiManager = uiManager;
    this.visibilityManager = visibilityManager;
    this.componentTypeRegistry = new ComponentTypeRegistry();
  }

  /**
   * Required by IPropertyInspectorUIManager interface. Clears inspector controls.
   */
  public clearInspectorControls(): void {
    this.clearControls();
    this.clearParameterPanels();
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
    const parameterPanel = parameterPanels.find(
      (panel) => panel.componentType === componentTypeKey
    );

    if (parameterPanel) {
      Logger.getInstance().log(
        `[PropertyInspectorUIManager] Using parameter panel for component '${componentTypeKey}'`
      );
      parameterPanel.registerControls(this.uiManager as UIManager, componentInstance);
      return;
    }

    const properties = ComponentPropertyRegistry.getInstance().getComponentProperties(componentTypeKey);
    const logMethod = properties ? Logger.getInstance().log : Logger.getInstance().warn;
    const logMessage = properties
      ? `Found ${properties.length} properties for component '${componentTypeKey}'`
      : `No properties found for component '${componentTypeKey}'`;

    logMethod.call(Logger.getInstance(), `[PropertyInspectorUIManager] ${logMessage}`);
    this.uiManager.registerComponentControls(componentTypeKey, componentInstance, properties);
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

    parameterPanels.forEach(panel => {
      console.log(`[PropertyInspectorUIManager] Registering panel for component type: ${panel.componentType}`);

      panel.registerControls(this.uiManager as UIManager);
      console.log(`[PropertyInspectorUIManager] Controls registered for ${panel.componentType}`);

      // Register with VisibilityManager if available
      this.registerWithVisibilityManager(panel);
    });
  }

  /**
   * Registers a panel with VisibilityManager if available
   */
  private registerWithVisibilityManager(panel: ParameterPanelComponent): void {
    const leftPanel = document.getElementById("left-panel");

    if (!this.visibilityManager || !leftPanel) {
      const reason = !this.visibilityManager ? 'No VisibilityManager available' : 'left-panel element not found!';
      console.log(`[PropertyInspectorUIManager] ${reason}`);
      return;
    }

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

    const status = success ? 'succeeded' : 'failed';
    console.log(`[PropertyInspectorUIManager] VisibilityManager registration ${status} for ${panelId}`);
    Logger.getInstance().log(
      `[PropertyInspectorUIManager] Registered parameter panel '${panelId}' with VisibilityManager`
    );
  }

  /**
   * Clears parameter panels from VisibilityManager
   */
  public clearParameterPanels(): void {
    const pluginPanels = this.visibilityManager?.getPanelsByType('plugin');
    pluginPanels?.forEach((_, panelId) => {
      this.visibilityManager?.unregisterPanel(panelId);
    });
  }

  /**
   * Extracts plugin name from a parameter panel
   * @param panel The parameter panel
   * @returns The plugin name or 'unknown'
   */
  private extractPluginNameFromPanel(panel: ParameterPanelComponent): string {
    return this.componentTypeRegistry.getPluginName(panel.componentType);
  }

  /**
   * Calculates panel priority based on component type
   * @param panel The parameter panel
   * @returns Priority number (lower = higher priority)
   */
  private calculatePanelPriority(panel: ParameterPanelComponent): number {
    return this.componentTypeRegistry.getPriority(panel.componentType);
  }

  /**
   * Sets the VisibilityManager instance
   * @param visibilityManager The VisibilityManager instance
   */
  public setVisibilityManager(visibilityManager: VisibilityManager): void {
    this.visibilityManager = visibilityManager;
  }
}
