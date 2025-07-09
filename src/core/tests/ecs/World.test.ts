import { World } from "../../ecs/World";
import { IComponent } from "../../ecs/IComponent";
import { System } from "../../ecs/System";

class PositionComponent implements IComponent {
  static readonly type = "PositionComponent";

  constructor(
    public x: number,
    public y: number
  ) {}

  clone(): PositionComponent {
    return new PositionComponent(this.x, this.y);
  }
}

class VelocityComponent implements IComponent {
  static readonly type = "VelocityComponent";

  constructor(
    public vx: number,
    public vy: number
  ) {}

  clone(): VelocityComponent {
    return new VelocityComponent(this.vx, this.vy);
  }
}

class MovementSystem extends System {
  public update(world: World, deltaTime: number): void {
    const entities = world.componentManager.getEntitiesWithComponents([
      PositionComponent,
      VelocityComponent
    ]);
    for (const entity of entities) {
      const position = world.componentManager.getComponent<PositionComponent>(
        entity,
        PositionComponent.type
      )!;
      const velocity = world.componentManager.getComponent<VelocityComponent>(
        entity,
        VelocityComponent.type
      )!;
      position.x += velocity.vx * deltaTime;
      position.y += velocity.vy * deltaTime;
    }
  }
}

describe("World", () => {
  let world: World;

  beforeEach(() => {
    world = new World();
    world.componentManager.registerComponent(PositionComponent);
    world.componentManager.registerComponent(VelocityComponent);
    world.systemManager.registerSystem(new MovementSystem());
  });

  it("should update systems and modify components", () => {
    const entity = world.entityManager.createEntity();
    const position = new PositionComponent(0, 0);
    const velocity = new VelocityComponent(10, 5);

    world.componentManager.addComponent(
      entity,
      PositionComponent.type,
      position
    );
    world.componentManager.addComponent(
      entity,
      VelocityComponent.type,
      velocity
    );

    world.update(2);

    expect(position.x).toBe(20);
    expect(position.y).toBe(10);
  });
});
