import { SystemManager } from "../SystemManager";
import { System } from "../System";
import { World } from "../World";

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
