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
    ripple.radius += dt * ripple.expansionRate; // Ripple expands based on its expansion rate
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
  // Use droplet's own gravity instead of the system gravity
  const dropletGravity = dropletComponent.gravity || gravity;

  // Apply gravity force (F = m*g)
  const gravityForce = dropletGravity.scale(dropletComponent.mass.value * dt);

  // Apply drag force (F = -k*v)
  const dragForceX = -dropletComponent.drag.value * dropletComponent.velocity.x * dt;
  const dragForceY = -dropletComponent.drag.value * dropletComponent.velocity.y * dt;
  const dragForceZ = -dropletComponent.drag.value * dropletComponent.velocity.z * dt;

  // Update velocity (a = F/m)
  dropletComponent.velocity.x +=
    (gravityForce.x + dragForceX) / dropletComponent.mass.value;
  dropletComponent.velocity.y +=
    (gravityForce.y + dragForceY) / dropletComponent.mass.value;
  dropletComponent.velocity.z +=
    (gravityForce.z + dragForceZ) / dropletComponent.mass.value;

  // Update position
  positionComponent.x += dropletComponent.velocity.x * dt;
  positionComponent.y += dropletComponent.velocity.y * dt;
  positionComponent.z += dropletComponent.velocity.z * dt;
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

    // Get the droplet component to access its properties
    const dropletComponent = world.componentManager.getComponent(
      dropletEntityId,
      WaterDropletComponent.type
    ) as WaterDropletComponent;

    if (!dropletComponent) {
      // Fallback to default ripple creation if droplet component not found
      createRipples(waterBodyComponent, dropletPosition.x, dropletPosition.z);
      world.destroyEntity(dropletEntityId);
      return true;
    }

    // Create ripples based on droplet properties
    createRipples(
      waterBodyComponent,
      dropletPosition.x,
      dropletPosition.z,
      dropletComponent
    );

    world.destroyEntity(dropletEntityId);
    return true;
  }
  return false;
}

export function createRipples(
  waterBody: WaterBodyComponent,
  x: number,
  z: number,
  droplet?: WaterDropletComponent
): void {
  // Use droplet properties if available, otherwise use defaults
  const splashForce = droplet ? droplet.splashForce.value : 1.0;
  const rippleDecay = droplet ? droplet.rippleDecay.value : 0.5;
  const rippleExpansionRate = droplet ? droplet.rippleExpansionRate.value : 5.0;

  const newRipple: Ripple = {
    x: x,
    z: z,
    radius: 0,
    amplitude: splashForce, // Use splash force as initial amplitude
    decay: rippleDecay, // Use droplet's ripple decay
    expansionRate: rippleExpansionRate // Use droplet's ripple expansion rate
  };

  waterBody.ripples.push(newRipple);
  console.log(
    `Creating ripples at (${x}, ${z}) with amplitude ${splashForce}, decay ${rippleDecay}, expansion rate ${rippleExpansionRate}`
  );
}
