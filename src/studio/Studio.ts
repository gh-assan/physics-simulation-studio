import { World } from "../core/ecs/World";
import { PluginManager } from "../core/plugin/PluginManager";

import { RenderSystem } from "./systems/RenderSystem";
import { SelectedSimulationStateManager } from "./state/SelectedSimulationState";
import { StateManager } from "./state/StateManager";

export class Studio {
  private _world: World;
  private pluginManager: PluginManager;
  private renderSystem: RenderSystem | null = null;
  private isPlaying = true; // Set to true by default
  private selectedSimulation: SelectedSimulationStateManager;

  public get world(): World {
    return this._world;
  }

  constructor(world: World, pluginManager: PluginManager, stateManager: StateManager) {
    this._world = world;
    this.pluginManager = pluginManager;
    this.selectedSimulation = stateManager.selectedSimulation;
  }

  public setRenderSystem(renderSystem: RenderSystem): void {
    this.renderSystem = renderSystem;
  }

  public play(): void {
    this.isPlaying = true;
    console.log("Simulation playing.");

    // Dispatch a custom event to notify systems
    const event = new CustomEvent("simulation-play", {
      detail: { simulationName: this.selectedSimulation.getSimulationName() }
    });
    window.dispatchEvent(event);
    console.log(
      `Dispatched simulation-play event for ${this.selectedSimulation.getSimulationName()}`
    );
  }

  public pause(): void {
    this.isPlaying = false;
    console.log("Simulation paused.");

    // Dispatch a custom event to notify systems
    const event = new CustomEvent("simulation-pause", {
      detail: { simulationName: this.selectedSimulation.getSimulationName() }
    });
    window.dispatchEvent(event);
    console.log(
      `Dispatched simulation-pause event for ${this.selectedSimulation.getSimulationName()}`
    );
  }

  public reset(): void {
    console.log("Simulation reset.");
    this._clearWorldAndRenderSystem();
    if (this.selectedSimulation.getSimulationName()) {
      void this.loadSimulation(this.selectedSimulation.getSimulationName()!); // Reload the current simulation
    }
  }

  private _unloadCurrentSimulation(): void {
    this._deactivateCurrentSimulation();
    this._clearWorldAndRenderSystem();
    this.selectedSimulation.setSimulation(null);
    console.log("No simulation loaded.");
  }

  public async loadSimulation(pluginName: string | null): Promise<void> {
    if (pluginName === null) {
      this._unloadCurrentSimulation();
      return;
    }

    if (this.selectedSimulation.getSimulationName() === pluginName) {
      console.log(`Simulation "${pluginName}" is already active.`);
      return;
    }

    this._deactivateCurrentSimulation();
    this._clearWorldAndRenderSystem();

    try {
      await this._activateAndInitializePlugin(pluginName);
    } catch (error) {
      console.error(`Failed to load simulation "${pluginName}":`, error);
      this.selectedSimulation.setSimulation(null);
    }
  }

  private _clearWorldAndRenderSystem(): void {
    this.world.clear(); // Clear all entities and components
    if (this.renderSystem) {
      this.renderSystem.clear(); // Clear rendered meshes
    }
  }

  private _deactivateCurrentSimulation(): void {
    const currentSimulationName = this.selectedSimulation.getSimulationName();
    if (currentSimulationName) {
      this.pluginManager.deactivatePlugin(currentSimulationName);
    }
  }

  private async _activateAndInitializePlugin(
    pluginName: string
  ): Promise<void> {
    await this.pluginManager.activatePlugin(pluginName);
    this.selectedSimulation.setSimulation(pluginName);
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
    return this.selectedSimulation.getSimulationName();
  }

  public getRenderer(): any | null {
    const activeSimulationName = this.selectedSimulation.getSimulationName();
    if (activeSimulationName) {
      const activePlugin = this.pluginManager.getPlugin(
        activeSimulationName
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
