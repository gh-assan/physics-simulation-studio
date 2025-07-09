import { ParameterPanelComponent } from "../../core/components/ParameterPanelComponent";
import { UIManager } from "../../studio/uiManager";
import { IComponent } from "../../core/ecs/IComponent";
import { FlagComponent } from "./FlagComponent";
import { ComponentControlProperty } from "../../studio/types";

/**
 * Parameter panel for the FlagComponent
 * This class defines the UI controls for the FlagComponent
 */
export class FlagParameterPanel extends ParameterPanelComponent {
  /**
   * The type of the component, used for serialization and deserialization
   */
  static readonly type: string = "FlagParameterPanel";

  /**
   * The component type this panel is associated with
   */
  readonly componentType: string = FlagComponent.type;

  /**
   * Register UI controls for this parameter panel
   * @param uiManager The UI manager to register controls with
   * @param component The component instance to bind controls to
   */
  registerControls(uiManager: UIManager, component: IComponent): void {
    if (!(component instanceof FlagComponent)) {
      console.error("FlagParameterPanel: component is not a FlagComponent");
      return;
    }

    const properties: ComponentControlProperty[] = [
      {
        property: "width",
        type: "number",
        label: "Flag Width",
        min: 0.1,
        max: 10,
        step: 0.1
      },
      {
        property: "height",
        type: "number",
        label: "Flag Height",
        min: 0.1,
        max: 10,
        step: 0.1
      },
      {
        property: "segmentsX",
        type: "number",
        label: "Segments X",
        min: 1,
        max: 50,
        step: 1
      },
      {
        property: "segmentsY",
        type: "number",
        label: "Segments Y",
        min: 1,
        max: 50,
        step: 1
      },
      {
        property: "mass",
        type: "number",
        label: "Particle Mass",
        min: 0.01,
        max: 1,
        step: 0.01
      },
      {
        property: "stiffness",
        type: "number",
        label: "Stiffness",
        min: 0.1,
        max: 1,
        step: 0.01
      },
      {
        property: "damping",
        type: "number",
        label: "Damping",
        min: 0.01,
        max: 1,
        step: 0.01
      },
      {
        property: "textureUrl",
        type: "text",
        label: "Texture URL"
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
      // Wind properties
      {
        property: "windStrength",
        type: "number",
        label: "Wind Strength",
        min: 0,
        max: 10,
        step: 0.1
      },
      {
        property: "windDirection.x",
        type: "number",
        label: "Wind Direction X",
        min: -1,
        max: 1,
        step: 0.1
      },
      {
        property: "windDirection.y",
        type: "number",
        label: "Wind Direction Y",
        min: -1,
        max: 1,
        step: 0.1
      },
      {
        property: "windDirection.z",
        type: "number",
        label: "Wind Direction Z",
        min: -1,
        max: 1,
        step: 0.1
      }
    ];

    uiManager.registerComponentControls(this.componentType, component, properties);
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
