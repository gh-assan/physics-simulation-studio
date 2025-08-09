import { ISelectedSimulationStateManager } from "./state/ISelectedSimulationStateManager";
import { IStateManager } from "./state/IStateManager";
import { SimulationOrchestrator } from "./SimulationOrchestrator";
import { IWorld } from "../core/ecs/IWorld";
import { IPluginManager } from "../core/plugin/IPluginManager";
import { ISimulationOrchestrator } from "./ISimulationOrchestrator";
import { IStudio } from "./IStudio";
import { IGraphicsManager } from "./IGraphicsManager";
import { IPluginContext } from "./IPluginContext";
import { Logger } from "../core/utils/Logger";
import { SimplifiedRenderSystem } from "./rendering/simplified/SimplifiedRenderSystem";

export class Studio implements IStudio {
  private _world: IWorld;
  private pluginManager: IPluginManager;
  private renderSystem?: SimplifiedRenderSystem;
  private isPlaying = true;
  private selectedSimulation: ISelectedSimulationStateManager;
  private orchestrator: ISimulationOrchestrator;
  private pluginContext: IPluginContext;

  public get world(): IWorld {
    return this._world;
  }

  constructor(world: IWorld, pluginManager: IPluginManager, stateManager: IStateManager, pluginContext: IPluginContext) {
    this._world = world;
    this.pluginManager = pluginManager;
    this.selectedSimulation = stateManager.selectedSimulation;
    this.orchestrator = new SimulationOrchestrator(world, pluginManager, this);
    this.pluginContext = pluginContext;
  }

  public getWorld(): IWorld {
    return this._world;
  }

  public getPluginManager(): IPluginManager {
    return this.pluginManager;
  }

  public setRenderSystem(renderSystem: SimplifiedRenderSystem): void {
    this.renderSystem = renderSystem;
    if (this.orchestrator && typeof this.orchestrator.setRenderSystem === 'function') {
      this.orchestrator.setRenderSystem(renderSystem as any);
    }
  }

  /**
   * Remove plugin renderer reference after simulation switch
   */
  public clearRenderer(): void {
    // Optionally, set a flag or empty string after unload
    // This disables plugin-specific rendering after unload
    if (this.selectedSimulation) {
      this.selectedSimulation.setSimulation("");
    }
  }

  public play(): void {
    this.isPlaying = true;
    this.orchestrator.play();
    Logger.getInstance().log("▶️ Studio: Simulation started");
  }

  public pause(): void {
    this.isPlaying = false;
    this.orchestrator.pause();
    Logger.getInstance().log("⏸️ Studio: Simulation paused");
  }

  public reset(): void {
    this.orchestrator.reset();
    Logger.getInstance().log("🔄 Studio: Simulation reset");
  }

  public async loadSimulation(pluginName: string): Promise<void> {
    if (!pluginName) {
      throw new Error("Simulation name cannot be empty");
    }

    // Unload current simulation if one exists
    const currentSimulation = this.selectedSimulation.getSimulationName();
    if (currentSimulation) {
      this.orchestrator.unloadSimulation(currentSimulation);
    }

    await this.orchestrator.loadSimulation(pluginName);
    this.selectedSimulation.setSimulation(pluginName);

    this.renderSystem?.update(this.world as any, 0);

    const event = new CustomEvent("simulation-loaded", {
      detail: { simulationName: pluginName }
    });
    window.dispatchEvent(event);
    Logger.getInstance().log(`Simulation loaded: ${pluginName}`);
  }

  public unloadSimulation(): void {
    const currentSimulation = this.selectedSimulation.getSimulationName();
    if (currentSimulation) {
      this.orchestrator.unloadSimulation(currentSimulation);
      this.selectedSimulation.setSimulation("");

      Logger.getInstance().log("Simulation unloaded");
    }
  }

  public update(deltaTime: number): void {
    if (this.isPlaying) {
      this.world.update(deltaTime);
      
      // Step the physics simulation through the orchestrator
      this.orchestrator.stepSimulation(deltaTime);
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getActiveSimulationName(): string {
    return this.selectedSimulation.getSimulationName();
  }

  public getRenderer(): any {
    const pluginName = this.selectedSimulation.getSimulationName();
    if (!pluginName) {
      throw new Error("No active simulation");
    }

    const activePlugin = this.pluginManager.getPlugin(pluginName);
    if (!activePlugin?.getRenderer) {
      throw new Error("No renderer available for active simulation");
    }

    return activePlugin.getRenderer();
  }

  public getAvailableSimulationNames(): string[] {
    return Array.from(this.pluginManager.getAvailablePluginNames());
  }

    public getGraphicsManager(): IGraphicsManager {
    if (!this.renderSystem) {
      throw new Error("RenderSystem is not set in Studio. Cannot get GraphicsManager.");
    }
    return this.renderSystem.getGraphicsManager();
  }

  public getPluginContext(): IPluginContext {
    return this.pluginContext;
  }
}
