import { IPropertyInspectorUIManager } from "../ui/IPropertyInspectorUIManager";
import { System } from "../../core/ecs/System";
import { World } from "../../core/ecs/World";
import { ParameterPanelComponent } from "../../core/components/ParameterPanelComponent";
import { PluginManager } from "../../core/plugin/PluginManager";
import { Studio } from "../Studio";
import { SelectionSystem } from "./SelectionSystem";
import { Logger } from "../../core/utils/Logger";
import { PropertyInspectorUIManager } from "../ui/PropertyInspectorUIManager";
import { ComponentFilter } from "../utils/ComponentFilter";

export class PropertyInspectorSystem extends System {
  private propertyInspectorUIManager: IPropertyInspectorUIManager;
  private lastSelectedEntity: number | null = null;
  private lastActiveSimulationName: string | null = null;
  private world: World;
  private studio: Studio;
  private pluginManager: PluginManager;
  private selectionSystem: SelectionSystem;

  constructor(
    propertyInspectorUIManager: IPropertyInspectorUIManager,
    world: World,
    studio: Studio,
    pluginManager: PluginManager,
    selectionSystem: SelectionSystem
  ) {
    super(500);
    this.propertyInspectorUIManager = propertyInspectorUIManager;
    this.world = world;
    this.studio = studio;
    this.pluginManager = pluginManager;
    this.selectionSystem = selectionSystem;
  }

  /**
   * Gets parameter panels from the active plugin
   * @returns An array of parameter panel components
   */
  private getParameterPanelsFromActivePlugin(): ParameterPanelComponent[] {
    const activeSimulationName = this.studio.getActiveSimulationName();
    console.log(`[PropertyInspectorSystem] Active simulation name: ${activeSimulationName}`);
    
    if (!activeSimulationName) {
      Logger.getInstance().log(
        `[PropertyInspectorSystem] No active simulation.` // Simplified log
      );
      return [];
    }

    const activePlugin = this.pluginManager.getPlugin(activeSimulationName);
    console.log(`[PropertyInspectorSystem] Active plugin:`, activePlugin);
    
    if (!activePlugin) {
      Logger.getInstance().log(
        `[PropertyInspectorSystem] No active plugin for simulation ${activeSimulationName}.` // Simplified log
      );
      return [];
    }

    if (activePlugin.getParameterPanels) {
      const panels = activePlugin.getParameterPanels(this.world);
      console.log(`[PropertyInspectorSystem] Parameter panels from plugin:`, panels);
      Logger.getInstance().log(
        `[PropertyInspectorSystem] Retrieved ${panels.length} parameter panels for ${activeSimulationName}.` // Simplified log
      );
      return panels;
    } else {
      console.log(`[PropertyInspectorSystem] Plugin ${activeSimulationName} does not have getParameterPanels method`);
      Logger.getInstance().log(
        `[PropertyInspectorSystem] Plugin ${activeSimulationName} does not provide parameter panels.` // Simplified log
      );
      return [];
    }
  }

  /**
   * Updates the property inspector UI based on the selected entity
   * @param world The ECS world
   * @param _deltaTime The time elapsed since the last update
   */
  public update(world: World, _deltaTime: number): void {
    console.log(`[PropertyInspectorSystem] update() called`);
    
    const currentSelectedEntity = this.selectionSystem.getSelectedEntity();
    const currentActiveSimulation = this.studio.getActiveSimulationName();

    // Debug logging
    console.log(`[PropertyInspectorSystem] Selected entity: ${currentSelectedEntity}, Active simulation: ${currentActiveSimulation}`);

    // Check if the selected entity has changed OR if the active simulation has changed
    if (
      currentSelectedEntity !== this.lastSelectedEntity ||
      currentActiveSimulation !== this.lastActiveSimulationName
    ) {
      this.lastSelectedEntity = currentSelectedEntity;
      this.lastActiveSimulationName = currentActiveSimulation; // Update last active simulation
      this.propertyInspectorUIManager.clearInspectorControls(); // Clear previous inspector content

      if (currentSelectedEntity !== null) {
        console.log(`[PropertyInspectorSystem] Updating inspector for entity ${currentSelectedEntity}`);
        this.updateInspectorForEntity(world, currentSelectedEntity);
      } else {
        // If no entity is selected, display the parameter panels from the active plugin
        console.log(`[PropertyInspectorSystem] No entity selected, showing parameter panels for simulation: ${currentActiveSimulation}`);
        this.propertyInspectorUIManager.clearInspectorControls(); // Clear previous inspector content
        const parameterPanels = this.getParameterPanelsFromActivePlugin();
        console.log(`[PropertyInspectorSystem] Found ${parameterPanels.length} parameter panels`);
        this.propertyInspectorUIManager.registerParameterPanels(parameterPanels);
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

    // Get parameter panels from the active plugin
    const parameterPanels = this.getParameterPanelsFromActivePlugin();

    // Process all components
    for (const componentName in components) {
      if (Object.prototype.hasOwnProperty.call(components, componentName)) {
        const component = components[componentName];

        // Use ComponentFilter to determine if the component should be skipped from UI
        if (ComponentFilter.shouldSkipFromUI(componentName)) {
          continue;
        }

        // Filter components based on active simulation using ComponentFilter
        const currentActiveSimulation = this.studio.getActiveSimulationName();
        if (!ComponentFilter.matchesActiveSimulation(component, currentActiveSimulation)) {
          continue;
        }

        Logger.getInstance().log(
          `[PropertyInspectorSystem] Processing component: '${componentName}' for entity ${entityId}`
        );

        // The componentName here is already the correct type string (e.g., "FlagComponent")
        // as returned by ComponentManager.getAllComponentsForEntity.
        // We can directly use it as the registryKey.
        const registryKey = componentName;
        Logger.getInstance().log(
          `[PropertyInspectorSystem] Using registry key '${registryKey}' for component '${componentName}' from getAllComponentsForEntity result.`
        );

        // Register the component controls, passing the parameter panels
        this.propertyInspectorUIManager.registerComponentControls(registryKey, component, parameterPanels);
      }
    }
  }
}
