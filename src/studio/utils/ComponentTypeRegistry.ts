/**
 * Registry for component type handlers, eliminating if-else chains
 */
export class ComponentTypeRegistry {
  private pluginMappings = new Map<string, string>([
    ['Flag', 'flag-simulation'],
    ['Pole', 'flag-simulation'],
    ['Water', 'water-simulation'],
    ['Solar', 'solar-system'],
    ['Celestial', 'solar-system']
  ]);

  private priorityMappings = new Map<string, number>([
    ['Flag', 10],
    ['Water', 10],
    ['Pole', 20],
    ['Body', 20]
  ]);

  /**
   * Get plugin name for a component type
   */
  public getPluginName(componentType: string): string {
    for (const [key, plugin] of this.pluginMappings) {
      if (componentType.includes(key)) {
        return plugin;
      }
    }

    // For unknown types, try to infer from component type naming convention
    // e.g., "MyPluginComponent" -> "my-plugin"
    const match = componentType.match(/^(\w+?)(?:Component|Panel)?$/);
    if (match) {
      return match[1].toLowerCase().replace(/([A-Z])/g, '-$1').replace(/^-/, '');
    }

    return 'unknown';
  }

  /**
   * Get priority for a component type
   */
  public getPriority(componentType: string): number {
    for (const [key, priority] of this.priorityMappings) {
      if (componentType.includes(key)) {
        return priority;
      }
    }

    return 30; // Default priority
  }

  /**
   * Register a new component type mapping
   */
  public registerComponentType(componentKey: string, pluginName: string, priority = 30): void {
    this.pluginMappings.set(componentKey, pluginName);
    this.priorityMappings.set(componentKey, priority);
  }

  /**
   * Check if component type is registered
   */
  public isRegistered(componentType: string): boolean {
    return Array.from(this.pluginMappings.keys()).some(key =>
      componentType.includes(key)
    );
  }
}
