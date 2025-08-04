import { ISimulationPlugin } from "./ISimulationPlugin";
import { IStudio } from "../../studio/IStudio";
import { PluginManagerEvent } from "./PluginManager";

export interface IPluginManager {
  registerPlugin(plugin: ISimulationPlugin): void;
  activatePlugin(pluginName: string, studio: IStudio): Promise<void>;
  deactivatePlugin(pluginName: string, studio: IStudio): void;
  getPlugin(pluginName: string): ISimulationPlugin | undefined;
  getAvailablePluginNames(): string[];
  getActivePluginNames(): string[];
  on(event: PluginManagerEvent, callback: Function): () => void;
  onPluginRegistered(callback: (plugin: ISimulationPlugin) => void): () => void;
  onPluginActivated(callback: (plugin: ISimulationPlugin) => void): () => void;
  onPluginDeactivated(callback: (plugin: ISimulationPlugin) => void): () => void;
  onPluginError(callback: (pluginName: string, operation: string, error: any) => void): () => void;
  onPluginsChanged(callback: () => void): () => void;
}
