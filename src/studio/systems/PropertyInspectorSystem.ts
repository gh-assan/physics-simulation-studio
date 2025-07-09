import { System } from "../../core/ecs/System";
import { World } from "../../core/ecs/World";
import { UIManager } from "../uiManager";
import { SelectableComponent } from "../../core/components/SelectableComponent";
import { IComponent } from "../../core/ecs/IComponent";
import { FlagComponent } from "../../plugins/flag-simulation/FlagComponent";
import {
  WaterBodyComponent,
  WaterDropletComponent
} from "../../plugins/water-simulation/WaterComponents";

export class PropertyInspectorSystem extends System {
  private uiManager: UIManager;
  private lastSelectedEntity: number | null = null;

  constructor(uiManager: UIManager) {
    super();
    this.uiManager = uiManager;
  }

  public update(world: World, _deltaTime: number): void {
    const selectableEntities = world.componentManager.getEntitiesWithComponents(
      [SelectableComponent]
    );

    let currentSelectedEntity: number | null = null;

    for (const entityId of selectableEntities) {
      const selectable = world.componentManager.getComponent(
        entityId,
        SelectableComponent.name
      );
      if (selectable && (selectable as SelectableComponent).isSelected) {
        currentSelectedEntity = entityId;
        break;
      }
    }

    if (currentSelectedEntity !== this.lastSelectedEntity) {
      this.lastSelectedEntity = currentSelectedEntity;
      this.uiManager.clearControls(); // Clear previous inspector content
      if (currentSelectedEntity !== null) {
        const components = world.componentManager.getAllComponentsForEntity(
          currentSelectedEntity
        );
        for (const componentName in components) {
          if (Object.prototype.hasOwnProperty.call(components, componentName)) {
            if (componentName === FlagComponent.name) {
              this.uiManager.registerComponentControls(
                componentName,
                components[componentName],
                [
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
                ]
              );
            } else if (componentName === WaterBodyComponent.type) {
              this.uiManager.registerComponentControls(
                componentName,
                components[componentName],
                [
                  {
                    property: "viscosity",
                    type: "number",
                    label: "Viscosity",
                    min: 0,
                    max: 1,
                    step: 0.01
                  },
                  {
                    property: "surfaceTension",
                    type: "number",
                    label: "Surface Tension",
                    min: 0,
                    max: 1,
                    step: 0.01
                  }
                ]
              );
            } else if (componentName === WaterDropletComponent.type) {
              this.uiManager.registerComponentControls(
                componentName,
                components[componentName],
                [
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
                  }
                ]
              );
            } else {
              this.uiManager.registerComponentControls(
                componentName,
                components[componentName]
              );
            }
          }
        }
      } else {
        // Clear inspector
      }
    }
  }
}
