import { SystemManager } from "../../ecs/SystemManager";
import { System } from "../../ecs/System";
import { World } from "../../ecs/World";

class TestSystem extends System {
  public updated = false;
  public update(world: World, deltaTime: number): void {
    this.updated = true;
  }
}

describe("SystemManager", () => {
  let systemManager: SystemManager;
  let world: World;

  beforeEach(() => {
    systemManager = new SystemManager();
    world = new World();
  });

  it("should register and update a system", () => {
    const system = new TestSystem();
    systemManager.registerSystem(system);
    systemManager.updateAll(world, 0.16);
    expect(system.updated).toBe(true);
  });
});
