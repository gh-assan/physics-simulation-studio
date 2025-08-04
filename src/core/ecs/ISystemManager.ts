import { System } from "./System";
import { IWorld } from "./IWorld";

export interface ISystemManager {
  registerSystem(system: System, world?: IWorld): void;
  onSystemRegistered(callback: (system: System) => void): void;
  updateAll(world: IWorld, deltaTime: number): void;
  getSystem<T extends System>(systemType: new (...args: any[]) => T): T | undefined;
  removeSystem(system: System, world?: IWorld): boolean;
  clear(world?: IWorld): void;
  getAllSystems(): System[];
}
