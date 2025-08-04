import { IPluginManager } from '../core/plugin/IPluginManager';
import { IWorld } from "../core/ecs/IWorld";
import { IWorld } from "../core/ecs/IWorld";
import { Logger } from "../core/utils/Logger";
import { RenderSystem } from './systems/RenderSystem';
import { IStudio } from './IStudio';

export interface ISimulationOrchestrator {
    loadSimulation(pluginName: string): Promise<void>;
    unloadSimulation(activePluginName: string | null): void;
    play(): void;
    pause(): void;
    reset(): void;
}

export class SimulationOrchestrator implements ISimulationOrchestrator {
    private world: IWorld;
    private pluginManager: IPluginManager;
    private renderSystem: RenderSystem | null = null;
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
            if (activePlugin && activePlugin.initializeEntities) {
                activePlugin.initializeEntities(this.world);
                this.world.update(0);
                this.world.systemManager.updateAll(this.world, 0);
                if (this.renderSystem) {
                    this.renderSystem.update(this.world, 0);
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

    public unloadSimulation(activePluginName: string | null): void {
        this._deactivateCurrentSimulation(activePluginName);
        this._clearWorldAndRenderSystem();
        Logger.getInstance().log("No simulation loaded.");
    }

    private _deactivateCurrentSimulation(activePluginName: string | null): void {
        if (!activePluginName) return;
        // Deactivate plugin (calls unregister internally)
        this.pluginManager.deactivatePlugin(activePluginName, this.studio);
    }

    private _clearWorldAndRenderSystem(): void {
        this.world.clear(true);
        if (this.renderSystem) {
            this.renderSystem.clear();
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
}
