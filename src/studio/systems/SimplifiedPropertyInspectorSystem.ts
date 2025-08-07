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
      // Get the active plugin instance
      const activePlugin = this.getActivePlugin();
      if (!activePlugin) return;

      // Get all registered plugins (since IStudio doesn't have getPluginManager, we need another approach)
      // For now, let's use a direct plugin lookup approach

      // Check if this is a plugin we know about and handle it directly
      if (activePlugin === 'flag-simulation' && componentType === 'FlagComponent') {
        this.registerFlagComponentParameters(component);
      } else if (activePlugin === 'water-simulation' && (componentType === 'WaterDropletComponent' || componentType === 'WaterBodyComponent')) {
        this.registerWaterComponentParameters(componentType, component);
      }

    } catch (error) {
      console.warn(`Failed to register parameters for ${componentType}:`, error);
    }
  }

  // Register flag component parameters directly
  private registerFlagComponentParameters(component: any): void {
    if (!this.parameterManager) return;

    const flagParameters = [
      { key: 'width', label: 'Flag Width', type: 'number' as const, min: 0.1, max: 10, step: 0.1, group: 'Dimensions', order: 1 },
      { key: 'height', label: 'Flag Height', type: 'number' as const, min: 0.1, max: 10, step: 0.1, group: 'Dimensions', order: 2 },
      { key: 'stiffness', label: 'Stiffness', type: 'number' as const, min: 0.1, max: 1, step: 0.01, group: 'Physics', order: 10 },
      { key: 'damping', label: 'Damping', type: 'number' as const, min: 0.01, max: 1, step: 0.01, group: 'Physics', order: 11 },
      { key: 'windStrength', label: 'Wind Strength', type: 'number' as const, min: 0, max: 10, step: 0.1, group: 'Environment', order: 20 },
      { key: 'textureUrl', label: 'Texture URL', type: 'text' as const, group: 'Appearance', order: 30 }
    ];

    this.parameterManager.registerComponentParameters(
      'flag-simulation',
      'FlagComponent',
      component,
      flagParameters
    );
  }

  // Register water component parameters directly
  private registerWaterComponentParameters(componentType: string, component: any): void {
    if (!this.parameterManager) return;

    let parameters: any[] = [];

    if (componentType === 'WaterDropletComponent') {
      parameters = [
        { key: 'radius', label: 'Radius', type: 'number' as const, min: 0.01, max: 1, step: 0.01, group: 'Size', order: 1 },
        { key: 'mass', label: 'Mass', type: 'number' as const, min: 0.1, max: 10, step: 0.1, group: 'Physics', order: 2 },
        { key: 'enableSPH', label: 'Enable SPH', type: 'boolean' as const, group: 'Advanced Physics', order: 10 },
        { key: 'color', label: 'Color', type: 'color' as const, group: 'Appearance', order: 20 }
      ];
    } else if (componentType === 'WaterBodyComponent') {
      parameters = [
        { key: 'viscosity', label: 'Viscosity', type: 'number' as const, min: 0, max: 1, step: 0.01, group: 'Physics', order: 1 },
        { key: 'surfaceTension', label: 'Surface Tension', type: 'number' as const, min: 0, max: 1, step: 0.01, group: 'Physics', order: 2 },
        { key: 'density', label: 'Density', type: 'number' as const, min: 0.1, max: 10, step: 0.1, group: 'Physics', order: 3 }
      ];
    }

    if (parameters.length > 0) {
      this.parameterManager.registerComponentParameters(
        'water-simulation',
        componentType,
        component,
        parameters
      );
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

        if (activePlugin === 'flag-simulation') {
          this.showFlagDemoParameters();
        } else if (activePlugin === 'water-simulation') {
          this.showWaterDemoParameters();
        }
      }
    }
  }

  private showFlagDemoParameters(): void {
    if (!this.parameterManager) return;

    console.log('🎯 Showing flag simulation demo parameters');

    // Create a demo flag component with default values
    const demoFlagComponent = {
      width: 2.0,
      height: 1.5,
      stiffness: 0.8,
      damping: 0.1,
      windStrength: 3.0,
      textureUrl: ''
    };

    this.registerFlagComponentParameters(demoFlagComponent);
  }

  private showWaterDemoParameters(): void {
    if (!this.parameterManager) return;

    console.log('🎯 Showing water simulation demo parameters');

    // Create demo water components with default values
    const demoWaterDropletComponent = {
      radius: 0.1,
      mass: 1.0,
      enableSPH: true,
      color: '#0077be'
    };

    const demoWaterBodyComponent = {
      viscosity: 0.01,
      surfaceTension: 0.072,
      density: 1000
    };

    this.registerWaterComponentParameters('WaterDropletComponent', demoWaterDropletComponent);
    this.registerWaterComponentParameters('WaterBodyComponent', demoWaterBodyComponent);
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
