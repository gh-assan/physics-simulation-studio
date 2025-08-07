/**
 * Integration layer with existing plugin system
 * Provides backward compatibility and easy migration path
 */

import { ParameterSchemaRegistry, PropertyDescriptor } from './ParameterSchema';
import { ParameterManager, TweakpaneAdapter } from './ParameterManager';
import { ISimulationPlugin } from '../plugin/ISimulationPlugin';
import { IWorld } from '../ecs/IWorld';
import { IStudio } from '../../studio/IStudio';

// Plugin parameter integration
class PluginParameterIntegration {
  private parameterManager: ParameterManager;
  private activePlugin: string | null = null;

  constructor(tweakpane: any) {
    const adapter = new TweakpaneAdapter(tweakpane);
    this.parameterManager = new ParameterManager(adapter);
  }

  // Integration with existing ISimulationPlugin interface
  registerPlugin(plugin: ISimulationPlugin, world: IWorld): void {
    const pluginName = plugin.getName();
    
    // Get parameter panels from plugin (existing method)
    const parameterPanels = plugin.getParameterPanels?.(world) || [];
    
    // Migrate existing parameter panels to new system
    for (const panel of parameterPanels) {
      this.migrateParameterPanel(panel, pluginName);
    }

    // Auto-register components that use @Parameter decorators
    this.autoRegisterPluginComponents(pluginName, world);
  }

  // Migrate existing ParameterPanelComponent to new system
  private migrateParameterPanel(panel: any, pluginId: string): void {
    const componentType = panel.componentType;
    
    // Extract properties by calling registerControls with mock UIManager
    let extractedProperties: any[] = [];
    
    const mockUIManager = {
      registerComponentControls: (_: string, __: any, properties: any[]) => {
        extractedProperties = properties || [];
      },
      createPanel: () => ({}),
      addBinding: () => ({})
    };

    try {
      panel.registerControls(mockUIManager, {});
      
      if (extractedProperties.length > 0) {
        const schema: PropertyDescriptor[] = extractedProperties.map(prop => ({
          key: prop.property,
          label: prop.label,
          type: this.mapLegacyType(prop.type),
          min: prop.min,
          max: prop.max,
          step: prop.step,
          options: prop.options,
          pluginId,
          group: this.inferGroup(prop.property)
        }));

        ParameterSchemaRegistry.register(componentType, schema, pluginId);
        console.log(`✅ Migrated ${extractedProperties.length} parameters for ${componentType}`);
      }
    } catch (error) {
      console.warn(`Could not migrate parameter panel for ${componentType}:`, error);
      
      // Fallback: create minimal schema
      ParameterSchemaRegistry.register(componentType, [], pluginId);
    }
  }

  private mapLegacyType(legacyType: string): PropertyDescriptor['type'] {
    switch (legacyType) {
      case 'number': return 'number';
      case 'text': return 'text';
      case 'boolean': return 'boolean';
      case 'list': return 'select';
      default: return 'text';
    }
  }

  private inferGroup(propertyPath: string): string | undefined {
    const path = propertyPath.toLowerCase();
    
    if (path.includes('gravity') || path.includes('wind') || path.includes('force')) return 'Physics';
    if (path.includes('width') || path.includes('height') || path.includes('size') || path.includes('radius')) return 'Dimensions';
    if (path.includes('color') || path.includes('texture') || path.includes('material')) return 'Appearance';
    if (path.includes('position') || path.includes('rotation') || path.includes('transform')) return 'Transform';
    if (path.includes('velocity') || path.includes('speed') || path.includes('acceleration')) return 'Motion';
    
    return undefined; // Will use 'General'
  }

  // Auto-register components that have @Parameter decorators
  private autoRegisterPluginComponents(pluginId: string, world: IWorld): void {
    // Get all registered component types from the world
    const componentConstructors = world.componentManager.getComponentConstructors();
    
    for (const [componentType] of componentConstructors) {
      const existingSchema = ParameterSchemaRegistry.get(componentType);
      
      if (existingSchema && existingSchema.some(prop => prop.pluginId === pluginId)) {
        console.log(`✅ Found @Parameter decorators for ${componentType} in plugin ${pluginId}`);
      }
    }
  }

  // Switch active plugin
  setActivePlugin(pluginName: string): void {
    this.activePlugin = pluginName;
    this.parameterManager.showOnlyPlugin(pluginName);
  }

