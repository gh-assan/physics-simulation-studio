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
    window.addEventListener(
      "simulation-loaded",
      this.onSimulationLoaded.bind(this)
    );
  }

  /**
   * Handles simulation-loaded events
   * @param event The simulation-loaded event
   */
  private onSimulationLoaded(event: CustomEvent): void {
    console.log(
      `[PropertyInspectorSystem] Received simulation-loaded event for ${event.detail.simulationName}`
    );
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
      // Use SelectableComponent.type instead of SelectableComponent.name for consistency
      const selectable = world.componentManager.getComponent(
        entityId,
        SelectableComponent.type || SelectableComponent.name
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
    componentTypeKey: string,
    componentInstance: IComponent
  ): void {
    // The componentTypeKey is already the correct type string (e.g., "FlagComponent")
    // as passed from updateInspectorForEntity.
    const registryKey = componentTypeKey;
    const displayName = componentTypeKey;

    // Get properties using the determined registry key
    const properties = getComponentProperties(registryKey);

    // Log whether properties were found
    if (properties) {
      console.log(
        `[PropertyInspectorSystem] Found ${properties.length} properties for component '${displayName}' using key '${registryKey}'`
      );
    } else {
      console.warn(
        `[PropertyInspectorSystem] No properties found for component '${displayName}' using key '${registryKey}'`
      );
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
    const components =
      world.componentManager.getAllComponentsForEntity(entityId);

    // Log the components for debugging
    console.log(
      "[PropertyInspectorSystem] Components for entity",
      entityId,
      ":",
      components
    );

    // Process all components
    for (const componentName in components) {
      if (Object.prototype.hasOwnProperty.call(components, componentName)) {
        const component = components[componentName];
        console.log(
          `[PropertyInspectorSystem] Processing component: '${componentName}' for entity ${entityId}`
        );

        // The componentName here is already the correct type string (e.g., "FlagComponent")
        // as returned by ComponentManager.getAllComponentsForEntity.
        // We can directly use it as the registryKey.
        const registryKey = componentName;
        console.log(
          `[PropertyInspectorSystem] Using registry key '${registryKey}' for component '${componentName}' from getAllComponentsForEntity result.`
        );

        // Register the component controls
        this.registerComponentControls(registryKey, component);
      }
    }
  }
}
