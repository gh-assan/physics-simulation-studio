/**
 * Simplified Plugin-Based Property Inspector System
 * Works directly with plugin parameter definitions - no complex migration layers!
 */

import { System } from "../../core/ecs/System";
import { IWorld } from "../../core/ecs/IWorld";
import { SelectableComponent } from "../../core/components/SelectableComponent";
import { IStudio } from "../IStudio";
import { PluginParameterManager } from "../../core/ui/PluginParameterManager";

export class SimplifiedPropertyInspectorSystem extends System {
  private parameterManager: PluginParameterManager | null = null;
  private studio: IStudio;
  private lastSelectedEntity: number | null = null;
  private lastActiveSimulation: string | null = null;

  constructor(studio: IStudio) {
    super();
    this.studio = studio;
    this.priority = 1000;
  }

  // Initialize with UI renderer
  initialize(uiRenderer: any): void {
    this.parameterManager = new PluginParameterManager(uiRenderer);
    console.log('✅ Simplified Property Inspector System initialized');
  }

  update(world: IWorld, deltaTime: number): void {
    // Find currently selected entity
    const selectedEntity = this.findSelectedEntity(world);

    // If selection changed, update parameters
    if (selectedEntity !== this.lastSelectedEntity) {
      this.updateParametersForEntity(world, selectedEntity);
      this.lastSelectedEntity = selectedEntity;
    }

    // Also check if we should show demo parameters for the active simulation
    this.showDemoParametersForActiveSimulation();
  }

  private findSelectedEntity(world: IWorld): number | null {
    const selectableEntities = world.componentManager.getEntitiesWithComponents([SelectableComponent]);

    for (const entityId of selectableEntities) {
      const selectable = world.componentManager.getComponent(entityId, SelectableComponent.type) as SelectableComponent;
      if (selectable && selectable.isSelected) {
        return entityId;
      }
    }

    return null;
  }

  private updateParametersForEntity(world: IWorld, entityId: number | null): void {
    if (!this.parameterManager) return;

    // Clear previous parameters
    this.parameterManager.clearAll();

    if (entityId === null) {
      console.log('📝 No entity selected - cleared parameters');
      return;
    }

    // Get active plugin
    const activePlugin = this.getActivePlugin();
    if (!activePlugin) {
      console.log('📝 No active plugin - cleared parameters');
      return;
    }

    console.log(`📝 Showing parameters for entity ${entityId} in plugin: ${activePlugin}`);

    // Get all components for this entity
    const components = world.componentManager.getAllComponentsForEntity(entityId);

    // Register parameters for each component
    for (const [componentType, component] of Object.entries(components)) {
      this.registerComponentParametersFromPlugin(activePlugin, componentType, component);
    }
  }

  private registerComponentParametersFromPlugin(pluginName: string, componentType: string, component: any): void {
    if (!this.parameterManager) return;

    try {
      // Get the active plugin instance and its parameter schema
      const pluginManager = this.studio.getPluginManager();
      const plugin = pluginManager.getPlugin(pluginName);
      
      if (!plugin || !plugin.getParameterSchema) {
        console.warn(`Plugin ${pluginName} not found or doesn't support parameters`);
        return;
      }

      // Get parameter schema from the plugin itself
      const parameterSchema = plugin.getParameterSchema();
      const componentParameters = parameterSchema.components.get(componentType);

      if (componentParameters) {
        console.log(`📝 Using plugin-defined parameters for ${componentType}`);
        this.parameterManager.registerComponentParameters(
          pluginName,
          componentType,
          component,
          componentParameters
        );
      } else {
        console.warn(`No parameters defined for component ${componentType} in plugin ${pluginName}`);
      }

    } catch (error) {
      console.warn(`Failed to register parameters for ${componentType}:`, error);
    }
  }

  private getActivePlugin(): string | null {
    try {
      return this.studio.getActiveSimulationName();
    } catch (error) {
      console.warn('Failed to get active plugin name:', error);
      return null;
    }
  }

  private showDemoParametersForActiveSimulation(): void {
    if (!this.parameterManager) return;

    const activePlugin = this.getActivePlugin();

    // If simulation changed, clear parameters and show new ones
    if (activePlugin !== this.lastActiveSimulation) {
      this.parameterManager.clearAll();
      this.lastActiveSimulation = activePlugin;

      if (activePlugin) {
        console.log(`🔄 Simulation changed to: ${activePlugin}`);
        this.showDemoParametersForPlugin(activePlugin);
      }
    }
  }

  private showDemoParametersForPlugin(pluginName: string): void {
    if (!this.parameterManager) return;

    try {
      const pluginManager = this.studio.getPluginManager();
      const plugin = pluginManager.getPlugin(pluginName);
      
      if (!plugin || !plugin.getParameterSchema) {
        console.warn(`Plugin ${pluginName} not found or doesn't support parameters`);
        return;
      }

      const parameterSchema = plugin.getParameterSchema();
      console.log(`🎯 Showing demo parameters for ${pluginName} plugin`);

      // Create demo components for all component types in the plugin
      for (const [componentType, parameterDescriptors] of parameterSchema.components) {
        const demoComponent = this.createDemoComponent(componentType, parameterDescriptors);
        
        this.parameterManager.registerComponentParameters(
          pluginName,
          componentType,
          demoComponent,
          parameterDescriptors
        );
      }

    } catch (error) {
      console.warn(`Failed to show demo parameters for plugin ${pluginName}:`, error);
    }
  }

  private createDemoComponent(componentType: string, parameterDescriptors: any[]): any {
    const demoComponent: any = {};

    // Create default values based on parameter descriptors
    for (const param of parameterDescriptors) {
      switch (param.type) {
        case 'number':
          demoComponent[param.key] = param.min !== undefined ? (param.min + (param.max || param.min + 1)) / 2 : 1.0;
          break;
        case 'boolean':
          demoComponent[param.key] = false;
          break;
        case 'text':
          demoComponent[param.key] = '';
          break;
        case 'color':
          demoComponent[param.key] = '#0077be';
          break;
        case 'vector3':
          demoComponent[param.key] = { x: 0, y: 0, z: 0 };
          break;
        default:
          demoComponent[param.key] = null;
      }
    }

    return demoComponent;
  }

  // Public methods for external control
  clearParameters(): void {
    if (this.parameterManager) {
      this.parameterManager.clearAll();
    }
  }

  switchToPlugin(pluginId: string): void {
    if (this.parameterManager) {
      this.parameterManager.switchToPlugin(pluginId);
    }
  }

  // Force update for current selection
  forceUpdate(world: IWorld): void {
    const selectedEntity = this.findSelectedEntity(world);
    this.updateParametersForEntity(world, selectedEntity);
  }
}

export default SimplifiedPropertyInspectorSystem;
