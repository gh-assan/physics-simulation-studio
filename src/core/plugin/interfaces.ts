/**
 * Enhanced Plugin System Interfaces - Phase 3 Implementation
 * Following clean architecture principles with comprehensive lifecycle management
 */

import { ISimulationAlgorithm } from '../simulation/interfaces';

/**
 * Plugin metadata containing versioning, dependencies, and compatibility information
 */
export interface IPluginMetadata {
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly author: string;
  readonly dependencies: readonly string[];
  readonly requiredCoreVersion: string;
  readonly category: PluginCategory;
  readonly tags: readonly string[];
}

/**
 * Plugin categories for organization and filtering
 */
export type PluginCategory = 
  | 'simulation'
  | 'visualization'
  | 'analysis'
  | 'utility'
  | 'experimental';

/**
 * Plugin lifecycle state tracking
 */
export type PluginState = 
  | 'unloaded'
  | 'loading'
  | 'loaded'
  | 'active'
  | 'error'
  | 'unloading';

/**
 * Plugin lifecycle events for state changes and system updates
 */
export interface IPluginLifecycleEvents {
  onLoad(): Promise<void>;
  onUnload(): Promise<void>;
  onActivate(): Promise<void>;
  onDeactivate(): Promise<void>;
  onParameterChanged(parameter: string, value: any): Promise<void>;
  onSimulationStateChanged(state: any): Promise<void>;
}

/**
 * Plugin context providing access to core system services
 */
export interface IPluginContext {
  readonly simulationManager: any; // Will be properly typed later
  readonly parameterManager: any; // Will be properly typed later
  readonly renderManager: any; // Will be properly typed later
  readonly eventBus: any; // Will be properly typed later
}

/**
 * Enhanced plugin interface with metadata and lifecycle support
 */
export interface IPlugin extends Partial<IPluginLifecycleEvents> {
  readonly metadata: IPluginMetadata;
  readonly state: PluginState;
  
  // Core plugin functionality
  initialize(context: IPluginContext): Promise<void>;
  getAlgorithms(): ISimulationAlgorithm[];
  cleanup(): Promise<void>;
}

/**
 * Plugin registry entry for tracking loaded plugins
 */
export interface IPluginRegistryEntry {
  readonly plugin: IPlugin;
  readonly metadata: IPluginMetadata;
  readonly loadedAt: Date;
  readonly context: IPluginContext;
  state: PluginState;
  error?: Error;
}

/**
 * Plugin dependency resolution result
 */
export interface IPluginDependencyResult {
  readonly isValid: boolean;
  readonly missingDependencies: readonly string[];
  readonly conflictingVersions: readonly string[];
  readonly loadOrder: readonly string[];
}

/**
 * Plugin registry for centralized plugin management
 */
export interface IPluginRegistry {
  // Plugin registration
  register(plugin: IPlugin): Promise<void>;
  unregister(pluginName: string): Promise<void>;
  
  // Plugin lifecycle management
  load(pluginName: string): Promise<void>;
  unload(pluginName: string): Promise<void>;
  activate(pluginName: string): Promise<void>;
  deactivate(pluginName: string): Promise<void>;
  
  // Plugin discovery and information
  getPlugin(name: string): IPluginRegistryEntry | undefined;
  getAllPlugins(): readonly IPluginRegistryEntry[];
  getActivePlugins(): readonly IPluginRegistryEntry[];
  getPluginsByCategory(category: PluginCategory): readonly IPluginRegistryEntry[];
  
  // Dependency management
  validateDependencies(pluginName: string): IPluginDependencyResult;
  resolveDependencies(plugins: readonly string[]): readonly string[];
  
  // State queries
  isLoaded(pluginName: string): boolean;
  isActive(pluginName: string): boolean;
  getPluginState(pluginName: string): PluginState;
  
  // Event handling
  onPluginStateChanged(callback: (pluginName: string, state: PluginState) => void): void;
  onPluginError(callback: (pluginName: string, error: Error) => void): void;
}

/**
 * Plugin discovery service for automatic plugin detection
 */
export interface IPluginDiscoveryService {
  // Plugin discovery
  discoverPlugins(): Promise<readonly string[]>;
  scanDirectory(path: string): Promise<readonly string[]>;
  
  // Plugin loading
  loadPlugin(pluginName: string): Promise<IPlugin>;
  loadPluginFromPath(path: string): Promise<IPlugin>;
  
  // Plugin factories
  registerPluginFactory(name: string, factory: () => Promise<IPlugin>): void;
  getAvailablePlugins(): readonly string[];
}

/**
 * Plugin manager orchestrating the entire plugin system
 */
export interface IPluginManager {
  readonly registry: IPluginRegistry;
  readonly discoveryService: IPluginDiscoveryService;
  
  // High-level plugin management
  initializePluginSystem(): Promise<void>;
  loadAllPlugins(): Promise<void>;
  loadPlugin(pluginName: string): Promise<void>;
  unloadPlugin(pluginName: string): Promise<void>;
  reloadPlugin(pluginName: string): Promise<void>;
  
  // Plugin information
  getLoadedPlugins(): readonly string[];
  getPluginInfo(pluginName: string): IPluginMetadata | undefined;
  
  // Event handling
  onPluginStateChanged(callback: (pluginName: string, state: PluginState) => void): void;
  onPluginError(callback: (pluginName: string, error: Error) => void): void;
}
