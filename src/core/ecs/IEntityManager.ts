import { IWorld } from "./IWorld";

export interface IEntityManager {
  createEntity(id?: number): number;
  destroyEntity(entityId: number, world: IWorld): void;
  hasEntity(entityId: number): boolean;
  clear(): void;
}
