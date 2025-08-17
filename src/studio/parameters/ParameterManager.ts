import {
  IParameterManager,
  IParameterDefinition
} from '../../core/simulation/interfaces';

/**
 * Parameter Manager - Clean Parameter System
 *
 * This manager handles all parameter definitions, validation, and updates
 * with clear separation between physics and visual parameters.
 */
export class ParameterManager implements IParameterManager {
  private static instance: ParameterManager;

  private parameterDefinitions: Map<string, Map<string, IParameterDefinition>> = new Map();
  private parameterValues: Map<string, Map<string, any>> = new Map();
  private listeners: Map<string, ((algorithmName: string, paramName: string, value: any) => void)[]> = new Map();

  /**
   * Get singleton instance
   */
  static getInstance(): ParameterManager {
    if (!ParameterManager.instance) {
      ParameterManager.instance = new ParameterManager();
    }
    return ParameterManager.instance;
  }

  /**
   * Register parameter definition for an algorithm
   */
  registerParameter(algorithmName: string, parameter: IParameterDefinition): void {
    this.validateParameterDefinition(parameter);

    this.ensureAlgorithmMaps(algorithmName);

    const algorithmParams = this.parameterDefinitions.get(algorithmName)!;
    algorithmParams.set(parameter.name, parameter);

    // Set default value
    const algorithmValues = this.parameterValues.get(algorithmName)!;
    algorithmValues.set(parameter.name, parameter.defaultValue);
  }

  /**
   * Register multiple parameters for an algorithm
   */
  registerParameters(algorithmName: string, parameters: IParameterDefinition[]): void {
    for (const parameter of parameters) {
      this.registerParameter(algorithmName, parameter);
    }
  }

  /**
   * Unregister all parameters for an algorithm
   */
  unregisterParameters(algorithmName: string): void {
    const paramCount = this.parameterDefinitions.get(algorithmName)?.size || 0;

    this.parameterDefinitions.delete(algorithmName);
    this.parameterValues.delete(algorithmName);
    this.listeners.delete(algorithmName);
  }

  /**
   * Get parameter definition
   */
  getParameter(algorithmName: string, paramName: string): IParameterDefinition | undefined {
    return this.parameterDefinitions.get(algorithmName)?.get(paramName);
  }

  /**
   * Get all parameter definitions for an algorithm
   */
  getParameters(algorithmName: string): IParameterDefinition[] {
    const algorithmParams = this.parameterDefinitions.get(algorithmName);
    return algorithmParams ? Array.from(algorithmParams.values()) : [];
  }

  /**
   * Get all parameters grouped by category
   */
  getParametersByCategory(algorithmName: string): Map<string, IParameterDefinition[]> {
    const parameters = this.getParameters(algorithmName);
    const categorized = new Map<string, IParameterDefinition[]>();

    for (const param of parameters) {
      const category = param.category;
      const categoryParams = categorized.get(category) || [];
      categoryParams.push(param);
      categorized.set(category, categoryParams);
    }

    return categorized;
  }

  /**
   * Validate parameter value
   */
  validateParameter(algorithmName: string, paramName: string, value: any): true | string {
    const definition = this.getParameter(algorithmName, paramName);

    if (!definition) {
      return `Parameter ${paramName} not found for algorithm ${algorithmName}`;
    }

    return this.validateAgainstDefinition(definition, value);
  }

  /**
   * Set parameter value with validation
   */
  setParameter(algorithmName: string, paramName: string, value: any): void {
    const validation = this.validateParameter(algorithmName, paramName, value);

    if (validation !== true) {
      throw new Error(`Invalid parameter value: ${validation}`);
    }

    this.updateParameterValue(algorithmName, paramName, value);
    this.notifyParameterChange(algorithmName, paramName, value);
  }

  /**
   * Get parameter value
   */
  getParameterValue(algorithmName: string, paramName: string): any {
    return this.parameterValues.get(algorithmName)?.get(paramName);
  }

  /**
   * Get all parameter values for an algorithm
   */
  getParameterValues(algorithmName: string): Record<string, any> {
    const algorithmValues = this.parameterValues.get(algorithmName);
    if (!algorithmValues) return {};

    // Convert Map to object for Node.js 8 compatibility
    const result: Record<string, any> = {};
    for (const [key, value] of algorithmValues) {
      result[key] = value;
    }
    return result;
  }

  /**
   * Reset parameter to default value
   */
  resetParameter(algorithmName: string, paramName: string): void {
    const definition = this.getParameter(algorithmName, paramName);

    if (!definition) {
      console.warn(`⚠️ Cannot reset unknown parameter: ${algorithmName}.${paramName}`);
      return;
    }

    this.setParameter(algorithmName, paramName, definition.defaultValue);
  }