  // Show multiple plugins simultaneously
  setActivePlugins(pluginNames: string[]): void {
    this.activePlugin = null;
    this.parameterManager.showMultiplePlugins(pluginNames);
  }

  // Show parameters for selected entity
  showParametersForEntity(entityId: number, world: IWorld): void {
    this.parameterManager.clearAll();
    
    const components = world.componentManager.getAllComponentsForEntity(entityId);
    
    for (const [componentType, component] of Object.entries(components)) {
      // Check if component has schema (either migrated or decorated)
      const schema = ParameterSchemaRegistry.getVisible(componentType);
      
      if (schema.length > 0) {
        this.parameterManager.registerComponent(componentType, component);
      }
    }
  }

  // Show global plugin parameters (when no entity selected)
  showGlobalParameters(): void {
    this.parameterManager.clearAll();
    
    if (!this.activePlugin) return;

    // Get all schemas for active plugin
    const pluginSchemas = ParameterSchemaRegistry.getForPlugin(this.activePlugin);
    
    for (const [componentType] of pluginSchemas) {
      // Create dummy component instance for global parameters
      const dummyComponent = this.createDummyComponent(componentType);
      this.parameterManager.registerComponent(componentType, dummyComponent);
    }
  }

  private createDummyComponent(componentType: string): any {
    const schema = ParameterSchemaRegistry.get(componentType);
    const dummy: any = {};
    
    // Initialize with default values
    for (const prop of schema || []) {
      switch (prop.type) {
        case 'number':
          dummy[prop.key] = prop.min || 0;
          break;
        case 'boolean':
          dummy[prop.key] = false;
          break;
        case 'text':
          dummy[prop.key] = '';
          break;
        default:
          dummy[prop.key] = null;
      }
    }
    
    return dummy;
  }

  // Get current parameter manager for advanced usage
  getParameterManager(): ParameterManager {
    return this.parameterManager;
  }

  // Plugin visibility controls
  getVisiblePlugins(): string[] {
    return this.parameterManager.getVisiblePlugins();
  }

  getAvailablePlugins(): string[] {
    return this.parameterManager.getAvailablePlugins();
  }
}

// Simplified replacement for PropertyInspectorUIManager
export class ModernPropertyInspectorUIManager {
  private integration: PluginParameterIntegration;

  constructor(tweakpane: any) {
    this.integration = new PluginParameterIntegration(tweakpane);
  }

  // Backward compatible interface methods
  registerComponentControls(
    componentTypeKey: string,
    componentInstance: any,
    parameterPanels: any[]
  ): void {
    // Try new system first
    const schema = ParameterSchemaRegistry.getVisible(componentTypeKey);
    
    if (schema.length > 0) {
      this.integration.getParameterManager().registerComponent(componentTypeKey, componentInstance);
      return;
    }

    // Fallback: migrate parameter panels on the fly
    const panel = parameterPanels.find(p => p.componentType === componentTypeKey);
    if (panel) {
      // Migrate and register
      const pluginId = this.inferPluginId(componentTypeKey);
      (this.integration as any).migrateParameterPanel(panel, pluginId);
      this.integration.getParameterManager().registerComponent(componentTypeKey, componentInstance);
    }
  }

  registerParameterPanels(parameterPanels: any[]): void {
    for (const panel of parameterPanels) {
      const pluginId = this.inferPluginId(panel.componentType);
      (this.integration as any).migrateParameterPanel(panel, pluginId);
    }
    
    this.integration.showGlobalParameters();
  }

  clearInspectorControls(): void {
    this.integration.getParameterManager().clearAll();
  }

  // New methods for plugin management
  setActivePlugin(pluginName: string): void {
    this.integration.setActivePlugin(pluginName);
  }

  showParametersForEntity(entityId: number, world: IWorld): void {
    this.integration.showParametersForEntity(entityId, world);
  }

  private inferPluginId(componentType: string): string {
    const lowerType = componentType.toLowerCase();
    
    if (lowerType.includes('flag') || lowerType.includes('pole')) return 'flag-simulation';
    if (lowerType.includes('water') || lowerType.includes('droplet')) return 'water-simulation';
    if (lowerType.includes('solar') || lowerType.includes('celestial')) return 'solar-system';
    
    return 'core';
  }
}

export { PluginParameterIntegration };
