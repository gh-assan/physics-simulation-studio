import { IPluginManager } from '../core/plugin/IPluginManager';
import { IWorld } from "../core/ecs/IWorld";
import { World } from '../core/ecs/World';
import { Logger } from "../core/utils/Logger";
import { SimplifiedRenderSystem } from './rendering/simplified/SimplifiedRenderSystem';
import { IStudio } from './IStudio';
import { ISimulationOrchestrator } from './ISimulationOrchestrator';
import { IRenderer } from './rendering/simplified/SimplifiedInterfaces';

export class SimulationOrchestrator implements ISimulationOrchestrator {
    private world: IWorld;
    private pluginManager: IPluginManager;
    private renderSystem: SimplifiedRenderSystem | null = null;
    private studio: IStudio;

    constructor(world: IWorld, pluginManager: IPluginManager, studio: IStudio) {
        this.world = world;
        this.pluginManager = pluginManager;
        this.studio = studio;
    }

    public async loadSimulation(pluginName: string): Promise<void> {
        this._deactivateCurrentSimulation(pluginName);
        this._clearWorldAndRenderSystem();
        try {
            await this.pluginManager.activatePlugin(pluginName, this.studio);
            Logger.getInstance().log(`Loaded simulation: ${pluginName}`);

            const activePlugin = this.pluginManager.getPlugin(pluginName);

            // Register plugin renderer with SimplifiedRenderSystem
            if (this.renderSystem && activePlugin?.getRenderer) {
                const pluginRenderer = activePlugin.getRenderer();
                if (pluginRenderer && typeof pluginRenderer === 'object') {
                    // Check if it's a new-style IRenderer
                    if (pluginRenderer.name && pluginRenderer.canRender && pluginRenderer.render) {
                        this.renderSystem.registerRenderer(pluginRenderer as IRenderer);
                        Logger.getInstance().log(`Registered ${pluginName} renderer: ${pluginRenderer.name}`);
                    }
                }
            }

            if (activePlugin?.initializeEntities) {
                await activePlugin.initializeEntities(this.world);
                this.world.update(0);
                this.world.systemManager.updateAll(this.world, 0);
                if (this.renderSystem) {
                    this.renderSystem.update(this.world as World, 0);
                }
            }

            const event = new CustomEvent("simulation-loaded", {
                detail: { simulationName: pluginName }
            });
            window.dispatchEvent(event);
            Logger.getInstance().log(`Dispatched simulation-loaded event for ${pluginName}`);
        } catch (error: unknown) {
            Logger.getInstance().error(`Failed to load simulation:`, error);
        }
    }

    public unloadSimulation(activePluginName: string): void {
        if (!activePluginName) {
            throw new Error("Cannot unload simulation: plugin name is required");
        }
        this._deactivateCurrentSimulation(activePluginName);
        this._clearWorldAndRenderSystem();
        Logger.getInstance().log(`Simulation ${activePluginName} unloaded.`);
    }

    private _deactivateCurrentSimulation(activePluginName: string): void {
        if (!activePluginName) {
            throw new Error("Cannot deactivate simulation: plugin name is required");
        }
        // Deactivate plugin (calls unregister internally)
        this.pluginManager.deactivatePlugin(activePluginName, this.studio);
    }

    private _clearWorldAndRenderSystem(): void {
        // Only clear entities and components, NOT systems
        // Core systems (RenderSystem, SelectionSystem, PropertyInspectorSystem) should persist
        this.world.clear(false); // Changed from clear(true) to clear(false)

        // Clear all renderers from the SimplifiedRenderSystem
        // Note: SimplifiedRenderSystem doesn't have a clear() method - it's automatic
        if (this.renderSystem) {
            // Renderers are automatically cleaned up when plugins are unloaded
            Logger.getInstance().log('Render system ready for new simulation');
        }
    }

    public play(): void {
        Logger.getInstance().log('Simulation play');
        // Add play logic here
    }

    public pause(): void {
        Logger.getInstance().log('Simulation pause');
        // Add pause logic here
    }

    public reset(): void {
        Logger.getInstance().log('Simulation reset');
        // Add reset logic here
    }

    public setRenderSystem(renderSystem: SimplifiedRenderSystem): void {
        this.renderSystem = renderSystem;
    }
}