  /**
   * Reset all parameters for algorithm to defaults
   */
  resetParameters(algorithmName: string): void {
    const parameters = this.getParameters(algorithmName);

    for (const param of parameters) {
      this.resetParameter(algorithmName, param.name);
    }
  }

  /**
   * Add parameter change listener
   */
  addParameterChangeListener(
    algorithmName: string,
    listener: (algorithmName: string, paramName: string, value: any) => void
  ): void {
    const algorithmListeners = this.listeners.get(algorithmName) || [];
    algorithmListeners.push(listener);
    this.listeners.set(algorithmName, algorithmListeners);
  }

  /**
   * Remove parameter change listener
   */
  removeParameterChangeListener(
    algorithmName: string,
    listener: (algorithmName: string, paramName: string, value: any) => void
  ): void {
    const algorithmListeners = this.listeners.get(algorithmName) || [];
    const index = algorithmListeners.indexOf(listener);

    if (index !== -1) {
      algorithmListeners.splice(index, 1);
    }
  }

  /**
   * Get parameter statistics
   */
  getStats(): {
    algorithmCount: number;
    totalParameters: number;
    parametersByCategory: Record<string, number>;
  } {
    const stats = {
      algorithmCount: this.parameterDefinitions.size,
      totalParameters: 0,
      parametersByCategory: {} as Record<string, number>
    };

    for (const algorithmParams of this.parameterDefinitions.values()) {
      stats.totalParameters += algorithmParams.size;

      for (const param of algorithmParams.values()) {
        const category = param.category;
        stats.parametersByCategory[category] = (stats.parametersByCategory[category] || 0) + 1;
      }
    }

    return stats;
  }

  // Private methods - clean, single-responsibility implementations

  private validateParameterDefinition(parameter: IParameterDefinition): void {
    if (!parameter.name?.trim()) {
      throw new Error('Parameter must have a valid name');
    }

    if (!parameter.type) {
      throw new Error('Parameter must have a valid type');
    }

    if (!parameter.category) {
      throw new Error('Parameter must have a valid category');
    }

    if (parameter.defaultValue === undefined || parameter.defaultValue === null) {
      throw new Error('Parameter must have a default value');
    }
  }

  private ensureAlgorithmMaps(algorithmName: string): void {
    if (!this.parameterDefinitions.has(algorithmName)) {
      this.parameterDefinitions.set(algorithmName, new Map());
    }

    if (!this.parameterValues.has(algorithmName)) {
      this.parameterValues.set(algorithmName, new Map());
    }

    if (!this.listeners.has(algorithmName)) {
      this.listeners.set(algorithmName, []);
    }
  }

  private validateAgainstDefinition(definition: IParameterDefinition, value: any): true | string {
    // Type validation
    const typeValidation = this.validateType(definition, value);
    if (typeValidation !== true) {
      return typeValidation;
    }

    // Constraint validation
    const constraintValidation = this.validateConstraints(definition, value);
    if (constraintValidation !== true) {
      return constraintValidation;
    }

    return true;
  }

  private validateType(definition: IParameterDefinition, value: any): true | string {
    switch (definition.type) {
      case 'number':
        return typeof value === 'number' && !isNaN(value) ? true : 'Value must be a valid number';

      case 'boolean':
        return typeof value === 'boolean' ? true : 'Value must be a boolean';

      case 'vector':
        return this.validateVector(value);

      case 'color':
        return this.validateColor(value);

      case 'enum':
        return this.validateEnum(definition, value);

      default:
        return `Unknown parameter type: ${definition.type}`;
    }
  }

  private validateVector(value: any): true | string {
    if (!value || typeof value !== 'object') {
      return 'Vector must be an object';
    }

    const required = ['x', 'y', 'z'];
    for (const prop of required) {
      if (typeof value[prop] !== 'number' || isNaN(value[prop])) {
        return `Vector.${prop} must be a valid number`;
      }
    }

    return true;
  }

  private validateColor(value: any): true | string {
    if (typeof value === 'string') {
      // Basic hex color validation
      return /^#[0-9A-Fa-f]{6}$/.test(value) ? true : 'Color must be a valid hex string (#RRGGBB)';
    }

    if (typeof value === 'number') {
      return value >= 0 && value <= 0xFFFFFF ? true : 'Color number must be between 0 and 0xFFFFFF';
    }

    return 'Color must be a hex string or number';
  }

  private validateEnum(definition: IParameterDefinition, value: any): true | string {
    const options = definition.constraints?.options;

    if (!options) {
      return 'Enum parameter must define options';
    }

    return options.includes(value) ? true : `Value must be one of: ${options.join(', ')}`;
  }

