import { Vector3 } from '../utils/Vector3';

/**
 * Water particle for SPH (Smoothed Particle Hydrodynamics) simulation
 */
export interface WaterParticle {
  id: number;
  position: Vector3;
  velocity: Vector3;
  density: number;
  pressure: number;
  mass: number;
}

/**
 * Water simulation state containing all particles
 */
export interface WaterSimulationState {
  particles: WaterParticle[];
  time: number;
  isRunning: boolean;
}
