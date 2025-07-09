import { World } from "../ecs";
import { ParameterPanelComponent } from "../components/ParameterPanelComponent";

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
   * This is where the plugin registers its components, systems,
   * and UI elements with the core application.
   *
   * @param world The central ECS World instance
   */
  register(world: World): void;

  /**
   * Called by the PluginManager when the plugin is being unloaded.
   * This method should clean up all resources, unregister systems,
   * and remove any UI elements created by the plugin.
   */
  unregister(): void;

  /**
   * Initializes the entities required by the plugin.
   * This is called after the plugin is registered to set up the initial state.
   *
   * @param world The central ECS World instance
   */
  initializeEntities(world: World): void;

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
   * Gets the parameter panels for this plugin.
   * This is used by the PropertyInspectorSystem to display the appropriate
   * parameter panels for the active simulation.
   *
   * @returns An array of parameter panel components
   */
  getParameterPanels?(): ParameterPanelComponent[];
}
