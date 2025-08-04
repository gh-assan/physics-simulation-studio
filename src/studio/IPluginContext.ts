import { IStudio } from './IStudio';
import { IWorld } from '../core/ecs/IWorld';
import { IApplicationEventBus } from '../core/events/IApplicationEventBus';

export interface IPluginContext {
  studio: IStudio;
  world: IWorld;
  eventBus: IApplicationEventBus;
  getStateManager(): any;
}
