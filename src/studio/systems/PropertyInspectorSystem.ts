import { System } from "../../core/ecs/System";
import { World } from "../../core/ecs/World";
import { UIManager } from "../uiManager";
import { SelectableComponent } from "../../core/components/SelectableComponent";
import { IComponent } from "../../core/ecs/IComponent";
import { getComponentProperties } from "../utils/ComponentPropertyRegistry";
import "../utils/ComponentPropertyDefinitions"; // Import to ensure component properties are registered

export class PropertyInspectorSystem extends System {
  private uiManager: UIManager;
  private lastSelectedEntity: number | null = null;

  constructor(uiManager: UIManager) {
    super();
    this.uiManager = uiManager;
  }

  /**
   * Finds the currently selected entity in the world
   * @param world The ECS world
   * @returns The ID of the selected entity, or null if no entity is selected
   */
  private findSelectedEntity(world: World): number | null {
    const selectableEntities = world.componentManager.getEntitiesWithComponents(
      [SelectableComponent]
    );

    for (const entityId of selectableEntities) {
      const selectable = world.componentManager.getComponent(
        entityId,
        SelectableComponent.name
      );
      if (selectable && (selectable as SelectableComponent).isSelected) {
        return entityId;
      }
    }

    return null;
  }

  /**
   * Registers UI controls for a component
   * @param componentName The name of the component
   * @param componentInstance The component instance
   */
  private registerComponentControls(
    componentName: string,
    componentInstance: IComponent
  ): void {
    const properties = getComponentProperties(componentName);

    this.uiManager.registerComponentControls(
      componentName,
      componentInstance,
      properties
    );
  }

  /**
   * Updates the property inspector UI based on the selected entity
   * @param world The ECS world
   * @param _deltaTime The time elapsed since the last update
   */
  public update(world: World, _deltaTime: number): void {
    const currentSelectedEntity = this.findSelectedEntity(world);

    if (currentSelectedEntity !== this.lastSelectedEntity) {
      this.lastSelectedEntity = currentSelectedEntity;
      this.uiManager.clearControls(); // Clear previous inspector content

      if (currentSelectedEntity !== null) {
        this.updateInspectorForEntity(world, currentSelectedEntity);
      }
    }
  }

  /**
   * Updates the inspector UI for a specific entity
   * @param world The ECS world
   * @param entityId The ID of the entity to inspect
   */
  private updateInspectorForEntity(world: World, entityId: number): void {
    const components = world.componentManager.getAllComponentsForEntity(
      entityId
    );

    for (const componentName in components) {
      if (Object.prototype.hasOwnProperty.call(components, componentName)) {
        this.registerComponentControls(
          componentName,
          components[componentName]
        );
      }
    }
  }
}
