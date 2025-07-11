import { System } from "@core/ecs/System";
import { World } from "@core/ecs/World";
import { WaterDropletComponent, WaterBodyComponent } from "./WaterComponents";
import { PositionComponent } from "@core/components/PositionComponent";
import { Vector3 } from "./utils/Vector3";
import { SPHKernels } from "./utils/SPHKernels";
import { SpatialHasher } from "./utils/SpatialHasher";

export class WaterSystem extends System {
  public gravity: Vector3 = new Vector3(0, -9.81, 0); // m/s^2

  // SPH Parameters
  public smoothingLength = 1.0; // h
  public gasConstant = 2000; // k
  public restDensity = 1000; // rho0
  public viscosityCoefficient = 0.1; // mu
  public surfaceTensionCoefficient = 0.072; // sigma

  private kernels: SPHKernels;
  private spatialHasher: SpatialHasher;

  constructor() {
    super();
    this.kernels = new SPHKernels(this.smoothingLength);
    this.spatialHasher = new SpatialHasher(this.smoothingLength * 2); // Cell size related to smoothing length
  }

  update(world: World, dt: number): void {
    if (dt === 0) {
      return;
    }

    const droplets = world.componentManager.getEntitiesWithComponents([
      WaterDropletComponent,
      PositionComponent
    ]);

    // Clear spatial hash and add all droplets
    this.spatialHasher.clear();
    for (const entityId of droplets) {
      const positionComponent = world.componentManager.getComponent(
        entityId,
        PositionComponent.type
      ) as PositionComponent;
      if (positionComponent) {
        this.spatialHasher.add(
          entityId,
          new Vector3(
            positionComponent.x,
            positionComponent.y,
            positionComponent.z
          )
        );
      }
    }

    // Step 1: Calculate Density and Pressure
    for (const entityId of droplets) {
      const dropletComponent = world.componentManager.getComponent(
        entityId,
        WaterDropletComponent.type
      ) as WaterDropletComponent;
      const positionComponent = world.componentManager.getComponent(
        entityId,
        PositionComponent.type
      ) as PositionComponent;

      if (!dropletComponent || !positionComponent) continue;

      // Check for NaN in positionComponent
      if (isNaN(positionComponent.x) || isNaN(positionComponent.y) || isNaN(positionComponent.z)) {
        console.error(`[WaterSystem] Droplet ${entityId} - Detected NaN in PositionComponent. Resetting to 0,0,0.`);
        positionComponent.x = 0;
        positionComponent.y = 0;
        positionComponent.z = 0;
      }

      // Check for NaN in dropletComponent.velocity
      if (isNaN(dropletComponent.velocity.x) || isNaN(dropletComponent.velocity.y) || isNaN(dropletComponent.velocity.z)) {
        console.error(`[WaterSystem] Droplet ${entityId} - Detected NaN in velocity. Resetting to 0,0,0.`);
        dropletComponent.velocity.x = 0;
        dropletComponent.velocity.y = 0;
        dropletComponent.velocity.z = 0;
      }

      // Check for NaN in dropletComponent.previousPosition
      if (dropletComponent.previousPosition && (isNaN(dropletComponent.previousPosition.x) || isNaN(dropletComponent.previousPosition.y) || isNaN(dropletComponent.previousPosition.z))) {
        dropletComponent.previousPosition.x = positionComponent.x;
        dropletComponent.previousPosition.y = positionComponent.y;
        dropletComponent.previousPosition.z = positionComponent.z;
      }

      let density = 0;
      dropletComponent.neighbors = []; // Clear previous neighbors

      const potentialNeighbors = this.spatialHasher.getNeighbors(
        new Vector3(
          positionComponent.x,
          positionComponent.y,
          positionComponent.z
        )
      );

      for (const neighborId of potentialNeighbors) {
        if (neighborId === entityId) continue; // Skip self

        const neighborPositionComponent = world.componentManager.getComponent(
          neighborId,
          PositionComponent.type
        ) as PositionComponent;
        const neighborDropletComponent = world.componentManager.getComponent(
          neighborId,
          WaterDropletComponent.type
        ) as WaterDropletComponent;

        if (!neighborPositionComponent || !neighborDropletComponent) continue;

        const rVec = new Vector3(
          positionComponent.x - neighborPositionComponent.x,
          positionComponent.y - neighborPositionComponent.y,
          positionComponent.z - neighborPositionComponent.z
        );
        const r = rVec.magnitude();

        if (r < this.smoothingLength) {
          density += neighborDropletComponent.mass.value * this.kernels.W_poly6(r);
          dropletComponent.neighbors.push(neighborId);
        }
      }
      dropletComponent.density.value = density;
      if (dropletComponent.density.value === 0) {
        dropletComponent.density.value = 1e-6; // Set to a small non-zero value to prevent division by zero
      }
      dropletComponent.pressure.value =
        this.gasConstant * (dropletComponent.density.value - this.restDensity);
    }

    // Step 2: Calculate Forces (Pressure, Viscosity, External)
    for (const entityId of droplets) {
      const dropletComponent = world.componentManager.getComponent(
        entityId,
        WaterDropletComponent.type
      ) as WaterDropletComponent;
      const positionComponent = world.componentManager.getComponent(
        entityId,
        PositionComponent.type
      ) as PositionComponent;

      if (!dropletComponent || !positionComponent) continue;

      let pressureForce = new Vector3(0, 0, 0);
      let viscosityForce = new Vector3(0, 0, 0);

      for (const neighborId of dropletComponent.neighbors) {
        const neighborPositionComponent = world.componentManager.getComponent(
          neighborId,
          PositionComponent.type
        ) as PositionComponent;
        const neighborDropletComponent = world.componentManager.getComponent(
          neighborId,
          WaterDropletComponent.type
        ) as WaterDropletComponent;

        if (!neighborPositionComponent || !neighborDropletComponent) continue;

        const rVec = new Vector3(
          positionComponent.x - neighborPositionComponent.x,
          positionComponent.y - neighborPositionComponent.y,
          positionComponent.z - neighborPositionComponent.z
        );
        const r = rVec.magnitude();
        if (isNaN(r)) {
          console.error(`[WaterSystem] Droplet ${entityId} - NaN in r (magnitude) calculation. rVec: ${rVec.x}, ${rVec.y}, ${rVec.z}`);
        }

        // Pressure Force
        const gradWSpiky = this.kernels.grad_W_spiky(r, rVec);
        if (isNaN(gradWSpiky.x) || isNaN(gradWSpiky.y) || isNaN(gradWSpiky.z)) {
          console.error(`[WaterSystem] Droplet ${entityId} - NaN in gradWSpiky calculation. r: ${r}, rVec: ${rVec.x}, ${rVec.y}, ${rVec.z}`);
        }
        const pressureScale = (-neighborDropletComponent.mass.value *
          (dropletComponent.pressure.value + neighborDropletComponent.pressure.value)) /
          (2 * (neighborDropletComponent.density.value === 0 ? 1e-6 : neighborDropletComponent.density.value));
        if (isNaN(pressureScale)) {
          console.error(`[WaterSystem] Droplet ${entityId} - NaN in pressureScale calculation. neighborMass: ${neighborDropletComponent.mass.value}, dropletPressure: ${dropletComponent.pressure.value}, neighborPressure: ${neighborDropletComponent.pressure.value}, neighborDensity: ${neighborDropletComponent.density.value}`);
        }
        pressureForce = pressureForce.add(
          new Vector3(
            gradWSpiky.x,
            gradWSpiky.y,
            gradWSpiky.z
          ).scale(pressureScale)
        );
        if (isNaN(pressureForce.x) || isNaN(pressureForce.y) || isNaN(pressureForce.z)) {
          console.error(`[WaterSystem] Droplet ${entityId} - NaN in pressureForce after add. currentPressureForce: ${pressureForce.x}, ${pressureForce.y}, ${pressureForce.z}, gradWSpiky: ${gradWSpiky.x}, ${gradWSpiky.y}, ${gradWSpiky.z}, pressureScale: ${pressureScale}`);
        }

        // Viscosity Force
        const velocityDiff = dropletComponent.velocity.subtract(
          neighborDropletComponent.velocity
        );
        if (isNaN(velocityDiff.x) || isNaN(velocityDiff.y) || isNaN(velocityDiff.z)) {
          console.error(`[WaterSystem] Droplet ${entityId} - NaN in velocityDiff calculation. dropletVelocity: ${dropletComponent.velocity.x}, ${dropletComponent.velocity.y}, ${dropletComponent.velocity.z}, neighborVelocity: ${neighborDropletComponent.velocity.x}, ${neighborDropletComponent.velocity.y}, ${neighborDropletComponent.velocity.z}`);
        }
        const laplacianWViscosity = this.kernels.laplacian_W_viscosity(r);
        if (isNaN(laplacianWViscosity)) {
          console.error(`[WaterSystem] Droplet ${entityId} - NaN in laplacianWViscosity calculation. r: ${r}`);
        }
        const viscosityScale = (this.viscosityCoefficient *
          neighborDropletComponent.mass.value *
          laplacianWViscosity) /
          (neighborDropletComponent.density.value === 0 ? 1e-6 : neighborDropletComponent.density.value);
        if (isNaN(viscosityScale)) {
          // console.error(`[WaterSystem] Droplet ${entityId} - NaN in viscosityScale calculation. viscosityCoefficient: ${this.viscosityCoefficient}, neighborMass: ${neighborDropletComponent.mass.value}, laplacianWViscosity: ${laplacianWViscosity}, neighborDensity: ${neighborDropletComponent.density.value}`);
        }
        viscosityForce = viscosityForce.add(
          velocityDiff.scale(viscosityScale)
        );
        if (isNaN(viscosityForce.x) || isNaN(viscosityForce.y) || isNaN(viscosityForce.z)) {
          // Do nothing
        }
      }
      // External Forces (Gravity)
      const externalForce = this.gravity.scale(dropletComponent.mass.value);

      // Total Force
      const totalForce = pressureForce.add(viscosityForce).add(externalForce);
      let acceleration: Vector3;
      if (dropletComponent.mass.value === 0) {
        acceleration = new Vector3(0, 0, 0);
      } else {
        acceleration = totalForce.scale(1 / dropletComponent.mass.value);
      }

      // Step 3: Integrate (Verlet Integration)
      const currentPosition = new Vector3(
        positionComponent.x,
        positionComponent.y,
        positionComponent.z
      );

      // Initialize previousPosition if it's the first frame or not set
      if (
        !dropletComponent.previousPosition ||
        (dropletComponent.previousPosition.x === 0 &&
          dropletComponent.previousPosition.y === 0 &&
          dropletComponent.previousPosition.z === 0 &&
          currentPosition.x !== 0 &&
          currentPosition.y !== 0 &&
          currentPosition.z !== 0)
      ) {
        dropletComponent.previousPosition = currentPosition
          .clone()
          .subtract(dropletComponent.velocity.scale(dt));
      }

      const newPosition = currentPosition
        .add(dropletComponent.velocity.scale(dt))
        .add(acceleration.scale(0.5 * dt * dt));

      const newVelocity = newPosition
        .subtract(dropletComponent.previousPosition)
        .scale(1 / dt);

      dropletComponent.previousPosition = currentPosition.clone(); // Update previousPosition for the next iteration
      dropletComponent.velocity = newVelocity;
      positionComponent.x = newPosition.x;
      positionComponent.y = newPosition.y;
      positionComponent.z = newPosition.z;

      // Step 4: Boundary Handling (Simple collision with a floor at y=0)
      if (positionComponent.y < 0) {
        // Instead of bouncing, remove the droplet when it hits the water
        world.entityManager.destroyEntity(entityId);
      }
    }
  }

  init(): void {}
  unregister(): void {}
}
