import { ParameterPanelComponent } from "../../core/components/ParameterPanelComponent";
import { IUIManager } from "../../studio/IUIManager";
import { IComponent } from "../../core/ecs/IComponent";
import { WaterBodyComponent } from "./WaterComponents";
import { ComponentControlProperty } from "../../studio/types";
import { Logger } from "../../core/utils/Logger";

import { WATER_PHYSICS_CONSTANTS } from "./constants";

/**
 * Parameter panel for the WaterBodyComponent
 * This class defines the UI controls for the WaterBodyComponent
 */
export class WaterBodyParameterPanel extends ParameterPanelComponent {
  /**
   * The type of the component, used for serialization and deserialization
   */
  static readonly type: string = "WaterBodyParameterPanel";

  /**
   * The component type this panel is associated with
   */
  readonly componentType: string = WaterBodyComponent.type;

  /**
   * Register UI controls for this parameter panel
   * @param uiManager The UI manager to register controls with
   * @param component The component instance to bind controls to
   */
  registerControls(uiManager: IUIManager, component?: IComponent): void {
    if (component && !(component instanceof WaterBodyComponent)) {
      Logger.getInstance().error(
        "WaterBodyParameterPanel: component is not a WaterBodyComponent"
      );
      return;
    }

    if (!component) {
      const panel = uiManager.createPanel('Water Body Settings');

      // Create a simple object to bind to for displaying the message
      const messageObject = {
        message: 'No water body selected. Select a water body to see its properties.'
      };

      // Use addBinding to display the message
      uiManager.addBinding(panel, messageObject, 'message', {
        readonly: true,
        label: 'Info'
      });

      return;
    }

    const properties: ComponentControlProperty[] = [
      {
        property: "viscosity.value",
        type: "number",
        label: "Viscosity",
        min: WATER_PHYSICS_CONSTANTS.VISCOSITY_COEFFICIENT.min,
        max: WATER_PHYSICS_CONSTANTS.VISCOSITY_COEFFICIENT.max,
        step: WATER_PHYSICS_CONSTANTS.VISCOSITY_COEFFICIENT.step
      },
      {
        property: "surfaceTension.value",
        type: "number",
        label: "Surface Tension",
        min: WATER_PHYSICS_CONSTANTS.SURFACE_TENSION_COEFFICIENT.min,
        max: WATER_PHYSICS_CONSTANTS.SURFACE_TENSION_COEFFICIENT.max,
        step: WATER_PHYSICS_CONSTANTS.SURFACE_TENSION_COEFFICIENT.step
      }
    ];

    uiManager.registerComponentControls(
      this.componentType,
      component,
      properties
    );
  }

  /**
   * Update the UI controls when the component changes
   * @param component The component instance that changed
   */
  updateControls(component: IComponent): void {
    // This method would be called when the component changes
    // For now, we don't need to do anything here as the UI is bound directly to the component
    // and will update automatically when the component changes
  }

  /**
   * Handle events from the UI controls
   * @param event The event to handle
   * @param component The component instance to update
   */
  handleEvent(event: string, component: IComponent): void {}
}
