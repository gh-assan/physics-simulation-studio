/**
 * Framework-agnostic UI  createPanel(title: string): any {
    console.log(`[TweakpaneAdapter] Creating panel: ${title}`);
    const folder = this.tweakpane.addFolder({ title });
    console.log(`[TweakpaneAdapter] Panel created:`, folder);
    return folder;
  }apter for parameter panels
 * Separates UI logic from parameter definitions
 */

import { PropertyDescriptor, ParameterSchemaRegistry } from './ParameterSchema';

// Abstract UI adapter - can be implemented for any UI framework
export abstract class UIAdapter {
  abstract createPanel(title: string): any;
  abstract addNumberControl(panel: any, target: object, key: string, options: any): void;
  abstract addTextControl(panel: any, target: object, key: string, options: any): void;
  abstract addBooleanControl(panel: any, target: object, key: string, options: any): void;
  abstract addSelectControl(panel: any, target: object, key: string, options: any): void;
  abstract addColorControl(panel: any, target: object, key: string, options: any): void;
  abstract addVector3Control(panel: any, target: object, key: string, options: any): void;
  abstract addGroup(panel: any, title: string): any;
  abstract dispose(panel: any): void;
  abstract setVisible(panel: any, visible: boolean): void;
  abstract setEnabled(panel: any, enabled: boolean): void;
}

// Tweakpane implementation
export class TweakpaneAdapter extends UIAdapter {
  constructor(private pane: any) {
    super();
  }

  createPanel(title: string): any {
    return this.pane.addFolder({ title });
  }

  addNumberControl(panel: any, target: object, key: string, options: any): any {
    console.log(`[TweakpaneAdapter] Adding number control: ${key}`, { value: (target as any)[key], options });
    
    const binding = panel.addBinding(target, key, {
      label: options.label || key,
      min: options.min,
      max: options.max,
      step: options.step || 0.01
    });
    
    this.setupControlVisibility(binding, options);
    return binding;
  }

  addTextControl(panel: any, target: object, key: string, options: any): void {
    const binding = panel.addBinding(target, key, {
      label: options.label
    });
    this.setupControlVisibility(binding, options);
  }

  addBooleanControl(panel: any, target: object, key: string, options: any): void {
    const binding = panel.addBinding(target, key, {
      label: options.label
    });
    this.setupControlVisibility(binding, options);
  }

  addSelectControl(panel: any, target: object, key: string, options: any): void {
    const binding = panel.addBinding(target, key, {
      label: options.label,
      options: options.options?.reduce((acc: any, opt: any) => {
        acc[opt.label] = opt.value;
        return acc;
      }, {})
    });
    this.setupControlVisibility(binding, options);
  }

  addColorControl(panel: any, target: object, key: string, options: any): void {
    const binding = panel.addBinding(target, key, {
      label: options.label,
      view: 'color'
    });
    this.setupControlVisibility(binding, options);
  }

  addVector3Control(panel: any, target: object, key: string, options: any): void {
    // For Tweakpane, we can add individual X, Y, Z controls
    const group = this.addGroup(panel, options.label);
    const target_vector = (target as any)[key];
    
    if (target_vector && typeof target_vector === 'object') {
      this.addNumberControl(group, target_vector, 'x', { ...options, label: 'X' });
      this.addNumberControl(group, target_vector, 'y', { ...options, label: 'Y' });
      this.addNumberControl(group, target_vector, 'z', { ...options, label: 'Z' });
    }
  }

  addGroup(panel: any, title: string): any {
    return panel.addFolder({ title });
  }

  dispose(panel: any): void {
    panel.dispose?.();
  }

  setVisible(panel: any, visible: boolean): void {
    if (panel.element) {
      panel.element.style.display = visible ? 'block' : 'none';
    }
  }

  setEnabled(panel: any, enabled: boolean): void {
    if (panel.disabled !== undefined) {
      panel.disabled = !enabled;
    }
  }

  private setupControlVisibility(binding: any, options: any): void {
    if (options.visible === false && binding.element) {
      binding.element.style.display = 'none';
    }
    if (options.enabled === false && binding.controller) {
      binding.controller.viewProps.set('disabled', true);
    }
  }
}

// Unified parameter panel renderer
export class ParameterPanelRenderer {
  constructor(public readonly adapter: UIAdapter) {}

  render(componentType: string, component: object, parentPanel?: any): any {
    const schema = ParameterSchemaRegistry.get(componentType);
    if (!schema) return null;

    const title = this.formatComponentName(componentType);
    const panel = parentPanel || this.adapter.createPanel(title);

    // Group properties
    const groups = ParameterSchemaRegistry.getGrouped(componentType);
    
    for (const [groupName, properties] of groups) {
      const groupPanel = groups.size > 1 
        ? this.adapter.addGroup(panel, groupName)
        : panel;

      for (const prop of properties) {
        this.renderProperty(groupPanel, component, prop);
      }
    }

    return panel;
  }

