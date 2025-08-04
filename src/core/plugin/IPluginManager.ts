import { ISimulationPlugin } from "./ISimulationPlugin";
import { IStudio } from "../../studio/IStudio";

export interface IPluginManager {
  registerPlugin(plugin: ISimulationPlugin): void;
  activatePlugin(pluginName: string, studio: IStudio): Promise<void>;
  deactivatePlugin(pluginName: string, studio: IStudio): void;
  getPlugin(pluginName: string): ISimulationPlugin | undefined;
  getAvailablePluginNames(): string[];
}