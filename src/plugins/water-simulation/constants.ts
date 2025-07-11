import { PhysicsParameter } from "@core/physics/PhysicsParameter";

export const WATER_PHYSICS_CONSTANTS = {
  // SPH Parameters
  SMOOTHING_LENGTH: new PhysicsParameter(1.0, 0.1, 10.0, 0.1), // h
  GAS_CONSTANT: new PhysicsParameter(2000, 100, 5000, 100), // k
  REST_DENSITY: new PhysicsParameter(1000, 100, 2000, 10), // rho0
  VISCOSITY_COEFFICIENT: new PhysicsParameter(0.1, 0.01, 1.0, 0.01), // mu
  SURFACE_TENSION_COEFFICIENT: new PhysicsParameter(0.072, 0.01, 0.5, 0.001), // sigma

  // Droplet Parameters
  DROPLET_RADIUS: new PhysicsParameter(0.5, 0.1, 5.0, 0.1), // Particle radius
  DROPLET_MASS: new PhysicsParameter(1.0, 0.1, 10.0, 0.1), // mass
  DROPLET_DRAG: new PhysicsParameter(0.1, 0.01, 1.0, 0.01), // drag
  DROPLET_FALL_HEIGHT: new PhysicsParameter(10, 1, 100, 1), // fallHeight
  DROPLET_SPLASH_FORCE: new PhysicsParameter(1.0, 0.1, 10.0, 0.1), // splashForce
  DROPLET_SPLASH_RADIUS: new PhysicsParameter(2.0, 0.1, 5.0, 0.1), // splashRadius
  DROPLET_RIPPLE_DECAY: new PhysicsParameter(0.5, 0.1, 1.0, 0.01), // rippleDecay
  DROPLET_RIPPLE_EXPANSION_RATE: new PhysicsParameter(5.0, 1.0, 10.0, 0.1), // rippleExpansionRate
};
