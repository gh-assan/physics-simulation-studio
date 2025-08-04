import { ThreeGraphicsManager } from "./graphics/ThreeGraphicsManager";
import { World } from "../core/ecs/World";

export interface IStudio {
  getGraphicsManager(): ThreeGraphicsManager;
  getWorld(): World;
}
