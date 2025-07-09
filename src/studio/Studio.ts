import { World } from "../core/ecs/World";
import { PluginManager } from "../core/plugin/PluginManager";

import { RenderSystem } from "./systems/RenderSystem";

export class Studio {
  private _world: World;
  private pluginManager: PluginManager;
  private renderSystem: RenderSystem | null = null;
  private isPlaying = false;
  private activeSimulationName: string | null = null;

  public get world(): World {
    return this._world;
  }

  constructor(world: World, pluginManager: PluginManager) {
    this._world = world;
    this.pluginManager = pluginManager;
  }

  public setRenderSystem(renderSystem: RenderSystem): void {
    this.renderSystem = renderSystem;
  }

  public play(): void {
    this.isPlaying = true;
    console.log("Simulation playing.");

    // Dispatch a custom event to notify systems
    const event = new CustomEvent("simulation-play", {
      detail: { simulationName: this.activeSimulationName }
    });
    window.dispatchEvent(event);
    console.log(`Dispatched simulation-play event for ${this.activeSimulationName}`);
  }

  public pause(): void {
    this.isPlaying = false;
    console.log("Simulation paused.");

    // Dispatch a custom event to notify systems
    const event = new CustomEvent("simulation-pause", {
      detail: { simulationName: this.activeSimulationName }
    });
    window.dispatchEvent(event);
    console.log(`Dispatched simulation-pause event for ${this.activeSimulationName}`);
  }

  public reset(): void {
    console.log("Simulation reset.");
    this._clearWorldAndRenderSystem();
    if (this.activeSimulationName) {
      void this.loadSimulation(this.activeSimulationName); // Reload the current simulation
    }
  }

  public async loadSimulation(pluginName: string): Promise<void> {
    if (this.activeSimulationName === pluginName) {
      console.log(`Simulation "${pluginName}" is already active.`);
      return;
    }

    this._deactivateCurrentSimulation();
    this._clearWorldAndRenderSystem();

    try {
      await this._activateAndInitializePlugin(pluginName);
    } catch (error) {
      console.error(`Failed to load simulation "${pluginName}":`, error);
      this.activeSimulationName = null;
    }
  }

  private _clearWorldAndRenderSystem(): void {
    this.world.clear(); // Clear all entities and components
    if (this.renderSystem) {
      this.renderSystem.clear(); // Clear rendered meshes
    }
  }

  private _deactivateCurrentSimulation(): void {
    if (this.activeSimulationName) {
      this.pluginManager.deactivatePlugin(this.activeSimulationName);
    }
  }

  private async _activateAndInitializePlugin(
    pluginName: string
  ): Promise<void> {
    await this.pluginManager.activatePlugin(pluginName);
    this.activeSimulationName = pluginName;
    console.log(`Loaded simulation: ${pluginName}`);
    const activePlugin = this.pluginManager.getPlugin(pluginName);
    if (activePlugin && activePlugin.initializeEntities) {
      activePlugin.initializeEntities(this.world);
      this.world.systemManager.updateAll(this.world, 0);
      if (this.renderSystem) {
        this.renderSystem.update(this.world, 0); // Force an immediate render
      }

      // Dispatch a custom event to trigger UI refresh
      const event = new CustomEvent("simulation-loaded", {
        detail: { simulationName: pluginName }
      });
      window.dispatchEvent(event);
      console.log(`Dispatched simulation-loaded event for ${pluginName}`);
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

  public getRenderer(): any | null {
    if (this.activeSimulationName) {
      const activePlugin = this.pluginManager.getPlugin(
        this.activeSimulationName
      );
      // Check if the plugin has a getRenderer method (duck typing for ISimulationPlugin)
      if (activePlugin && activePlugin.getRenderer) {
        return activePlugin.getRenderer();
      }
    }
    return null;
  }

  public getAvailableSimulationNames(): string[] {
    return Array.from(this.pluginManager.getAvailablePluginNames());
  }
}
