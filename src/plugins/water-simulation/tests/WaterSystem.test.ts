import {World} from '@core/ecs/World';
import {WaterSystem} from '../WaterSystem';
import {WaterDropletComponent, WaterBodyComponent} from '../WaterComponents';
import {PositionComponent} from '@core/components/PositionComponent';
import {Vector3} from '../utils/Vector3';

describe('WaterSystem', () => {
  let world: World;
  let waterSystem: WaterSystem;

  beforeEach(() => {
    world = new World();
    waterSystem = new WaterSystem();

    world.componentManager.registerComponent(
      WaterDropletComponent.type,
      WaterDropletComponent,
    );
    world.componentManager.registerComponent(
      WaterBodyComponent.type,
      WaterBodyComponent,
    );
    world.componentManager.registerComponent(
      PositionComponent.name,
      PositionComponent,
    );

    world.systemManager.registerSystem(waterSystem);
  });

  it('should make a droplet fall over time', () => {
    const droplet = world.entityManager.createEntity();
    world.componentManager.addComponent(
      droplet,
      WaterDropletComponent.type,
      new WaterDropletComponent(0.5, 10, new Vector3(0, 0, 0)),
    );
    world.componentManager.addComponent(
      droplet,
      PositionComponent.name,
      new PositionComponent(0, 10, 0),
    );

    const waterBody = world.entityManager.createEntity();
    world.componentManager.addComponent(
      waterBody,
      WaterBodyComponent.type,
      new WaterBodyComponent(),
    );
    world.componentManager.addComponent(
      waterBody,
      PositionComponent.name,
      new PositionComponent(0, 0, 0),
    );

    const initialPosition = (
      world.componentManager.getComponent(
        droplet,
        PositionComponent.name,
      ) as PositionComponent
    ).y;

    // Simulate one second of time
    waterSystem.update(world, 1);

    const finalPosition = (
      world.componentManager.getComponent(
        droplet,
        PositionComponent.name,
      ) as PositionComponent
    ).y;

    expect(finalPosition).toBeLessThan(initialPosition);
  });

  it('should remove the droplet when it hits the water', () => {
    const droplet = world.entityManager.createEntity();
    world.componentManager.addComponent(
      droplet,
      WaterDropletComponent.type,
      new WaterDropletComponent(0.5, 1, new Vector3(0, 0, 0)),
    );
    world.componentManager.addComponent(
      droplet,
      PositionComponent.name,
      new PositionComponent(0, 0.1, 0),
    );

    const waterBody = world.entityManager.createEntity();
    world.componentManager.addComponent(
      waterBody,
      WaterBodyComponent.type,
      new WaterBodyComponent(),
    );
    world.componentManager.addComponent(
      waterBody,
      PositionComponent.name,
      new PositionComponent(0, 0, 0),
    );

    // Simulate a short time step to ensure collision
    waterSystem.update(world, 0.5);

    const _entitiesWithDroplet =
      world.componentManager.getEntitiesWithComponents([WaterDropletComponent]);
    expect(world.entityManager.hasEntity(droplet)).toBe(false);
  });
});
