/**
 * Simplified parameter schema system using decorators and reflection
 */

// Type-safe property descriptor
export interface PropertyDescriptor<T = any> {
  key: T extends object ? keyof T : string;
  label?: string;
  type?: 'number' | 'text' | 'boolean' | 'select' | 'color' | 'vector3';
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{ label: string; value: any }>;
  group?: string;
  order?: number;
  visible?: boolean;
  enabled?: boolean;
  pluginId?: string; // Plugin that owns this parameter
  dependencies?: string[]; // Other parameters this depends on
  condition?: (component: any) => boolean; // Conditional visibility
}

// Component schema registry with plugin visibility support
export class ParameterSchemaRegistry {
  private static schemas = new Map<string, PropertyDescriptor[]>();
  private static pluginVisibility = new Map<string, boolean>(); // pluginId -> visible
  private static activePlugins = new Set<string>();

  static register(componentType: string, schema: PropertyDescriptor[], pluginId?: string): void {
    console.log(`[ParameterSchemaRegistry] Registering ${componentType} with ${schema.length} parameters for plugin: ${pluginId || 'core'}`);

    // Set plugin ID on all properties if not already set
    const enhancedSchema = schema.map(prop => ({
      ...prop,
      pluginId: prop.pluginId || pluginId || 'core'
    }));

    this.schemas.set(componentType, enhancedSchema);
    console.log(`[ParameterSchemaRegistry] Registered schema for ${componentType}:`, enhancedSchema);
  }

  static get(componentType: string): PropertyDescriptor[] | undefined {
    return this.schemas.get(componentType);
  }

  static getVisible(componentType: string): PropertyDescriptor[] {
    const schema = this.get(componentType);
    if (!schema) return [];

    return schema.filter(prop => {
      // Check if property is visible
      if (prop.visible === false) return false;

      // Check if plugin is active and visible
      if (prop.pluginId && !this.isPluginVisible(prop.pluginId)) return false;

      return true;
    });
  }

  static getGrouped(componentType: string): Map<string, PropertyDescriptor[]> {
    const schema = this.getVisible(componentType);
    if (!schema.length) return new Map();

    const grouped = new Map<string, PropertyDescriptor[]>();

    schema
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .forEach(prop => {
        const group = prop.group || 'General';
        if (!grouped.has(group)) grouped.set(group, []);
        grouped.get(group)!.push(prop);
      });

    return grouped;
  }

  // Plugin visibility management
  static setPluginVisible(pluginId: string, visible: boolean) {
    this.pluginVisibility.set(pluginId, visible);
  }

  static isPluginVisible(pluginId: string): boolean {
    return this.pluginVisibility.get(pluginId) !== false;
  }

  static setActivePlugin(pluginId: string) {
    this.activePlugins.clear();
    this.activePlugins.add(pluginId);
    this.setPluginVisible(pluginId, true);
  }

  static addActivePlugin(pluginId: string) {
    this.activePlugins.add(pluginId);
    this.setPluginVisible(pluginId, true);
  }

  static removeActivePlugin(pluginId: string) {
    this.activePlugins.delete(pluginId);
    this.setPluginVisible(pluginId, false);
  }

  static getActivePlugins(): string[] {
    return Array.from(this.activePlugins);
  }

  static hideAllPlugins() {
    for (const pluginId of this.pluginVisibility.keys()) {
      this.setPluginVisible(pluginId, false);
    }
    this.activePlugins.clear();
  }

  // Get schema filtered by plugin
  static getForPlugin(pluginId: string): Map<string, PropertyDescriptor[]> {
    const result = new Map<string, PropertyDescriptor[]>();

    for (const [componentType, schema] of this.schemas) {
      const pluginSchema = schema.filter(prop =>
        prop.pluginId === pluginId && this.isPluginVisible(pluginId)
      );

      if (pluginSchema.length > 0) {
        result.set(componentType, pluginSchema);
      }
    }

    return result;
  }
}

// Decorator for automatic schema generation with plugin support
export function Parameter(descriptor: Omit<PropertyDescriptor, 'key'>) {
  return function(target: any, propertyKey: string | symbol, _descriptor?: any) {
    const componentType = target.constructor.name;
    const existing = ParameterSchemaRegistry.get(componentType) || [];

    // Try to infer plugin ID from component type or constructor
    const pluginId = descriptor.pluginId ||
                    target.constructor.pluginId ||
                    inferPluginFromComponentType(componentType);

    ParameterSchemaRegistry.register(componentType, [
      ...existing,
      {
        key: propertyKey as string,
        pluginId,
        ...descriptor
      }
    ], pluginId);

    return _descriptor;
  };
}

// Helper to infer plugin ID from component type
function inferPluginFromComponentType(componentType: string): string | undefined {
  const lowerType = componentType.toLowerCase();

  if (lowerType.includes('flag') || lowerType.includes('pole')) return 'flag-simulation';
  if (lowerType.includes('water') || lowerType.includes('droplet')) return 'water-simulation';
  if (lowerType.includes('solar') || lowerType.includes('celestial')) return 'solar-system';
  if (lowerType.includes('rigid') || lowerType.includes('physics')) return 'rigid-body-physics';

  return undefined; // Core component
}

// Utility for inferring types from components
export class SchemaInference {
  static infer<T extends object>(component: T): PropertyDescriptor[] {
    const schema: PropertyDescriptor[] = [];

    for (const [key, value] of Object.entries(component)) {
      if (this.isParameterizable(value)) {
        schema.push({
          key: key,
          label: this.generateLabel(key),
          type: this.inferType(value),
          ...this.inferConstraints(value)
        });
      }
    }

    return schema;
  }

  private static isParameterizable(value: any): boolean {
    return typeof value === 'number' ||
           typeof value === 'string' ||
           typeof value === 'boolean' ||
           (typeof value === 'object' && value?.value !== undefined);
  }

  private static generateLabel(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  private static inferType(value: any): PropertyDescriptor['type'] {
    if (typeof value === 'number') return 'number';
    if (typeof value === 'string') return 'text';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value?.value === 'number') return 'number';
    return 'text';
  }

  private static inferConstraints(value: any): Partial<PropertyDescriptor> {
    if (typeof value === 'object' && value) {
      return {
        min: value.min,
        max: value.max,
        step: value.step
      };
    }
    return {};
  }
}
