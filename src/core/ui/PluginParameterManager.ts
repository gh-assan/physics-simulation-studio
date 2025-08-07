/**
 * Clean Plugin-Based Parameter System
 * Each plugin defines its own parameters - no central registry needed!
 */

// Simple parameter descriptor type
export interface PluginParameterDescriptor {
  key: string;
  label?: string;
  type?: 'number' | 'text' | 'boolean' | 'select' | 'color' | 'vector3';
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{ label: string; value: any }>;
  group?: string;
  order?: number;
  condition?: (component: any) => boolean;
}

// Plugin parameter schema - defined by each plugin
export interface PluginParameterSchema {
  pluginId: string;
  components: Map<string, PluginParameterDescriptor[]>;
}

// Simple parameter manager that works directly with plugins
export class PluginParameterManager {
  private renderer: any; // UI renderer (Tweakpane)
  private currentPlugin: string | null = null;
  private panels = new Map<string, any>(); // componentType -> panel

  constructor(uiRenderer: any) {
    this.renderer = uiRenderer;
  }

  // Register a component with its parameters from the plugin
  registerComponentParameters(
    pluginId: string,
    componentType: string,
    component: any,
    parameterDescriptors: PluginParameterDescriptor[]
  ): void {
    console.log(`📝 Registering ${componentType} parameters for plugin: ${pluginId}`);

    // Clear existing panel for this component
    this.clearComponent(componentType);

    // Group parameters
    const grouped = this.groupParameters(parameterDescriptors);

    // Render UI
    const panel = this.renderParameterGroup(componentType, component, grouped);

    if (panel) {
      this.panels.set(componentType, panel);
      console.log(`✅ Created parameter panel for ${componentType}`);
    }
  }

  // Simple parameter grouping
  private groupParameters(descriptors: PluginParameterDescriptor[]): Map<string, PluginParameterDescriptor[]> {
    const grouped = new Map<string, PluginParameterDescriptor[]>();

    descriptors
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .forEach(param => {
        const group = param.group || 'General';
        if (!grouped.has(group)) grouped.set(group, []);
        grouped.get(group)!.push(param);
      });

    return grouped;
  }

  // Render parameter groups using the UI framework
  private renderParameterGroup(
    componentType: string,
    component: any,
    grouped: Map<string, PluginParameterDescriptor[]>
  ): any {
    if (!this.renderer) return null;

    try {
      // Create a folder for this component
      const folder = this.renderer.addFolder({ title: componentType.replace('Component', '') });

      // Render each group
      for (const [groupName, parameters] of grouped) {
        if (parameters.length === 0) continue;

        const groupFolder = folder.addFolder({ title: groupName });

        for (const param of parameters) {
          this.renderParameter(groupFolder, component, param);
        }
      }

      return folder;
    } catch (error) {
      console.warn(`Failed to render parameters for ${componentType}:`, error);
      return null;
    }
  }

  // Render individual parameter
  private renderParameter(folder: any, component: any, param: PluginParameterDescriptor): void {
    try {
      // Check condition
      if (param.condition && !param.condition(component)) {
        return; // Skip this parameter
      }

      // Get nested property value
      const value = this.getNestedProperty(component, param.key);
      if (value === undefined) {
        console.warn(`Property ${param.key} not found on component`);
        return;
      }

      // Create binding based on type
      const binding = folder.addBinding(component, param.key, {
        label: param.label || param.key,
        min: param.min,
        max: param.max,
        step: param.step,
        options: param.options
      });

      console.log(`➕ Added parameter: ${param.key}`);
    } catch (error) {
      console.warn(`Failed to render parameter ${param.key}:`, error);
    }
  }

  // Get nested property (e.g., "windDirection.x")
  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  // Clear component panel
  private clearComponent(componentType: string): void {
    const panel = this.panels.get(componentType);
    if (panel) {
      panel.dispose?.();
      this.panels.delete(componentType);
    }
  }

  // Clear all panels
  clearAll(): void {
    for (const panel of this.panels.values()) {
      panel.dispose?.();
    }
    this.panels.clear();
  }

  // Switch to showing only parameters for a specific plugin
  switchToPlugin(pluginId: string): void {
    this.currentPlugin = pluginId;
    console.log(`🔄 Switched to plugin: ${pluginId}`);
  }

  // Get current plugin
  getCurrentPlugin(): string | null {
    return this.currentPlugin;
  }
}

// Export for use in plugins
