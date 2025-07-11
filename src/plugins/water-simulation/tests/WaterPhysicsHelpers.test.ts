import { World } from "@core/ecs/World";
import { PositionComponent } from "@core/components/PositionComponent";
import { WaterDropletComponent, WaterBodyComponent } from "../WaterComponents";
import { Vector3 } from "../utils/Vector3";
import {
  updateRipples,
  updateDropletPhysics,
  handleDropletCollision,
  createRipples
} from "../utils/WaterPhysicsHelpers";

describe("WaterPhysicsHelpers", () => {
  let world: World;

  beforeEach(() => {
    world = new World();
    world.componentManager.registerComponent(
      WaterDropletComponent.type,
      WaterDropletComponent
    );
    world.componentManager.registerComponent(
      WaterBodyComponent.type,
      WaterBodyComponent
    );
    world.componentManager.registerComponent(
      PositionComponent.name,
      PositionComponent
    );
  });

  it("updateRipples should expand and decay ripples", () => {
    const waterBody = new WaterBodyComponent();
    waterBody.ripples = [{ x: 0, z: 0, radius: 0, amplitude: 1, decay: 0.1, expansionRate: 5 }];

    updateRipples(waterBody, 1); // Simulate 1 second

    expect(waterBody.ripples[0].radius).toBeCloseTo(5);
    expect(waterBody.ripples[0].amplitude).toBeCloseTo(0.9);

    updateRipples(waterBody, 10); // Simulate 10 more seconds for decay
    expect(waterBody.ripples.length).toBe(0); // Should be removed due to decay
  });

  it("updateDropletPhysics should apply gravity to droplet velocity and position", () => {
    const droplet = new WaterDropletComponent(0.5, 10, new Vector3(0, 0, 0));
    const position = new PositionComponent(0, 10, 0);
    const gravity = new Vector3(0, -9.81, 0);

    updateDropletPhysics(droplet, position, gravity, 1); // Simulate 1 second

    expect(droplet.velocity.y).toBeCloseTo(-9.81);
    expect(position.y).toBeCloseTo(10 - 9.81); // Initial 10 - (9.81 * 1)
  });

  it("handleDropletCollision should destroy droplet and create ripples on collision", () => {
    const dropletEntity = world.entityManager.createEntity();
    const dropletPosition = new PositionComponent(0, -0.1, 0);
    const waterBody = new WaterBodyComponent();
    const waterBodyPosition = new PositionComponent(0, 0, 0);

    world.componentManager.addComponent(
      dropletEntity,
      WaterDropletComponent.type,
      new WaterDropletComponent()
    );
    world.componentManager.addComponent(
      dropletEntity,
      PositionComponent.name,
      dropletPosition
    );

    const collisionHandled = handleDropletCollision(
      world,
      dropletEntity,
      dropletPosition,
      waterBody,
      waterBodyPosition
    );

    expect(collisionHandled).toBe(true);
    expect(world.entityManager.hasEntity(dropletEntity)).toBe(false);
    expect(waterBody.ripples.length).toBe(1);
    expect(waterBody.ripples[0].x).toBe(0);
    expect(waterBody.ripples[0].z).toBe(0);
  });

  it("handleDropletCollision should not destroy droplet or create ripples if no collision", () => {
    const dropletEntity = world.entityManager.createEntity();
    const dropletPosition = new PositionComponent(0, 10, 0);
    const waterBody = new WaterBodyComponent();
    const waterBodyPosition = new PositionComponent(0, 0, 0);

    world.componentManager.addComponent(
      dropletEntity,
      WaterDropletComponent.type,
      new WaterDropletComponent()
    );
    world.componentManager.addComponent(
      dropletEntity,
      PositionComponent.name,
      dropletPosition
    );

    const collisionHandled = handleDropletCollision(
      world,
      dropletEntity,
      dropletPosition,
      waterBody,
      waterBodyPosition
    );

    expect(collisionHandled).toBe(false);
    expect(world.entityManager.hasEntity(dropletEntity)).toBe(true);
    expect(waterBody.ripples.length).toBe(0);
  });

  it("createRipples should add a new ripple to the water body", () => {
    const waterBody = new WaterBodyComponent();
    expect(waterBody.ripples.length).toBe(0);

    createRipples(waterBody, 1, 2);

    expect(waterBody.ripples.length).toBe(1);
    expect(waterBody.ripples[0].x).toBe(1);
    expect(waterBody.ripples[0].z).toBe(2);
    expect(waterBody.ripples[0].radius).toBe(0);
    expect(waterBody.ripples[0].amplitude).toBe(1);
    expect(waterBody.ripples[0].decay).toBe(0.5);
  });
});
