import { ISimulationAlgorithm, ISimulationState } from '../../core/plugin/EnhancedPluginInterfaces';
import { SimulationManager } from '../../studio/simulation/SimulationManager';
import { Vector3 } from '../../core/utils/Vector3';

interface SimplePhysicsParticle {
  position: Vector3;
  velocity: Vector3;
  mass: number;
  radius: number;
}

interface SimplePhysicsState extends ISimulationState {
  particles: SimplePhysicsParticle[];
  gravity: number;
  damping: number;
  bounciness: number;
  groundLevel: number;
}

/**
 * Simple Physics Algorithm with Clean Architecture
 * Handles basic gravity, collision, and damping physics
 */
export class SimplePhysicsAlgorithm implements ISimulationAlgorithm {
  private particles: SimplePhysicsParticle[] = [];
  private gravity = -9.81;
  private damping = 0.98;
  private bounciness = 0.7;
  private groundLevel = -5;
  private time = 0;
  private world: any;

  initialize(simulationManager: SimulationManager): void {
    this.initializeParticles();
    console.log('🎯 SimplePhysicsAlgorithm initialized with basic physics');
  }

  private initializeParticles(): void {
    this.particles = [];

    // Create some random particles for demonstration
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        position: new Vector3(
          Math.random() * 10 - 5,  // x: -5 to 5
          Math.random() * 5 + 2,   // y: 2 to 7
          Math.random() * 10 - 5   // z: -5 to 5
        ),
        velocity: new Vector3(
          Math.random() * 4 - 2,   // vx: -2 to 2
          Math.random() * 2,       // vy: 0 to 2
          Math.random() * 4 - 2    // vz: -2 to 2
        ),
        mass: 1.0,
        radius: 0.2
      });
    }

    console.log(`🎯 Initialized ${this.particles.length} simple physics particles`);
  }

  update(timestep: number): void {
    this.time += timestep;

    for (const particle of this.particles) {
      // Apply gravity
      particle.velocity.y += this.gravity * timestep;

      // Apply damping
      particle.velocity.x *= this.damping;
      particle.velocity.y *= this.damping;
      particle.velocity.z *= this.damping;

      // Update position
      particle.position.x += particle.velocity.x * timestep;
      particle.position.y += particle.velocity.y * timestep;
      particle.position.z += particle.velocity.z * timestep;

      // Ground collision
      if (particle.position.y - particle.radius <= this.groundLevel) {
        particle.position.y = this.groundLevel + particle.radius;
        particle.velocity.y = -particle.velocity.y * this.bounciness;
      }

      // Side wall collisions (simple box bounds)
      const wallDistance = 8;
      if (Math.abs(particle.position.x) > wallDistance) {
        particle.position.x = Math.sign(particle.position.x) * wallDistance;
        particle.velocity.x = -particle.velocity.x * this.bounciness;
      }
      if (Math.abs(particle.position.z) > wallDistance) {
        particle.position.z = Math.sign(particle.position.z) * wallDistance;
        particle.velocity.z = -particle.velocity.z * this.bounciness;
      }
    }
  }

  reset(): void {
    this.time = 0;
    this.initializeParticles();
  }

  getState(): ISimulationState {
    return {
      entities: new Set(this.particles.map((_, index) => index)),
      time: this.time,
      deltaTime: 0, // Will be set by simulation manager
      isRunning: true,
      metadata: new Map([
        ['particleCount', this.particles.length],
        ['gravity', this.gravity],
        ['damping', this.damping]
      ]),
      particles: [...this.particles], // Clone particles
      gravity: this.gravity,
      damping: this.damping,
      bounciness: this.bounciness,
      groundLevel: this.groundLevel
    } as SimplePhysicsState;
  }

  setState(state: ISimulationState): void {
    const simpleState = state as SimplePhysicsState;
    this.particles = simpleState.particles ? [...simpleState.particles] : [];
    this.time = simpleState.time;
    this.gravity = simpleState.gravity || this.gravity;
    this.damping = simpleState.damping || this.damping;
    this.bounciness = simpleState.bounciness || this.bounciness;
    this.groundLevel = simpleState.groundLevel || this.groundLevel;
  }

  setWorld(world: any): void {
    this.world = world;
  }
}
