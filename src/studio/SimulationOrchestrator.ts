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

    async loadSimulation(pluginName: string): Promise<void> {
        this._deactivateCurrentSimulation(pluginName);
        this._clearWorldAndRenderSystem();
        try {
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
                const event = new CustomEvent("simulation-loaded", {
                    detail: { simulationName: pluginName }
                });
                window.dispatchEvent(event);
                Logger.log(`Dispatched simulation-loaded event for ${pluginName}`);
            }
        } catch (error) {
            Logger.error(`Failed to load simulation "${pluginName}":`, error);
        }
    }

    unloadSimulation(activePluginName: string | null): void {
        this._deactivateCurrentSimulation(activePluginName);
        this._clearWorldAndRenderSystem();
        Logger.log("No simulation loaded.");
    }

    private _clearWorldAndRenderSystem(): void {
        this.world.clear();
        if (this.renderSystem) {
            this.renderSystem.clear();
        }
    }

    private _deactivateCurrentSimulation(activePluginName: string | null): void {
        if (activePluginName) {
            this.pluginManager.deactivatePlugin(activePluginName);
        }
    }

    play(): void {
        Logger.log('Simulation play');
        // Add play logic here
    }

    pause(): void {
        Logger.log('Simulation pause');
        // Add pause logic here
    }

    reset(): void {
        Logger.log('Simulation reset');
        // Add reset logic here
    }
}
