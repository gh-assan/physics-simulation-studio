import { IWorld } from "./IWorld";

export interface IEntityManager {
  createEntity(id?: number): number;
  destroyEntity(entityId: number, world: IWorld): void;
  hasEntity(entityId: number): boolean;
  getAllEntities(): Set<number>;
  getEntityById(entityID: number): number | undefined;
  clear(): void;
}
