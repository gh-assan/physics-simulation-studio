import { World } from '../core/ecs/World';
import { PluginManager } from '../core/plugin/PluginManager';
import { Logger } from '../core/utils/Logger';
import { RenderSystem } from './systems/RenderSystem';

export interface ISimulationOrchestrator {
    loadSimulation(pluginName: string): Promise<void>;
    unloadSimulation(activePluginName: string | null): void;
    play(): void;
    pause(): void;
    reset(): void;
}

export class SimulationOrchestrator implements ISimulationOrchestrator {
    private world: World;
    private pluginManager: PluginManager;
    private renderSystem: RenderSystem | null = null;

    constructor(world: World, pluginManager: PluginManager, renderSystem?: RenderSystem | null) {
        this.world = world;
        this.pluginManager = pluginManager;
        this.renderSystem = renderSystem || null;
    }

    public async loadSimulation(pluginName: string): Promise<void> {
        this._deactivateCurrentSimulation(pluginName);
        this._clearWorldAndRenderSystem();
        try {
            // Temporarily unregister RenderSystem if it exists
            if (this.renderSystem) {
                this.world.systemManager.removeSystem(this.renderSystem);
            }

            await this.pluginManager.activatePlugin(pluginName);
            Logger.log(`Loaded simulation: ${pluginName}`);
            const activePlugin = this.pluginManager.getPlugin(pluginName);
            if (activePlugin && activePlugin.initializeEntities) {
                activePlugin.initializeEntities(this.world);
                this.world.update(0);
                this.world.systemManager.updateAll(this.world, 0);
                if (this.renderSystem) {
                    this.renderSystem.update(this.world, 0);
                }
            }

            // Re-register RenderSystem to ensure it runs last
            if (this.renderSystem) {
                this.world.systemManager.registerSystem(this.renderSystem);
            }
            const event = new CustomEvent("simulation-loaded", {
                detail: { simulationName: pluginName }
            });
            window.dispatchEvent(event);
            Logger.log(`Dispatched simulation-loaded event for ${pluginName}`);
        } catch (error: unknown) {
            Logger.error(`Failed to load simulation:`, error);
        }
    }

    public unloadSimulation(activePluginName: string | null): void {
        this._deactivateCurrentSimulation(activePluginName);
        this._clearWorldAndRenderSystem();
        Logger.log("No simulation loaded.");
    }

    private _deactivateCurrentSimulation(activePluginName: string | null): void {
        if (!activePluginName) return;
        // Deactivate plugin (calls unregister internally)
        this.pluginManager.deactivatePlugin(activePluginName);
    }

    private _clearWorldAndRenderSystem(): void {
        this.world.clear();
        if (this.renderSystem) {
            this.renderSystem.clear();
        }
    }

    public play(): void {
        Logger.log('Simulation play');
        // Add play logic here
    }

    public pause(): void {
        Logger.log('Simulation pause');
        // Add pause logic here
    }

    public reset(): void {
        Logger.log('Simulation reset');
        // Add reset logic here
    }
}
