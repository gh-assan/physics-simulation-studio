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

    // Listen for simulation-loaded events to refresh the UI
    window.addEventListener('simulation-loaded', this.onSimulationLoaded.bind(this));
  }

  /**
   * Handles simulation-loaded events
   * @param event The simulation-loaded event
   */
  private onSimulationLoaded(event: CustomEvent): void {
    console.log(`[PropertyInspectorSystem] Received simulation-loaded event for ${event.detail.simulationName}`);
    // Force a UI refresh by setting lastSelectedEntity to null
    this.lastSelectedEntity = null;
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
    // Try to get properties using the component name first
    let properties = getComponentProperties(componentName);
    let displayName = componentName;

    // If no properties found, try using the instance's type property
    if (!properties && (componentInstance as any).type) {
      const instanceType = (componentInstance as any).type;
      properties = getComponentProperties(instanceType);
      displayName = instanceType;
      console.log(`[PropertyInspectorSystem] Using instance type '${instanceType}' instead of name '${componentName}'`);
    }

    // If still no properties found and the component has a constructor with a type property,
    // try to get properties using the constructor type
    if (!properties && componentInstance.constructor && (componentInstance.constructor as any).type) {
      const constructorType = (componentInstance.constructor as any).type;
      properties = getComponentProperties(constructorType);
      displayName = constructorType;
      console.log(`[PropertyInspectorSystem] Using constructor type '${constructorType}' instead of name '${componentName}'`);
    }

    // Log whether properties were found
    if (properties) {
      console.log(`[PropertyInspectorSystem] Found ${properties.length} properties for component '${displayName}'`);
    } else {
      console.log(`[PropertyInspectorSystem] No properties found for component '${displayName}'`);
    }

    this.uiManager.registerComponentControls(
      displayName,
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

    // Log the components for debugging
    console.log("[PropertyInspectorSystem] Components for entity", entityId, ":", components);

    // First, register components with type property to ensure they appear first
    for (const componentName in components) {
      if (Object.prototype.hasOwnProperty.call(components, componentName)) {
        const component = components[componentName];

        // Check if component has a type property (either directly or via constructor)
        if ((component as any).type || (component.constructor && (component.constructor as any).type)) {
          const registryKey = (component as any).type || (component.constructor as any).type;
          console.log(`[PropertyInspectorSystem] First pass: Using type '${registryKey}' for component '${componentName}'`);

          this.registerComponentControls(
            registryKey,
            component
          );
        }
      }
    }

    // Then register remaining components
    for (const componentName in components) {
      if (Object.prototype.hasOwnProperty.call(components, componentName)) {
        const component = components[componentName];

        // Skip components that were already registered in the first pass
        if ((component as any).type || (component.constructor && (component.constructor as any).type)) {
          continue;
        }

        console.log(`[PropertyInspectorSystem] Second pass: Using name '${componentName}' for component`);

        this.registerComponentControls(
          componentName,
          component
        );
      }
    }
  }
}
