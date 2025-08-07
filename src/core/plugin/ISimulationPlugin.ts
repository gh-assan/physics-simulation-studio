import { IStudio } from "../../studio/IStudio";

import { ParameterPanelComponent } from "../components/ParameterPanelComponent";
import { IWorld } from "../ecs/IWorld";
import { ISystem } from "../ecs/ISystem";
import { PluginParameterSchema } from "../ui/PluginParameterManager";

/**
 * Interface for simulation plugins.
 * Plugins extend the functionality of the simulation studio by providing
 * new components, systems, and behaviors.
 */
export interface ISimulationPlugin {
  /**
   * Gets a unique, machine-readable name for the plugin.
   * Used for dependency resolution and identification.
   *
   * @example "rigid-body-physics-rapier"
   * @returns The plugin name
   */
  getName(): string;

  /**
   * Gets an array of plugin names that this plugin depends on.
   * The PluginManager will ensure these are registered and activated before this plugin.
   *
   * @example ["core-math-utils"]
   * @returns An array of plugin names
   */
  getDependencies(): string[];

  /**
   * Called by the PluginManager to initialize the plugin.
   * This is where the plugin registers its components.
   *
   * @param world The central ECS World instance
   */
  register(world: IWorld): void;

  /**
   * Called by the PluginManager when the plugin is being unloaded.
   * This method should clean up all resources created by the plugin.
   */
  unregister(): void;

  /**
   * Initializes the entities required by the plugin.
   * This is called after the plugin is registered to set up the initial state.
   *
   * @param world The central ECS World instance
   */
  initializeEntities(world: IWorld): void;

  /**
   * Gets the systems provided by this plugin.
   * @param studio The studio instance, providing context like the graphics manager.
   * @returns An array of system instances
   */
  getSystems(studio: IStudio): ISystem[];

  /**
   * Gets the custom renderer for this plugin, if any.
   * This is optional and only needed for plugins that provide their own rendering.
   *
   * @returns The custom renderer instance, or undefined if not provided
   */
  getRenderer?(): any;

  /**
   * Gets the version of the plugin.
   * This is optional but recommended for versioning and compatibility checks.
   *
   * @returns The plugin version
   */
  getVersion?(): string;

  /**
   * Gets a human-readable description of the plugin.
   * This is optional but recommended for UI display.
   *
   * @returns The plugin description
   */
  getDescription?(): string;

  /**
   * Gets the author of the plugin.
   * This is optional but recommended for attribution.
   *
   * @returns The plugin author
   */
  getAuthor?(): string;

  /**
   * Gets the parameter schema for this plugin.
   * This defines the parameters that can be edited for components provided by this plugin.
   * This replaces the old getParameterPanels approach with a cleaner, data-driven approach.
   *
   * @returns The plugin parameter schema, or undefined if not provided
   */
  getParameterSchema?(): PluginParameterSchema;

  /**
   * Gets the parameter panels for this plugin.
   * This is used by the PropertyInspectorSystem to display the appropriate
   * parameter panels for the active simulation.
   * 
   * @deprecated Use getParameterSchema() instead for the new clean parameter system
   * @returns An array of parameter panel components
   */
  getParameterPanels?(world: IWorld): ParameterPanelComponent[];
}

