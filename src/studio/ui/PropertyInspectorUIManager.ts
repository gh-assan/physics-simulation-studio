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
    const displayName = componentTypeKey;
    const parameterPanel = parameterPanels.find(
      (panel) => panel.componentType === componentTypeKey
    );

    if (parameterPanel) {
      Logger.getInstance().log(
        `[PropertyInspectorUIManager] Using parameter panel for component '${displayName}'`
      );
      parameterPanel.registerControls(this.uiManager as UIManager, componentInstance);
      return;
    }

    const properties = ComponentPropertyRegistry.getInstance().getComponentProperties(componentTypeKey);
    const logMessage = properties
      ? `Found ${properties.length} properties for component '${displayName}'`
      : `No properties found for component '${displayName}'`;

    (properties ? Logger.getInstance().log : Logger.getInstance().warn).call(
      Logger.getInstance(),
      `[PropertyInspectorUIManager] ${logMessage}`
    );

    this.uiManager.registerComponentControls(displayName, componentInstance, properties);
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

      panel.registerControls(this.uiManager as UIManager);
      console.log(`[PropertyInspectorUIManager] Controls registered for ${panel.componentType}`);

      // Register with VisibilityManager if available
      this.registerWithVisibilityManager(panel);
    }
  }

  /**
   * Registers a panel with VisibilityManager if available
   */
  private registerWithVisibilityManager(panel: ParameterPanelComponent): void {
    if (!this.visibilityManager) {
      console.log(`[PropertyInspectorUIManager] No VisibilityManager available`);
      return;
    }

    const leftPanel = document.getElementById("left-panel");
    if (!leftPanel) {
      console.error(`[PropertyInspectorUIManager] left-panel element not found!`);
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

    console.log(`[PropertyInspectorUIManager] VisibilityManager registration ${success ? 'succeeded' : 'failed'} for ${panelId}`);
    Logger.getInstance().log(
      `[PropertyInspectorUIManager] Registered parameter panel '${panelId}' with VisibilityManager`
    );
  }

  /**
   * Clears parameter panels from VisibilityManager
   */
  public clearParameterPanels(): void {
    const pluginPanels = this.visibilityManager?.getPanelsByType('plugin');
    if (pluginPanels) {
      for (const [panelId] of pluginPanels) {
        this.visibilityManager!.unregisterPanel(panelId);
      }
    }
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
