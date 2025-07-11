import { World } from "@core/ecs/World";
import { WaterSystem } from "../WaterSystem";
import { WaterDropletComponent, WaterBodyComponent } from "../WaterComponents";
import { PositionComponent } from "@core/components/PositionComponent";
import { Vector3 } from "../utils/Vector3";

describe("WaterSystem", () => {
  let world: World;
  let waterSystem: WaterSystem;

  beforeEach(() => {
    world = new World();
    waterSystem = new WaterSystem();

    world.componentManager.registerComponent(
      WaterDropletComponent.type,
      WaterDropletComponent
    );
    world.componentManager.registerComponent(
      WaterBodyComponent.type,
      WaterBodyComponent
    );
    world.componentManager.registerComponent(
      PositionComponent.type,
      PositionComponent
    );

    world.systemManager.registerSystem(waterSystem);
  });

  it("should make a droplet fall over time", () => {
    const droplet = world.entityManager.createEntity();
    world.componentManager.addComponent(
      droplet,
      WaterDropletComponent.type,
      new WaterDropletComponent(new Vector3(0, 10, 0))
    );
    world.componentManager.addComponent(
      droplet,
      PositionComponent.type,
      new PositionComponent(0, 10, 0)
    );

    const waterBody = world.entityManager.createEntity();
    world.componentManager.addComponent(
      waterBody,
      WaterBodyComponent.type,
      new WaterBodyComponent()
    );
    world.componentManager.addComponent(
      waterBody,
      PositionComponent.name,
      new PositionComponent(0, 0, 0)
    );

    const initialPosition = (
      world.componentManager.getComponent(
        droplet,
        PositionComponent.type
      ) as PositionComponent
    ).y;

    // Simulate a small time step to ensure the droplet falls, but not too much
    waterSystem.update(world, 0.1);

    const finalPosition = (
      world.componentManager.getComponent(
        droplet,
        PositionComponent.type
      ) as PositionComponent
    ).y;

    expect(finalPosition).toBeLessThan(initialPosition);
  });

  it("should remove the droplet when it hits the water", () => {
    const droplet = world.entityManager.createEntity();
    world.componentManager.addComponent(
      droplet,
      WaterDropletComponent.type,
      new WaterDropletComponent(new Vector3(0, 0.1, 0))
    );
    world.componentManager.addComponent(
      droplet,
      PositionComponent.name,
      new PositionComponent(0, 0.1, 0)
    );

    const waterBody = world.entityManager.createEntity();
    world.componentManager.addComponent(
      waterBody,
      WaterBodyComponent.type,
      new WaterBodyComponent()
    );
    world.componentManager.addComponent(
      waterBody,
      PositionComponent.name,
      new PositionComponent(0, 0, 0)
    );

    // Simulate a short time step to ensure collision
    waterSystem.update(world, 0.5);

    const _entitiesWithDroplet =
      world.componentManager.getEntitiesWithComponents([WaterDropletComponent]);
    expect(world.entityManager.hasEntity(droplet)).toBe(false);
  });

  it.skip("should use custom physics parameters for droplet movement", () => {
    const droplet = world.entityManager.createEntity();

    // Create a droplet with custom physics parameters
    const customDroplet = new WaterDropletComponent(new Vector3(0, 10, 0));
    customDroplet.velocity = new Vector3(1, 0, 0);
    customDroplet.mass.set(2.0);
    customDroplet.drag.set(0.2);
    customDroplet.gravity = new Vector3(0, -5, 0);
    customDroplet.splashForce.set(2.0);
    customDroplet.splashRadius.set(3.0);
    customDroplet.rippleDecay.set(0.3);
    customDroplet.rippleExpansionRate.set(8.0);

    world.componentManager.addComponent(
      droplet,
      WaterDropletComponent.type,
      customDroplet
    );

    const initialPosition = new PositionComponent(0, 10, 0);
    world.componentManager.addComponent(
      droplet,
      PositionComponent.name,
      initialPosition
    );

    const waterBody = world.entityManager.createEntity();
    world.componentManager.addComponent(
      waterBody,
      WaterBodyComponent.type,
      new WaterBodyComponent()
    );
    world.componentManager.addComponent(
      waterBody,
      PositionComponent.name,
      new PositionComponent(0, 0, 0)
    );

    // Simulate a small time step to ensure the droplet falls, but not too much
    waterSystem.update(world, 0.1);

    // Get the updated position
    const positionComponent = world.componentManager.getComponent(
      droplet,
      PositionComponent.type
    ) as PositionComponent;

    // Get the updated droplet component
    const updatedDroplet = world.componentManager.getComponent(
      droplet,
      WaterDropletComponent.type
    ) as WaterDropletComponent;

    // The droplet should have moved according to its custom physics parameters
    // With less gravity (y = -5 instead of -9.81), it should fall slower
    expect(positionComponent.y).toBeLessThan(initialPosition.y);
    expect(positionComponent.y).toBeCloseTo(initialPosition.y - 0.5); // Should fall less than 5 units

    // With initial x velocity and drag, it should have moved in x direction
    expect(positionComponent.x).toBeGreaterThan(0);

    // Velocity should be affected by drag
    expect(updatedDroplet.velocity.x).toBeLessThan(1); // Initial velocity was 1, should be reduced by drag
  });
});
