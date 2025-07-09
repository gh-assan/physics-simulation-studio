import {System} from '@core/ecs/System';
import {World} from '@core/ecs/World';
import {
  WaterDropletComponent,
  WaterBodyComponent,
  Ripple,
} from './WaterComponents';
import {PositionComponent} from '@core/components/PositionComponent';

export class WaterSystem extends System {
  constructor() {
    super();
  }

  update(world: World, dt: number): void {
    // console.log('WaterSystem update called');
    const droplets = world.componentManager.getEntitiesWithComponents([
      WaterDropletComponent,
      PositionComponent,
    ]);
    const waterBodies = world.componentManager.getEntitiesWithComponents([
      WaterBodyComponent,
      PositionComponent,
    ]);

    if (waterBodies.length === 0) return;
    const waterBodyEntity = waterBodies[0]; // Assume one water body for now
    const waterBodyComponent = world.componentManager.getComponent(
      waterBodyEntity,
      WaterBodyComponent.type,
    ) as WaterBodyComponent;
    const waterBodyPosition = world.componentManager.getComponent(
      waterBodyEntity,
      PositionComponent.name,
    ) as PositionComponent;

    // Update existing ripples
    waterBodyComponent.ripples = waterBodyComponent.ripples.filter(ripple => {
      ripple.radius += dt * 5; // Ripple expands
      ripple.amplitude *= 1 - ripple.decay * dt; // Ripple decays
      return ripple.amplitude > 0.01; // Remove if amplitude is too small
    });

    for (const droplet of droplets) {
      const dropletComponent = world.componentManager.getComponent(
        droplet,
        WaterDropletComponent.type,
      ) as WaterDropletComponent;
      const positionComponent = world.componentManager.getComponent(
        droplet,
        PositionComponent.name,
      ) as PositionComponent;

      // Simple gravity
      dropletComponent.velocity -= 9.81 * dt;
      positionComponent.y += dropletComponent.velocity * dt;

      // Check for collision with water
      if (positionComponent.y <= waterBodyPosition.y) {
        console.log('Splash!');
        this.createRipples(
          world,
          waterBodyComponent,
          positionComponent.x,
          positionComponent.z,
        );
        world.entityManager.destroyEntity(droplet);
      }
    }
  }

  createRipples(
    world: World,
    waterBody: WaterBodyComponent,
    x: number,
    z: number,
  ): void {
    const newRipple: Ripple = {
      x: x,
      z: z,
      radius: 0,
      amplitude: 1,
      decay: 0.5, // Adjust decay rate as needed
    };
    waterBody.ripples.push(newRipple);
    console.log(`Creating ripples at (${x}, ${z})`);
  }
}
