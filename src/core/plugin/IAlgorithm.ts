import { IWorld } from '../ecs/IWorld';

export interface IAlgorithm {
  step(deltaTime: number): void;
  initialize(world: IWorld): void;
  reset?(): void;
}