  private renderProperty(panel: any, target: object, prop: PropertyDescriptor): void {
    const options = {
      label: prop.label || this.formatPropertyName(prop.key as string),
      min: prop.min,
      max: prop.max,
      step: prop.step,
      options: prop.options,
      visible: prop.visible,
      enabled: prop.enabled
    };

    switch (prop.type) {
      case 'number':
        this.adapter.addNumberControl(panel, target, prop.key as string, options);
        break;
      case 'text':
        this.adapter.addTextControl(panel, target, prop.key as string, options);
        break;
      case 'boolean':
        this.adapter.addBooleanControl(panel, target, prop.key as string, options);
        break;
      case 'select':
        this.adapter.addSelectControl(panel, target, prop.key as string, options);
        break;
      case 'color':
        this.adapter.addColorControl(panel, target, prop.key as string, options);
        break;
      case 'vector3':
        this.adapter.addVector3Control(panel, target, prop.key as string, options);
        break;
    }
  }

  private formatComponentName(name: string): string {
    return name.replace(/Component$/, '').replace(/([A-Z])/g, ' $1').trim();
  }

  private formatPropertyName(name: string): string {
    return name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
  }
}

// Plugin parameter manager with visibility controls
export class ParameterManager {
  private panels = new Map<string, any>();
  private pluginPanels = new Map<string, Map<string, any>>(); // pluginId -> componentType -> panel
  private renderer: ParameterPanelRenderer;

  constructor(adapter: UIAdapter) {
    this.renderer = new ParameterPanelRenderer(adapter);
  }

  registerComponent(componentType: string, component: object): any {
    console.log(`[ParameterManager] Registering component: ${componentType}`, component);
    
    this.clearComponent(componentType);
    
    const panel = this.renderer.render(componentType, component);
    console.log(`[ParameterManager] Panel rendered:`, panel);
    
    if (panel) {
      this.panels.set(componentType, panel);
      
      // Also track by plugin
      const schema = ParameterSchemaRegistry.get(componentType);
      if (schema?.[0]?.pluginId) {
        const pluginId = schema[0].pluginId;
        if (!this.pluginPanels.has(pluginId)) {
          this.pluginPanels.set(pluginId, new Map());
        }
        this.pluginPanels.get(pluginId)!.set(componentType, panel);
        console.log(`[ParameterManager] Registered ${componentType} under plugin: ${pluginId}`);
      }
    }
    
    return panel;
  }

  clearComponent(componentType: string): void {
    const panel = this.panels.get(componentType);
    if (panel) {
      this.renderer.adapter.dispose(panel);
      this.panels.delete(componentType);
      
      // Also remove from plugin tracking
      for (const pluginPanels of this.pluginPanels.values()) {
        pluginPanels.delete(componentType);
      }
    }
  }

  clearAll(): void {
    for (const componentType of this.panels.keys()) {
      this.clearComponent(componentType);
    }
  }

  // Plugin visibility controls
  setPluginVisible(pluginId: string, visible: boolean): void {
    ParameterSchemaRegistry.setPluginVisible(pluginId, visible);
    
    const pluginPanels = this.pluginPanels.get(pluginId);
    if (pluginPanels) {
      for (const panel of pluginPanels.values()) {
        this.renderer.adapter.setVisible(panel, visible);
      }
    }
  }

  showOnlyPlugin(pluginId: string): void {
    // Hide all plugins first
    ParameterSchemaRegistry.hideAllPlugins();
    for (const [pid] of this.pluginPanels) {
      if (pid !== pluginId) {
        this.setPluginVisible(pid, false);
      }
    }
    
    // Show the specified plugin
    ParameterSchemaRegistry.setActivePlugin(pluginId);
    this.setPluginVisible(pluginId, true);
  }

  showMultiplePlugins(pluginIds: string[]): void {
    // Hide all plugins first
    ParameterSchemaRegistry.hideAllPlugins();
    
    // Show specified plugins
    for (const pluginId of pluginIds) {
      ParameterSchemaRegistry.addActivePlugin(pluginId);
      this.setPluginVisible(pluginId, true);
    }
  }

  getVisiblePlugins(): string[] {
    return ParameterSchemaRegistry.getActivePlugins();
  }

  getAvailablePlugins(): string[] {
    return Array.from(this.pluginPanels.keys());
  }

  // Re-render components when plugin visibility changes
  refreshVisibility(): void {
    const componentsToRefresh = Array.from(this.panels.keys());
    
    for (const componentType of componentsToRefresh) {
      const schema = ParameterSchemaRegistry.getVisible(componentType);
      const panel = this.panels.get(componentType);
      
      if (schema.length === 0 && panel) {
        // Hide panel if no visible properties
        this.renderer.adapter.setVisible(panel, false);
      } else if (schema.length > 0 && panel) {
        // Show panel if has visible properties
        this.renderer.adapter.setVisible(panel, true);
      }
    }
  }
}
