import { UIManager } from "../uiManager";
import { IComponent } from "../../core/ecs/IComponent";
import { getComponentProperties } from "../utils/ComponentPropertyRegistry";
import { ParameterPanelComponent } from "../../core/components/ParameterPanelComponent";
import { Logger } from "../../core/utils/Logger";

/**
 * Manages the rendering of properties in the Property Inspector UI.
 * This class is responsible for interacting with the UIManager to display
 * component properties, either via a dedicated ParameterPanelComponent
 * or by dynamically generating controls from the ComponentPropertyRegistry.
 */
export class PropertyInspectorUIManager {
  private uiManager: UIManager;

  constructor(uiManager: UIManager) {
    this.uiManager = uiManager;
  }

  /**
   * Clears all controls from the property inspector.
   */
  public clearInspectorControls(): void {
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

    // First, try to find a parameter panel component for this component type
    const parameterPanel = parameterPanels.find(
      (panel) => panel.componentType === componentTypeKey
    );

    if (parameterPanel) {
      Logger.log(
        `[PropertyInspectorUIManager] Using parameter panel for component '${displayName}'`
      );
      parameterPanel.registerControls(this.uiManager, componentInstance);
    } else {
      // Fall back to dynamically generating controls if no parameter panel component is found
      const properties = getComponentProperties(componentTypeKey);

      if (properties) {
        Logger.log(
          `[PropertyInspectorUIManager] Found ${properties.length} properties for component '${displayName}' using key '${componentTypeKey}'`
        );
      } else {
        Logger.warn(
          `[PropertyInspectorUIManager] No properties found for component '${displayName}' using key '${componentTypeKey}'`
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
    Logger.log(
      `[PropertyInspectorUIManager] Registering ${parameterPanels.length} parameter panels.`
    );
    for (const panel of parameterPanels) {
      panel.registerControls(this.uiManager);
    }
  }
}
