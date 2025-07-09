import { World } from "../core/ecs/World";
import { PluginManager } from "../core/plugin/PluginManager";
import { System } from "../core/ecs/System";
import { PositionComponent } from "../core/components/PositionComponent";
import { RenderableComponent } from "../core/components/RenderableComponent";
import { SelectableComponent } from "../core/components/SelectableComponent";
import { FlagComponent } from "../plugins/flag-simulation/FlagComponent";

import { RenderSystem } from "./systems/RenderSystem";

export class Studio {
    private _world: World;
    private pluginManager: PluginManager;
    private renderSystem: RenderSystem;
    private isPlaying: boolean = false;
    private activeSimulationName: string | null = null;

    public get world(): World {
        return this._world;
    }

    constructor(world: World, pluginManager: PluginManager, renderSystem: RenderSystem) {
        this._world = world;
        this.pluginManager = pluginManager;
        this.renderSystem = renderSystem;
    }

    public play(): void {
        this.isPlaying = true;
        console.log("Simulation playing.");
    }

    public pause(): void {
        this.isPlaying = false;
        console.log("Simulation paused.");
    }

    public reset(): void {
        // Implement reset logic: clear world, re-load active simulation
        console.log("Simulation reset.");
        this.world.clear(); // Clear all entities and components
        this.renderSystem.clear(); // Clear rendered meshes
        if (this.activeSimulationName) {
            this.loadSimulation(this.activeSimulationName); // Reload the current simulation
        }
    }

    public async loadSimulation(pluginName: string): Promise<void> {
        if (this.activeSimulationName === pluginName) {
            console.log(`Simulation "${pluginName}" is already active.`);
            return;
        }

        // Deactivate current plugin if any
        if (this.activeSimulationName) {
            this.pluginManager.deactivatePlugin(this.activeSimulationName);
        }

        // Clear the world for the new simulation
        this.world.clear();
        this.renderSystem.clear();

        // Activate the new plugin
        try {
            await this.pluginManager.activatePlugin(pluginName);
            this.activeSimulationName = pluginName;
            console.log(`Loaded simulation: ${pluginName}`);
            // Initialize entities for the loaded simulation
            const activePlugin = this.pluginManager.getPlugin(pluginName);
            if (activePlugin && activePlugin.initializeEntities) {
                activePlugin.initializeEntities(this.world);
                this.renderSystem.update(this.world, 0); // Force an immediate render
            }
        } catch (error) {
            console.error(`Failed to load simulation "${pluginName}":`, error);
            this.activeSimulationName = null;
        }
    }

    public update(deltaTime: number): void {
        if (this.isPlaying) {
            this.world.update(deltaTime);
        }
    }

    public getIsPlaying(): boolean {
        return this.isPlaying;
    }

    public getActiveSimulationName(): string | null {
        return this.activeSimulationName;
    }

    public getAvailableSimulationNames(): string[] {
        return Array.from(this.pluginManager.getAvailablePluginNames());
    }
}
