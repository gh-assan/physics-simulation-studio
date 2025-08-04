import { ParameterPanelComponent } from "../../core/components/ParameterPanelComponent";
import { IUIManager } from "../../studio/IUIManager";
import { IComponent } from "../../core/ecs/IComponent";
import { FlagComponent } from "../../core/ecs/FlagComponent";
import { ComponentControlProperty } from "../../studio/types";
import { World } from "../../core/ecs/World";
import { PoleComponent } from "./PoleComponent";
import { Logger } from "../../core/utils/Logger";

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
  readonly componentType: string = FlagComponent.simulationType;

  private world: World;

  constructor(world: World) {
    super();
    this.world = world;
  }

  /**
   * Register UI controls for this parameter panel
   * @param uiManager The UI manager to register controls with
   * @param component The component instance to bind controls to
   */
  registerControls(uiManager: IUIManager, component?: IComponent): void {
    // If a component is provided, ensure it's a FlagComponent
    if (component && !(component instanceof FlagComponent)) {
      Logger.getInstance().error("FlagParameterPanel: provided component is not a FlagComponent");
      return;
    }

    // If no component is provided, we can't register controls for it.
    // In a future implementation, we could show global simulation settings here.
    if (!component) {
      // For now, we'll just add a folder indicating the active simulation.
      const panel = uiManager.createPanel('Flag Simulation Settings');
      panel.addBlade({
        view: 'text',
        value: 'No flag selected. Select a flag to see its properties.',
        label: 'Info',
      });
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

    // Add Pole Controls
    const poleEntities = this.world.componentManager.getEntitiesWithComponents([
      PoleComponent
    ]);
    const poleOptions: { text: string; value: number | null }[] =
      poleEntities.map((entityId) => ({
        text: `Pole ${entityId}`,
        value: entityId
      }));
    poleOptions.unshift({ text: "None", value: null }); // Add a 'None' option

    properties.push(
      {
        property: "poleEntityId",
        type: "list",
        label: "Attach to Pole",
        options: poleOptions
      },
      {
        property: "attachedEdge",
        type: "list",
        label: "Attached Edge",
        options: [
          { text: "Left", value: "left" },
          { text: "Right", value: "right" },
          { text: "Top", value: "top" },
          { text: "Bottom", value: "bottom" }
        ]
      }
    );

    // Add controls for creating a new pole
    /*
    uiManager.addFolder('Pole Creation', (folder) => {
      const newPoleParams = {
        x: 0,
        y: 0,
        z: 0,
        height: 10,
        radius: 0.1,
        create: () => {
          const poleEntity = this.world.entityManager.createEntity();
          this.world.componentManager.addComponent(
            poleEntity,
            PoleComponent.type,
            new PoleComponent({
              position: new PoleComponent().position.set(newPoleParams.x, newPoleParams.y, newPoleParams.z),
              height: newPoleParams.height,
              radius: newPoleParams.radius
            })
          );
          // Refresh the UI to show the new pole in the dropdown
          uiManager.refresh();
        }
      };

      folder.addBinding(newPoleParams, 'x', { label: 'X' });
      folder.addBinding(newPoleParams, 'y', { label: 'Y' });
      folder.addBinding(newPoleParams, 'z', { label: 'Z' });
      folder.addBinding(newPoleParams, 'height', { label: 'Height', min: 1, max: 50, step: 0.1 });
      folder.addBinding(newPoleParams, 'radius', { label: 'Radius', min: 0.01, max: 1, step: 0.01 });
      folder.addButton({ title: 'Create New Pole' }).on('click', newPoleParams.create);
    });
    */

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
