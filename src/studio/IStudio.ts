import { IGraphicsManager } from "./IGraphicsManager";
import { IWorld } from "../core/ecs/IWorld";
import { IPluginContext } from "./IPluginContext";
import { IPluginManager } from "../core/plugin/IPluginManager";
// Note: decoupled from legacy SimplifiedRenderSystem to support adapter-only mode

export interface IStudio {
  getGraphicsManager(): IGraphicsManager;
  getWorld(): IWorld;
  getPluginManager(): IPluginManager;
  setRenderSystem(renderSystem: any): void;
  getRenderSystemDebugInfo(): any;
  getSimulationDebugInfo(): any;
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
