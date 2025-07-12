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
  private _activePluginName: string | null = null;

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
      detail: { simulationName: this._activePluginName }
    });
    window.dispatchEvent(event);
    console.log(
      `Dispatched simulation-play event for ${this._activePluginName}`
    );
  }

  public pause(): void {
    this.isPlaying = false;
    console.log("Simulation paused.");

    // Dispatch a custom event to notify systems
    const event = new CustomEvent("simulation-pause", {
      detail: { simulationName: this._activePluginName }
    });
    window.dispatchEvent(event);
    console.log(
      `Dispatched simulation-pause event for ${this._activePluginName}`
    );
  }

  public reset(): void {
    console.log("Simulation reset.");
    this._clearWorldAndRenderSystem();
    if (this._activePluginName) {
      void this.loadSimulation(this._activePluginName); // Reload the current simulation
    }
  }

  private _unloadCurrentSimulation(): void {
    this._deactivateCurrentSimulation();
    this._clearWorldAndRenderSystem();
    this.selectedSimulation.setSimulation(null);
    this._activePluginName = null;
    console.log("No simulation loaded.");
  }

  public async loadSimulation(pluginName: string | null): Promise<void> {
    if (pluginName === null) {
      this._unloadCurrentSimulation();
      return;
    }

    if (this._activePluginName === pluginName) {
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
      this._activePluginName = null;
    }
  }

  private _clearWorldAndRenderSystem(): void {
    this.world.clear(); // Clear all entities and components
    if (this.renderSystem) {
      this.renderSystem.clear(); // Clear rendered meshes
    }
  }

  private _deactivateCurrentSimulation(): void {
    if (this._activePluginName) {
      this.pluginManager.deactivatePlugin(this._activePluginName);
    }
  }

  private async _activateAndInitializePlugin(
    pluginName: string
  ): Promise<void> {
    await this.pluginManager.activatePlugin(pluginName);
    console.log(`Loaded simulation: ${pluginName}`);
    const activePlugin = this.pluginManager.getPlugin(pluginName);
    if (activePlugin && activePlugin.initializeEntities) {
      activePlugin.initializeEntities(this.world);
      this.world.update(0); // Force an immediate update of all systems
      this.world.systemManager.updateAll(this.world, 0);
      if (this.renderSystem) {
        this.renderSystem.update(this.world, 0); // Force an immediate render
      }

      // Update internal state first
      this._activePluginName = pluginName;
      // Then update the global state
      this.selectedSimulation.setSimulation(pluginName);

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
    return this._activePluginName;
  }

  public getRenderer(): any | null {
    if (this._activePluginName) {
      const activePlugin = this.pluginManager.getPlugin(
        this._activePluginName
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

console.log("Studio.prototype.getAvailableSimulationNames:", typeof Studio.prototype.getAvailableSimulationNames);