import { IWorld } from "../../core/ecs/IWorld";
import { World } from "../../core/ecs/World";
import { IPluginManager } from "../../core/plugin/IPluginManager";
import { Logger } from "../../core/utils/Logger";
import { SimplifiedRenderSystem } from "../rendering/simplified/SimplifiedRenderSystem";
import { SelectedSimulationStateManager } from "./SelectedSimulationState";
import { IStudio } from "../IStudio";

export class SimulationOrchestrator {
  private world: IWorld;
  private pluginManager: IPluginManager;
  private renderSystem?: SimplifiedRenderSystem;
  private selectedSimulation: SelectedSimulationStateManager;
  private studio: IStudio;

  constructor(
    world: IWorld,
    pluginManager: IPluginManager,
    studio: IStudio,
    selectedSimulation: SelectedSimulationStateManager
  ) {
    this.world = world;
    this.pluginManager = pluginManager;
    this.studio = studio;
    this.selectedSimulation = selectedSimulation;
  }

  public setRenderSystem(renderSystem: SimplifiedRenderSystem): void {
    this.renderSystem = renderSystem;
  }

  public async loadSimulation(pluginName: string): Promise<void> {
    if (!pluginName) {
      this.unloadCurrentSimulation();
      return;
    }

    if (this.selectedSimulation.getSimulationName() === pluginName) {
      Logger.getInstance().log(`Simulation "${pluginName}" is already active.`);
      return;
    }

    this.deactivateCurrentSimulation();
    this.clearWorldAndRenderSystem();

    try {
      await this.activateAndInitializePlugin(pluginName);
    } catch (error) {
      Logger.getInstance().error(`Failed to load simulation "${pluginName}":`, error);
      this.selectedSimulation.setSimulation("");
    }
  }

  public unloadCurrentSimulation(): void {
    this.deactivateCurrentSimulation();
    this.clearWorldAndRenderSystem();
    this.selectedSimulation.setSimulation("");
    Logger.getInstance().log("No simulation loaded.");
  }

  private clearWorldAndRenderSystem(): void {
    this.world.clear();
    if (this.renderSystem) {
      this.renderSystem.dispose();
    }
  }

  private deactivateCurrentSimulation(): void {
    const activePluginName = this.selectedSimulation.getSimulationName();
    if (activePluginName) {
      this.pluginManager.deactivatePlugin(activePluginName, this.studio);
    }
  }

  private async activateAndInitializePlugin(pluginName: string): Promise<void> {
    await this.pluginManager.activatePlugin(pluginName, this.studio);
    Logger.getInstance().log(`Loaded simulation: ${pluginName}`);
    const activePlugin = this.pluginManager.getPlugin(pluginName);
    await activePlugin?.initializeEntities?.(this.world);
    this.world.update(0);
    this.renderSystem?.update(this.world as World, 0);
    this.selectedSimulation.setSimulation(pluginName);
  }
}
