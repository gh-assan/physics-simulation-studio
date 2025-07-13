import { UIManager } from "../uiManager";
import { IComponent } from "../../core/ecs/IComponent";
import { getComponentProperties } from "../utils/ComponentPropertyRegistry";
import { ParameterPanelComponent } from "../../core/components/ParameterPanelComponent";
import { Logger } from "../../core/utils/Logger";

export class PropertyInspectorUIManager {
  private uiManager: UIManager;

  constructor(uiManager: UIManager) {
    this.uiManager = uiManager;
  }

  public clearInspector(): void {
    this.uiManager.clearControls();
  }

  public displayComponentProperties(
    componentTypeKey: string,
    componentInstance: IComponent,
    parameterPanels: ParameterPanelComponent[]
  ): void {
    const displayName = componentTypeKey;

    const parameterPanel = parameterPanels.find(
      (panel) => panel.componentType === componentTypeKey
    );

    if (parameterPanel) {
      Logger.log(
        `[PropertyInspectorUIManager] Using parameter panel for component '${displayName}'`
      );
      parameterPanel.registerControls(this.uiManager, componentInstance);
    } else {
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

  public displayParameterPanels(panels: ParameterPanelComponent[]): void {
    this.uiManager.clearControls();
    for (const panel of panels) {
      panel.registerControls(this.uiManager);
    }
  }
}
