import { WaterDropletComponent, WaterBodyComponent } from "../WaterComponents";
import { PositionComponent } from "@core/components/PositionComponent";
import { Ripple } from "../types";
import { World } from "@core/ecs/World";
import { Vector3 } from "./Vector3";

export function updateRipples(
  waterBodyComponent: WaterBodyComponent,
  dt: number
): void {
  waterBodyComponent.ripples = waterBodyComponent.ripples.filter((ripple) => {
    ripple.radius += dt * 5; // Ripple expands
    ripple.amplitude *= 1 - ripple.decay * dt; // Ripple decays
    return ripple.amplitude > 0.01; // Remove if amplitude is too small
  });
}

export function updateDropletPhysics(
  dropletComponent: WaterDropletComponent,
  positionComponent: PositionComponent,
  gravity: Vector3,
  dt: number
): void {
  // Simple gravity - update velocity components directly instead of replacing the Vector3 instance
  // This ensures UI bindings to velocity.x, velocity.y, velocity.z remain valid
  const gravityEffect = gravity.scale(dt);
  dropletComponent.velocity.x += gravityEffect.x;
  dropletComponent.velocity.y += gravityEffect.y;
  dropletComponent.velocity.z += gravityEffect.z;

  positionComponent.y += dropletComponent.velocity.y * dt;
}

export function handleDropletCollision(
  world: World,
  dropletEntityId: number,
  dropletPosition: PositionComponent,
  waterBodyComponent: WaterBodyComponent,
  waterBodyPosition: PositionComponent
): boolean {
  if (dropletPosition.y <= waterBodyPosition.y) {
    console.log("Splash!");
    createRipples(waterBodyComponent, dropletPosition.x, dropletPosition.z);
    world.entityManager.destroyEntity(dropletEntityId);
    return true;
  }
  return false;
}

export function createRipples(
  waterBody: WaterBodyComponent,
  x: number,
  z: number
): void {
  const newRipple: Ripple = {
    x: x,
    z: z,
    radius: 0,
    amplitude: 1,
    decay: 0.5 // Adjust decay rate as needed
  };
  waterBody.ripples.push(newRipple);
  console.log(`Creating ripples at (${x}, ${z})`);
}
