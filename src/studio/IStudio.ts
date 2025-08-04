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
  loadSimulation(pluginName: string | null): Promise<void>;
  update(deltaTime: number): void;
  getIsPlaying(): boolean;
  getActiveSimulationName(): string | null;
  getRenderer(): any | null;
  getAvailableSimulationNames(): string[];
  getPluginContext(): IPluginContext;
}

