import { World } from '../ecs';

// This is a placeholder for the actual UIManager.
// It will be properly defined in a future UI-related task.
export interface UIManager {}

export interface ISimulationPlugin {
    /**
     * A unique, machine-readable name for the plugin.
     * Used for dependency resolution and identification.
     * Example: "rigid-body-physics-rapier"
     */
    getName(): string;

    /**
     * An array of plugin names that this plugin depends on.
     * The PluginManager will ensure these are registered before this plugin.
     * Example: ["core-math-utils"]
     */
    getDependencies(): string[];

    /**
     * Called by the PluginManager to initialize the plugin.
     * This is where the plugin registers its components, systems,
     * and UI elements with the core application.
     * @param world The central ECS World instance.
     * @param uiManager The manager for the studio's control panel UI.
     */
    register(world: World, uiManager: UIManager): void;

    /**
     * Called by the PluginManager when the plugin is being unloaded.
     * This method should clean up all resources, unregister systems,
     * and remove any UI elements created by the plugin.
     */
    unregister(): void;
}
