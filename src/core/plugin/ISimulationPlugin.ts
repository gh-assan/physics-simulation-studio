import { World } from '../ecs';

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
     */
    register(world: World): void;

    /**
     * Called by the PluginManager when the plugin is being unloaded.
     * This method should clean up all resources, unregister systems,
     * and remove any UI elements created by the plugin.
     */
    unregister(): void;
    initializeEntities(world: World): void;
}
