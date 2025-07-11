import { IComponent } from "@core/ecs/IComponent";
import { Ripple } from "./types";
import { Vector3 } from "./utils/Vector3";
import { PhysicsParameter } from "@core/physics/PhysicsParameter";
import { WATER_PHYSICS_CONSTANTS } from "./constants";

export class WaterBodyComponent implements IComponent {
  public static readonly type = "WaterBodyComponent";
  readonly type = WaterBodyComponent.type;
  public simulationType = "water-simulation";

  public ripples: Ripple[] = [];

  public viscosity: PhysicsParameter = WATER_PHYSICS_CONSTANTS.VISCOSITY_COEFFICIENT;
  public surfaceTension: PhysicsParameter = WATER_PHYSICS_CONSTANTS.SURFACE_TENSION_COEFFICIENT;

  constructor() {}

  clone(): WaterBodyComponent {
    const cloned = new WaterBodyComponent();
    cloned.viscosity = new PhysicsParameter(this.viscosity.value, this.viscosity.min, this.viscosity.max, this.viscosity.step);
    cloned.surfaceTension = new PhysicsParameter(this.surfaceTension.value, this.surfaceTension.min, this.surfaceTension.max, this.surfaceTension.step);
    return cloned;
  }
}

export class WaterDropletComponent implements IComponent {
  public static readonly type = "WaterDropletComponent";
  readonly type = WaterDropletComponent.type;
  public simulationType = "water-simulation";

  public density: PhysicsParameter = new PhysicsParameter(0, 0, Infinity, 0.001);
  public pressure: PhysicsParameter = new PhysicsParameter(0, -Infinity, Infinity, 0.001);
  public viscosity: PhysicsParameter = WATER_PHYSICS_CONSTANTS.VISCOSITY_COEFFICIENT;
  public radius: PhysicsParameter = WATER_PHYSICS_CONSTANTS.DROPLET_RADIUS;
  public previousPosition: Vector3; // For Verlet integration
  public neighbors: number[] = []; // Entity IDs of neighboring particles

  public fallHeight: PhysicsParameter = WATER_PHYSICS_CONSTANTS.DROPLET_FALL_HEIGHT;
  public velocity: Vector3 = new Vector3(0, 0, 0);
  public mass: PhysicsParameter = WATER_PHYSICS_CONSTANTS.DROPLET_MASS;
  public drag: PhysicsParameter = WATER_PHYSICS_CONSTANTS.DROPLET_DRAG;
  public gravity: Vector3 = new Vector3(0, -9.81, 0);
  public splashForce: PhysicsParameter = WATER_PHYSICS_CONSTANTS.DROPLET_SPLASH_FORCE;
  public splashRadius: PhysicsParameter = WATER_PHYSICS_CONSTANTS.DROPLET_SPLASH_RADIUS;
  public rippleDecay: PhysicsParameter = WATER_PHYSICS_CONSTANTS.DROPLET_RIPPLE_DECAY;
  public rippleExpansionRate: PhysicsParameter = WATER_PHYSICS_CONSTANTS.DROPLET_RIPPLE_EXPANSION_RATE;

  constructor(initialPosition: Vector3 = new Vector3(0, 0, 0)) {
    this.previousPosition = initialPosition.clone();
  }

  clone(): WaterDropletComponent {
    const cloned = new WaterDropletComponent(this.previousPosition.clone());
    cloned.density = new PhysicsParameter(this.density.value, this.density.min, this.density.max, this.density.step);
    cloned.pressure = new PhysicsParameter(this.pressure.value, this.pressure.min, this.pressure.max, this.pressure.step);
    cloned.viscosity = new PhysicsParameter(this.viscosity.value, this.viscosity.min, this.viscosity.max, this.viscosity.step);
    cloned.radius = new PhysicsParameter(this.radius.value, this.radius.min, this.radius.max, this.radius.step);
    cloned.fallHeight = new PhysicsParameter(this.fallHeight.value, this.fallHeight.min, this.fallHeight.max, this.fallHeight.step);
    cloned.velocity = this.velocity.clone();
    cloned.mass = new PhysicsParameter(this.mass.value, this.mass.min, this.mass.max, this.mass.step);
    cloned.drag = new PhysicsParameter(this.drag.value, this.drag.min, this.drag.max, this.drag.step);
    cloned.gravity = this.gravity.clone();
    cloned.splashForce = new PhysicsParameter(this.splashForce.value, this.splashForce.min, this.splashForce.max, this.splashForce.step);
    cloned.splashRadius = new PhysicsParameter(this.splashRadius.value, this.splashRadius.min, this.splashRadius.max, this.splashRadius.step);
    cloned.rippleDecay = new PhysicsParameter(this.rippleDecay.value, this.rippleDecay.min, this.rippleDecay.max, this.rippleDecay.step);
    cloned.rippleExpansionRate = new PhysicsParameter(this.rippleExpansionRate.value, this.rippleExpansionRate.min, this.rippleExpansionRate.max, this.rippleExpansionRate.step);
    return cloned;
  }
}