  private validateConstraints(definition: IParameterDefinition, value: any): true | string {
    const constraints = definition.constraints;

    if (!constraints) {
      return true;
    }

    if (definition.type === 'number' && typeof value === 'number') {
      if (constraints.min !== undefined && value < constraints.min) {
        return `Value must be >= ${constraints.min}`;
      }

      if (constraints.max !== undefined && value > constraints.max) {
        return `Value must be <= ${constraints.max}`;
      }
    }

    return true;
  }

  private updateParameterValue(algorithmName: string, paramName: string, value: any): void {
    const algorithmValues = this.parameterValues.get(algorithmName);

    if (algorithmValues) {
      // Track history if enabled
      if (this.historyEnabled) {
        const oldValue = algorithmValues.get(paramName);
        if (oldValue !== value) {
          this.addToHistory(algorithmName, paramName, oldValue, value);
        }
      }

      algorithmValues.set(paramName, value);
    }
  }

  private notifyParameterChange(algorithmName: string, paramName: string, value: any): void {
    const algorithmListeners = this.listeners.get(algorithmName) || [];

    for (const listener of algorithmListeners) {
      this.safelyNotifyListener(listener, algorithmName, paramName, value);
    }
  }

  private safelyNotifyListener(
    listener: (algorithmName: string, paramName: string, value: any) => void,
    algorithmName: string,
    paramName: string,
    value: any
  ): void {
    try {
      listener(algorithmName, paramName, value);
    } catch (error) {
      console.error(`Error in parameter change listener for ${algorithmName}.${paramName}:`, error);
    }
  }

  /**
   * UI Integration Methods - Sprint 3
   */

  /**
   * Get parameter schemas organized by category for UI creation
   */
  getSchemasByCategory(algorithmName: string): IParameterDefinition[] {
    return this.getParameters(algorithmName);
  }

  /**
   * Update parameter value with UI integration
   */
  updateParameter(parameterKey: string, value: any): void {
    const [algorithmName, paramName] = parameterKey.split('.');
    if (!algorithmName || !paramName) {
      throw new Error(`Invalid parameter key format: ${parameterKey}. Expected: 'algorithm.parameter'`);
    }

    this.setParameter(algorithmName, paramName, value);
  }

  /**
   * Set global state dispatch for integration with state management
   */
  setGlobalStateDispatch(dispatch: (action: any) => void): void {
    this.globalStateDispatch = dispatch;
  }

  /**
   * Parameter History Management
   */
  enableParameterHistory(): void {
    this.historyEnabled = true;
    this.parameterHistory = [];
    this.historyIndex = -1;
  }

  /**
   * Undo last parameter change
   */
  undoLastParameterChange(): void {
    if (!this.historyEnabled || this.historyIndex < 0) return;

    const historyEntry = this.parameterHistory[this.historyIndex];
    this.historyIndex--;

    // Apply previous value without adding to history
    this.updateParameterValue(historyEntry.algorithmName, historyEntry.paramName, historyEntry.oldValue);
    this.notifyParameterChange(historyEntry.algorithmName, historyEntry.paramName, historyEntry.oldValue);
  }

  /**
   * Redo last parameter change
   */
  redoLastParameterChange(): void {
    if (!this.historyEnabled || this.historyIndex >= this.parameterHistory.length - 1) return;

    this.historyIndex++;
    const historyEntry = this.parameterHistory[this.historyIndex];

    // Apply new value without adding to history
    this.updateParameterValue(historyEntry.algorithmName, historyEntry.paramName, historyEntry.newValue);
    this.notifyParameterChange(historyEntry.algorithmName, historyEntry.paramName, historyEntry.newValue);
  }

  /**
   * Add parameter change to history
   */
  private addToHistory(algorithmName: string, paramName: string, oldValue: any, newValue: any): void {
    // Remove any history beyond current index (for redo functionality)
    this.parameterHistory = this.parameterHistory.slice(0, this.historyIndex + 1);

    // Add new history entry
    this.parameterHistory.push({
      algorithmName,
      paramName,
      oldValue,
      newValue,
      timestamp: Date.now()
    });

    this.historyIndex++;

    // Limit history size to prevent memory issues
    const maxHistorySize = 50;
    if (this.parameterHistory.length > maxHistorySize) {
      this.parameterHistory = this.parameterHistory.slice(-maxHistorySize);
      this.historyIndex = this.parameterHistory.length - 1;
    }
  }

  private globalStateDispatch?: (action: any) => void;
  private historyEnabled = false;
  private parameterHistory: Array<{
    algorithmName: string;
    paramName: string;
    oldValue: any;
    newValue: any;
    timestamp: number;
  }> = [];
  private historyIndex = -1;
}
