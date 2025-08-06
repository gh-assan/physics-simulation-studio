import { IPropertyInspectorUIManager } from "../ui/IPropertyInspectorUIManager";
import { System } from "../../core/ecs/System";
import { World } from "../../core/ecs/World";
import { ParameterPanelComponent } from "../../core/components/ParameterPanelComponent";
import { PluginManager } from "../../core/plugin/PluginManager";
import { Studio } from "../Studio";
import { SelectionSystem } from "./SelectionSystem";
import { ComponentFilter } from "../utils/ComponentFilter";

export class PropertyInspectorSystem extends System {
  private propertyInspectorUIManager: IPropertyInspectorUIManager;
  private lastSelectedEntity = -1;
  private lastActiveSimulationName = "";
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
    if (!activeSimulationName) return [];

    const activePlugin = this.pluginManager.getPlugin(activeSimulationName);
    if (!activePlugin || !activePlugin.getParameterPanels) return [];

    return activePlugin.getParameterPanels(this.world);
  }

  /**
   * Updates the property inspector UI based on the selected entity
   * @param world The ECS world
   * @param _deltaTime The time elapsed since the last update
   */
  public update(world: World, _deltaTime: number): void {
    const currentSelectedEntity = this.selectionSystem.getSelectedEntity();
    const currentActiveSimulation = this.studio.getActiveSimulationName();

    // Early return if nothing changed
    if (currentSelectedEntity === this.lastSelectedEntity &&
        currentActiveSimulation === this.lastActiveSimulationName) {
      return;
    }

    this.lastSelectedEntity = currentSelectedEntity;
    this.lastActiveSimulationName = currentActiveSimulation;
    this.propertyInspectorUIManager.clearInspectorControls();

    if (this.selectionSystem.hasSelection()) {
      this.updateInspectorForEntity(world, currentSelectedEntity);
    } else if (currentActiveSimulation) {
      const parameterPanels = this.getParameterPanelsFromActivePlugin();
      this.propertyInspectorUIManager.registerParameterPanels(parameterPanels);
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

        // The componentName here is already the correct type string (e.g., "FlagComponent")
        // as returned by ComponentManager.getAllComponentsForEntity.
        // We can directly use it as the registryKey.
        // Register the component controls, passing the parameter panels
        this.propertyInspectorUIManager.registerComponentControls(componentName, component, parameterPanels);
      }
    }
  }
}
