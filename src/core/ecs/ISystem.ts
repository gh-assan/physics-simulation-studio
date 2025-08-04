import { IWorld } from "./IWorld";

export interface ISystem {
  priority: number;
  update(world: IWorld, deltaTime: number): void;
  onEntityRemoved?(entityId: number, world: IWorld): void;
  onComponentRemoved?(entityId: number, componentType: string, world: IWorld): void;
  onRegister?(world: IWorld): void;
  onRemove?(world: IWorld): void;
}

