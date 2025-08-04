import { IStudio } from './IStudio';
import { IWorld } from '../core/ecs/IWorld';
import { IApplicationEventBus } from '../core/events/IApplicationEventBus';

import { IStateManager } from "./state/IStateManager";

export interface IPluginContext {
  studio: IStudio;
  world: IWorld;
  eventBus: IApplicationEventBus;
  getStateManager(): IStateManager;
}
