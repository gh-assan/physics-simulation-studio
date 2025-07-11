import { System } from "../../core/ecs/System";
import { World } from "../../core/ecs/World";
import { UIManager } from "../uiManager";
import { SelectableComponent } from "../../core/components/SelectableComponent";
import { IComponent } from "../../core/ecs/IComponent";
import { getComponentProperties } from "../utils/ComponentPropertyRegistry";
import "../utils/ComponentPropertyDefinitions"; // Import to ensure component properties are registered
import { ParameterPanelComponent } from "../../core/components/ParameterPanelComponent";
import { PluginManager } from "../../core/plugin/PluginManager";
import { Studio } from "../Studio";

export class PropertyInspectorSystem extends System {
  private uiManager: UIManager;
  private lastSelectedEntity: number | null = null;
  private activeSimulationName: string | null = null;
  private lastActiveSimulationName: string | null = null;
  private world: World;
  private studio: Studio;
  private pluginManager: PluginManager;

  constructor(uiManager: UIManager, world: World, studio: Studio, pluginManager: PluginManager) {
    super();
    this.uiManager = uiManager;
    this.world = world;
    this.studio = studio;
    this.pluginManager = pluginManager;

    // Listen for simulation-loaded events to refresh the UI
    window.addEventListener(
      "simulation-loaded",
      this.onSimulationLoaded.bind(this) as EventListener
    );

    // Listen for simulation-play and simulation-pause events
    window.addEventListener(
      "simulation-play",
      this.onSimulationPlayPause.bind(this) as EventListener
    );
    window.addEventListener(
      "simulation-pause",
      this.onSimulationPlayPause.bind(this) as EventListener
    );
  }

  /**
   * Handles simulation-play and simulation-pause events
   * @param event The simulation-play or simulation-pause event
   */
  private onSimulationPlayPause(event: CustomEvent): void {
    console.log(
      `[PropertyInspectorSystem] Received ${event.type} event for ${event.detail.simulationName}`
    );

    // Update the active simulation name from the event
    this.activeSimulationName = event.detail.simulationName;

    // Force a UI refresh by setting lastSelectedEntity to null
    this.lastSelectedEntity = null;

    // Update the UI immediately
    const currentSelectedEntity = this.findSelectedEntity(this.world);
    if (currentSelectedEntity !== null) {
      this.uiManager.clearControls(); // Clear previous inspector content
      this.updateInspectorForEntity(this.world, currentSelectedEntity);
    }
  }

  /**
   * Handles simulation-loaded events
   * @param event The simulation-loaded event
   */
  private onSimulationLoaded(event: CustomEvent): void {
    console.log(
      `[PropertyInspectorSystem] Received simulation-loaded event for ${event.detail.simulationName}`
    );
    // Store the active simulation name
    this.activeSimulationName = event.detail.simulationName;
    // Force a UI refresh by setting lastSelectedEntity to null
    this.lastSelectedEntity = null;

    // Deselect all currently selected entities to force a fresh selection
    const selectableEntities =
      this.world.componentManager.getEntitiesWithComponents([
        SelectableComponent
      ]);
    for (const entityId of selectableEntities) {
      const selectable = this.world.componentManager.getComponent(
        entityId,
        SelectableComponent.type
      ) as SelectableComponent;
      if (selectable && selectable.isSelected) {
        selectable.isSelected = false;
        console.log(`[PropertyInspectorSystem] Deselected entity ${entityId}`);
      }
    }
  }

  /**
   * Gets parameter panels from the active plugin
   * @returns An array of parameter panel components
   */
  private getParameterPanelsFromActivePlugin(): ParameterPanelComponent[] {
    const activeSimulationName = this.studio.getActiveSimulationName();
    if (!activeSimulationName) {
      console.log(`[PropertyInspectorSystem] No active simulation, returning empty parameter panels array`);
      return [];
    }

    const activePlugin = this.pluginManager.getPlugin(activeSimulationName);
    if (!activePlugin) {
      console.log(`[PropertyInspectorSystem] No active plugin found for simulation ${activeSimulationName}, returning empty parameter panels array`);
      return [];
    }

    if (activePlugin.getParameterPanels) {
      const panels = activePlugin.getParameterPanels();
      console.log(`[PropertyInspectorSystem] Got ${panels.length} parameter panels from active plugin ${activeSimulationName}`);
      return panels;
    } else {
      console.log(`[PropertyInspectorSystem] Active plugin ${activeSimulationName} does not implement getParameterPanels, returning empty parameter panels array`);
      return [];
    }
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
   * @param parameterPanels Optional array of parameter panel components
   */
  private registerComponentControls(
    componentTypeKey: string,
    componentInstance: IComponent,
    parameterPanels: ParameterPanelComponent[]
  ): void {
    // The componentTypeKey is already the correct type string (e.g., "FlagComponent")
    // as passed from updateInspectorForEntity.
    const registryKey = componentTypeKey;
    const displayName = componentTypeKey;

    // First, try to find a parameter panel component for this component type
    const parameterPanel = parameterPanels.find(
      panel => panel.componentType === componentTypeKey
    );

    if (parameterPanel) {
      // If a parameter panel component is found, use it to register UI controls
      console.log(
        `[PropertyInspectorSystem] Using parameter panel for component '${displayName}'`
      );
      parameterPanel.registerControls(this.uiManager, componentInstance);
    } else {
      // Fall back to the old approach if no parameter panel component is found
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
  }

  /**
   * Updates the property inspector UI based on the selected entity
   * @param world The ECS world
   * @param _deltaTime The time elapsed since the last update
   */
  public update(world: World, _deltaTime: number): void {
    const currentSelectedEntity = this.findSelectedEntity(world);
    const currentActiveSimulation = this.studio.getActiveSimulationName();

    // Debugging logs to verify the selected entity and active simulation
    console.log("[PropertyInspectorSystem] Current selected entity:", currentSelectedEntity);
    console.log("[PropertyInspectorSystem] Current active simulation:", currentActiveSimulation);

    // Check if the selected entity has changed OR if the active simulation has changed
    if (
      currentSelectedEntity !== this.lastSelectedEntity ||
      currentActiveSimulation !== this.lastActiveSimulationName
    ) {
      this.lastSelectedEntity = currentSelectedEntity;
      this.lastActiveSimulationName = currentActiveSimulation; // Update last active simulation
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

    // Get parameter panels from the active plugin
    const parameterPanels = this.getParameterPanelsFromActivePlugin();
    console.log(
      `[PropertyInspectorSystem] Got ${parameterPanels.length} parameter panels from active plugin`
    );

    // Process all components
    for (const componentName in components) {
      if (Object.prototype.hasOwnProperty.call(components, componentName)) {
        const component = components[componentName];

        // Filter components based on active simulation
        // Only filter if both active simulation and component.simulationType are defined
        const currentActiveSimulation = this.studio.getActiveSimulationName();
        if (currentActiveSimulation && component.simulationType) {
          if (component.simulationType !== currentActiveSimulation) {
            console.log(
              `[PropertyInspectorSystem] Skipping component '${componentName}' (simulationType: ${component.simulationType}) as it does not match active simulation '${currentActiveSimulation}'`
            );
            continue; // Skip components that don't belong to the active simulation
          }
        }

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

        // Register the component controls, passing the parameter panels
        this.registerComponentControls(registryKey, component, parameterPanels);
      }
    }
  }
}
