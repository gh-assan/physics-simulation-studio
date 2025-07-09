import { World } from "./World";

export abstract class System {
  public abstract update(world: World, deltaTime: number): void;
}
