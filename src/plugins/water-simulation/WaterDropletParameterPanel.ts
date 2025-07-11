import { ParameterPanelComponent } from "../../core/components/ParameterPanelComponent";
import { UIManager } from "../../studio/uiManager";
import { IComponent } from "../../core/ecs/IComponent";
import { WaterDropletComponent } from "./WaterComponents";
import { ComponentControlProperty } from "../../studio/types";

/**
 * Parameter panel for the WaterDropletComponent
 * This class defines the UI controls for the WaterDropletComponent
 */
export class WaterDropletParameterPanel extends ParameterPanelComponent {
  /**
   * The type of the component, used for serialization and deserialization
   */
  static readonly type: string = "WaterDropletParameterPanel";

  /**
   * The component type this panel is associated with
   */
  readonly componentType: string = WaterDropletComponent.type;

  /**
   * Register UI controls for this parameter panel
   * @param uiManager The UI manager to register controls with
   * @param component The component instance to bind controls to
   */
  registerControls(uiManager: UIManager, component: IComponent): void {
    if (!(component instanceof WaterDropletComponent)) {
      console.error(
        "WaterDropletParameterPanel: component is not a WaterDropletComponent"
      );
      return;
    }

    const properties: ComponentControlProperty[] = [
      // Basic properties
      {
        property: "size",
        type: "number",
        label: "Droplet Size",
        min: 0.1,
        max: 5,
        step: 0.1
      },
      {
        property: "fallHeight",
        type: "number",
        label: "Fall Height",
        min: 1,
        max: 100,
        step: 1
      },

      // Physics properties
      {
        property: "mass",
        type: "number",
        label: "Mass",
        min: 0.1,
        max: 10,
        step: 0.1
      },
      {
        property: "drag",
        type: "number",
        label: "Drag Coefficient",
        min: 0,
        max: 1,
        step: 0.01
      },

      // Gravity properties
      {
        property: "gravity.x",
        type: "number",
        label: "Gravity X",
        min: -20,
        max: 20,
        step: 0.1
      },
      {
        property: "gravity.y",
        type: "number",
        label: "Gravity Y",
        min: -20,
        max: 20,
        step: 0.1
      },
      {
        property: "gravity.z",
        type: "number",
        label: "Gravity Z",
        min: -20,
        max: 20,
        step: 0.1
      },

      // Velocity properties
      {
        property: "velocity.x",
        type: "number",
        label: "Velocity X",
        min: -10,
        max: 10,
        step: 0.1
      },
      {
        property: "velocity.y",
        type: "number",
        label: "Velocity Y",
        min: -10,
        max: 10,
        step: 0.1
      },
      {
        property: "velocity.z",
        type: "number",
        label: "Velocity Z",
        min: -10,
        max: 10,
        step: 0.1
      },

      // Splash properties
      {
        property: "splashForce",
        type: "number",
        label: "Splash Force",
        min: 0.1,
        max: 5,
        step: 0.1
      },
      {
        property: "splashRadius",
        type: "number",
        label: "Splash Radius",
        min: 0.1,
        max: 10,
        step: 0.1
      },

      // Ripple properties
      {
        property: "rippleDecay",
        type: "number",
        label: "Ripple Decay",
        min: 0.1,
        max: 2,
        step: 0.1
      },
      {
        property: "rippleExpansionRate",
        type: "number",
        label: "Ripple Expansion Rate",
        min: 1,
        max: 20,
        step: 0.5
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
  handleEvent(event: string, component: IComponent): void {
    // This method would be called when an event is triggered from the UI
    // For now, we don't need to do anything here as the UI is bound directly to the component
    // and will update the component automatically when the UI changes
  }
}
