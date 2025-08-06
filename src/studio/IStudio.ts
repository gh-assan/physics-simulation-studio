import { IGraphicsManager } from "./IGraphicsManager";
import { IWorld } from "../core/ecs/IWorld";
import { IPluginContext } from "./IPluginContext";
import { RenderSystem } from "./systems/RenderSystem";

export interface IStudio {
  getGraphicsManager(): IGraphicsManager;
  getWorld(): IWorld;
  setRenderSystem(renderSystem: RenderSystem): void;
  clearRenderer(): void;
  play(): void;
  pause(): void;
  reset(): void;
  loadSimulation(pluginName: string): Promise<void>;
  unloadSimulation(): void;
  update(deltaTime: number): void;
  getIsPlaying(): boolean;
  getActiveSimulationName(): string;
  getRenderer(): any;
  getAvailableSimulationNames(): string[];
  getPluginContext(): IPluginContext;
}
