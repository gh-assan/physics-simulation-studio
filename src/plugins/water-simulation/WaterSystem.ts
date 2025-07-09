import { System } from "@core/ecs/System";
import { World } from "@core/ecs/World";
import { WaterDropletComponent, WaterBodyComponent } from "./WaterComponents";
import { PositionComponent } from "@core/components/PositionComponent";
import {
  updateRipples,
  updateDropletPhysics,
  handleDropletCollision
} from "./utils/WaterPhysicsHelpers";
import { Vector3 } from "./utils/Vector3";

export class WaterSystem extends System {
  public gravity: Vector3 = new Vector3(0, -9.81, 0); // m/s^2

  constructor() {
    super();
  }

  update(world: World, dt: number): void {
    const droplets = world.componentManager.getEntitiesWithComponents([
      WaterDropletComponent,
      PositionComponent
    ]);
    const waterBodies = world.componentManager.getEntitiesWithComponents([
      WaterBodyComponent,
      PositionComponent
    ]);

    if (waterBodies.length === 0) return;
    const waterBodyEntity = waterBodies[0]; // Assume one water body for now
    const waterBodyComponent = world.componentManager.getComponent(
      waterBodyEntity,
      WaterBodyComponent.type
    ) as WaterBodyComponent;
    const waterBodyPosition = world.componentManager.getComponent(
      waterBodyEntity,
      PositionComponent.type
    ) as PositionComponent;

    // Update existing ripples
    updateRipples(waterBodyComponent, dt);

    for (const droplet of droplets) {
      const dropletComponent = world.componentManager.getComponent(
        droplet,
        WaterDropletComponent.type
      ) as WaterDropletComponent;
      const positionComponent = world.componentManager.getComponent(
        droplet,
        PositionComponent.type
      ) as PositionComponent;

      // Simple gravity and position update
      updateDropletPhysics(
        dropletComponent,
        positionComponent,
        this.gravity,
        dt
      );

      // Check for collision with water
      handleDropletCollision(
        world,
        droplet,
        positionComponent,
        waterBodyComponent,
        waterBodyPosition
      );
    }
  }
}
