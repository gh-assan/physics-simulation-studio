import { ParameterPanelComponent } from "../../core/components/ParameterPanelComponent";
import { UIManager } from "../../studio/uiManager";
import { IComponent } from "../../core/ecs/IComponent";
import { WaterDropletComponent } from "./WaterComponents";
import { ComponentControlProperty } from "../../studio/types";

import { WATER_PHYSICS_CONSTANTS } from "./constants";

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
  registerControls(uiManager: UIManager, component?: IComponent): void {
    if (component && !(component instanceof WaterDropletComponent)) {
      console.error(
        "WaterDropletParameterPanel: component is not a WaterDropletComponent"
      );
      return;
    }

    if (!component) {
      uiManager.addFolder('Water Droplet Settings', (folder) => {
        folder.addBlade({
            view: 'text',
            value: 'No water droplet selected. Select a water droplet to see its properties.',
            label: 'Info',
        });
      });
      return;
    }

    const properties: ComponentControlProperty[] = [
      // Basic properties
      {
        property: "radius.value",
        type: "number",
        label: "Droplet Radius",
        min: WATER_PHYSICS_CONSTANTS.DROPLET_RADIUS.min,
        max: WATER_PHYSICS_CONSTANTS.DROPLET_RADIUS.max,
        step: WATER_PHYSICS_CONSTANTS.DROPLET_RADIUS.step
      },
      {
        property: "fallHeight.value",
        type: "number",
        label: "Fall Height",
        min: WATER_PHYSICS_CONSTANTS.DROPLET_FALL_HEIGHT.min,
        max: WATER_PHYSICS_CONSTANTS.DROPLET_FALL_HEIGHT.max,
        step: WATER_PHYSICS_CONSTANTS.DROPLET_FALL_HEIGHT.step
      },

      // Physics properties
      {
        property: "mass.value",
        type: "number",
        label: "Mass",
        min: WATER_PHYSICS_CONSTANTS.DROPLET_MASS.min,
        max: WATER_PHYSICS_CONSTANTS.DROPLET_MASS.max,
        step: WATER_PHYSICS_CONSTANTS.DROPLET_MASS.step
      },
      {
        property: "drag.value",
        type: "number",
        label: "Drag Coefficient",
        min: WATER_PHYSICS_CONSTANTS.DROPLET_DRAG.min,
        max: WATER_PHYSICS_CONSTANTS.DROPLET_DRAG.max,
        step: WATER_PHYSICS_CONSTANTS.DROPLET_DRAG.step
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
        property: "splashForce.value",
        type: "number",
        label: "Splash Force",
        min: WATER_PHYSICS_CONSTANTS.DROPLET_SPLASH_FORCE.min,
        max: WATER_PHYSICS_CONSTANTS.DROPLET_SPLASH_FORCE.max,
        step: WATER_PHYSICS_CONSTANTS.DROPLET_SPLASH_FORCE.step
      },
      {
        property: "splashRadius.value",
        type: "number",
        label: "Splash Radius",
        min: WATER_PHYSICS_CONSTANTS.DROPLET_SPLASH_RADIUS.min,
        max: WATER_PHYSICS_CONSTANTS.DROPLET_SPLASH_RADIUS.max,
        step: WATER_PHYSICS_CONSTANTS.DROPLET_SPLASH_RADIUS.step
      },

      // Ripple properties
      {
        property: "rippleDecay.value",
        type: "number",
        label: "Ripple Decay",
        min: WATER_PHYSICS_CONSTANTS.DROPLET_RIPPLE_DECAY.min,
        max: WATER_PHYSICS_CONSTANTS.DROPLET_RIPPLE_DECAY.max,
        step: WATER_PHYSICS_CONSTANTS.DROPLET_RIPPLE_DECAY.step
      },
      {
        property: "rippleExpansionRate.value",
        type: "number",
        label: "Ripple Expansion Rate",
        min: WATER_PHYSICS_CONSTANTS.DROPLET_RIPPLE_EXPANSION_RATE.min,
        max: WATER_PHYSICS_CONSTANTS.DROPLET_RIPPLE_EXPANSION_RATE.max,
        step: WATER_PHYSICS_CONSTANTS.DROPLET_RIPPLE_EXPANSION_RATE.step
      },

      // SPH Properties
      {
        property: "smoothingLength.value",
        type: "number",
        label: "Smoothing Length (h)",
        min: WATER_PHYSICS_CONSTANTS.SMOOTHING_LENGTH.min,
        max: WATER_PHYSICS_CONSTANTS.SMOOTHING_LENGTH.max,
        step: WATER_PHYSICS_CONSTANTS.SMOOTHING_LENGTH.step
      },
      {
        property: "gasConstant.value",
        type: "number",
        label: "Gas Constant (k)",
        min: WATER_PHYSICS_CONSTANTS.GAS_CONSTANT.min,
        max: WATER_PHYSICS_CONSTANTS.GAS_CONSTANT.max,
        step: WATER_PHYSICS_CONSTANTS.GAS_CONSTANT.step
      },
      {
        property: "restDensity.value",
        type: "number",
        label: "Rest Density (rho0)",
        min: WATER_PHYSICS_CONSTANTS.REST_DENSITY.min,
        max: WATER_PHYSICS_CONSTANTS.REST_DENSITY.max,
        step: WATER_PHYSICS_CONSTANTS.REST_DENSITY.step
      },
      {
        property: "surfaceTensionCoefficient.value",
        type: "number",
        label: "Surface Tension Coeff",
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
  handleEvent(event: string, component: IComponent): void {
    // This method would be called when an event is triggered from the UI
    // For now, we don't need to do anything here as the UI is bound directly to the component
    // and will update the component automatically when the UI changes
  }
}
