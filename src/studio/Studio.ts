import { World } from "../core/ecs/World";
import { PluginManager } from "../core/plugin/PluginManager";
import { Logger } from "../core/utils/Logger";

import { RenderSystem } from "./systems/RenderSystem";
import { SelectedSimulationStateManager } from "./state/SelectedSimulationState";
import { StateManager } from "./state/StateManager";
import { SimulationOrchestrator } from "./SimulationOrchestrator";

export class Studio {
  private _world: World;
  private pluginManager: PluginManager;
  private renderSystem: RenderSystem | null = null;
  private isPlaying = true;
  private selectedSimulation: SelectedSimulationStateManager;
  private orchestrator: SimulationOrchestrator;

  public get world(): World {
    return this._world;
  }

  constructor(world: World, pluginManager: PluginManager, stateManager: StateManager) {
    this._world = world;
    this.pluginManager = pluginManager;
    this.selectedSimulation = stateManager.selectedSimulation;
    this.orchestrator = new SimulationOrchestrator(world, pluginManager);
  }

  public setRenderSystem(renderSystem: RenderSystem): void {
    this.renderSystem = renderSystem;
    // Update orchestrator with renderSystem
    this.orchestrator = new SimulationOrchestrator(this._world, this.pluginManager, renderSystem);
  }

  /**
   * Remove plugin renderer reference after simulation switch
   */
  public clearRenderer(): void {
    // Optionally, set a flag or null out any plugin renderer reference
    // This disables plugin-specific rendering after unload
    if (this.selectedSimulation) {
      this.selectedSimulation.setSimulation(null);
    }
  }

  public play(): void {
    this.isPlaying = true;
    this.orchestrator.play();
    // Optionally, dispatch event via ApplicationEventBus in future
  }

  public pause(): void {
    this.isPlaying = false;
    this.orchestrator.pause();
    // Optionally, dispatch event via ApplicationEventBus in future
  }

  public reset(): void {
    this.orchestrator.reset();
    // Optionally, dispatch event via ApplicationEventBus in future
  }

  public async loadSimulation(pluginName: string | null): Promise<void> {
    const currentSimulation = this.selectedSimulation.getSimulationName();
    if (currentSimulation) {
      this.orchestrator.unloadSimulation(currentSimulation);
      this.selectedSimulation.setSimulation(null);
    }
    if (pluginName) {
      await this.orchestrator.loadSimulation(pluginName);
      this.selectedSimulation.setSimulation(pluginName);
      // Dispatch event after state update so UI can react to correct state
      const event = new CustomEvent("simulation-loaded", {
        detail: { simulationName: pluginName }
      });
      window.dispatchEvent(event);
      Logger.log(`Dispatched simulation-loaded event for ${pluginName}`);
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
    const pluginName = this.selectedSimulation.getSimulationName();
    if (pluginName) {
      const activePlugin = this.pluginManager.getPlugin(pluginName);
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
