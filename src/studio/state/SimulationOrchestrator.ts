import { World } from "../../core/ecs/World";
import { PluginManager } from "../../core/plugin/PluginManager";
import { Logger } from "../../core/utils/Logger";
import { RenderSystem } from "../systems/RenderSystem";
import { SelectedSimulationStateManager } from "./SelectedSimulationState";

export class SimulationOrchestrator {
  private world: World;
  private pluginManager: PluginManager;
  private renderSystem: RenderSystem | null = null;
  private selectedSimulation: SelectedSimulationStateManager;

  constructor(
    world: World,
    pluginManager: PluginManager,
    selectedSimulation: SelectedSimulationStateManager
  ) {
    this.world = world;
    this.pluginManager = pluginManager;
    this.selectedSimulation = selectedSimulation;
  }

  public setRenderSystem(renderSystem: RenderSystem): void {
    this.renderSystem = renderSystem;
  }

  public async loadSimulation(pluginName: string | null): Promise<void> {
    if (pluginName === null) {
      this.unloadCurrentSimulation();
      return;
    }

    if (this.selectedSimulation.getSimulationName() === pluginName) {
      Logger.log(`Simulation "${pluginName}" is already active.`);
      return;
    }

    this.deactivateCurrentSimulation();
    this.clearWorldAndRenderSystem();

    try {
      await this.activateAndInitializePlugin(pluginName);
    } catch (error) {
      Logger.error(`Failed to load simulation "${pluginName}":`, error);
      this.selectedSimulation.setSimulation(null);
    }
  }

  public unloadCurrentSimulation(): void {
    this.deactivateCurrentSimulation();
    this.clearWorldAndRenderSystem();
    this.selectedSimulation.setSimulation(null);
    Logger.log("No simulation loaded.");
  }

  private clearWorldAndRenderSystem(): void {
    this.world.clear();
    if (this.renderSystem) {
      this.renderSystem.clear();
    }
  }

  private deactivateCurrentSimulation(): void {
    const activePluginName = this.selectedSimulation.getSimulationName();
    if (activePluginName) {
      this.pluginManager.deactivatePlugin(activePluginName);
    }
  }

  private async activateAndInitializePlugin(pluginName: string): Promise<void> {
    await this.pluginManager.activatePlugin(pluginName);
    Logger.log(`Loaded simulation: ${pluginName}`);
    const activePlugin = this.pluginManager.getPlugin(pluginName);
    if (activePlugin && activePlugin.initializeEntities) {
      activePlugin.initializeEntities(this.world);
      this.world.update(0);
      if (this.renderSystem) {
        this.renderSystem.update(this.world, 0);
      }

      this.selectedSimulation.setSimulation(pluginName);
    }
  }
}
