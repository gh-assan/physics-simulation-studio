import { ISimulationAlgorithm, ISimulationState } from '../../core/plugin/EnhancedPluginInterfaces';
import { SimulationManager } from '../../studio/simulation/SimulationManager';
import { Vector3 } from '../../core/utils/Vector3';

interface RigidBody {
  position: Vector3;
  velocity: Vector3;
  angularVelocity: Vector3;
  rotation: Vector3; // Euler angles for simplicity
  mass: number;
  dimensions: Vector3; // for box shape
  shape: 'box' | 'sphere';
  restitution: number; // bounciness
}

interface RigidBodyState extends ISimulationState {
  bodies: RigidBody[];
  gravity: Vector3;
  airDamping: number;
}

/**
 * Rigid Body Physics Algorithm with Clean Architecture
 * Implements basic rigid body dynamics with gravity and collisions
 */
export class RigidBodyAlgorithm implements ISimulationAlgorithm {
  private bodies: RigidBody[] = [];
  private gravity = new Vector3(0, -9.81, 0);
  private airDamping = 0.995;
  private time = 0;
  private world: any;

  initialize(simulationManager: SimulationManager): void {
    this.initializeRigidBodies();
    console.log('🧱 RigidBodyAlgorithm initialized with physics');
  }

  private initializeRigidBodies(): void {
    this.bodies = [];

    // Create some rigid bodies for demonstration
    // Boxes
    for (let i = 0; i < 3; i++) {
      this.bodies.push({
        position: new Vector3(
          Math.random() * 6 - 3,  // x: -3 to 3
          5 + i * 2,              // y: stacked vertically
          Math.random() * 6 - 3   // z: -3 to 3
        ),
        velocity: new Vector3(0, 0, 0),
        angularVelocity: new Vector3(0, 0, 0),
        rotation: new Vector3(0, 0, 0),
        mass: 1.0,
        dimensions: new Vector3(1, 1, 1),
        shape: 'box',
        restitution: 0.6
      });
    }

    // Spheres
    for (let i = 0; i < 3; i++) {
      this.bodies.push({
        position: new Vector3(
          Math.random() * 6 - 3,  // x: -3 to 3
          8 + i * 2,              // y: higher up
          Math.random() * 6 - 3   // z: -3 to 3
        ),
        velocity: new Vector3(
          Math.random() * 2 - 1,  // small random velocity
          0,
          Math.random() * 2 - 1
        ),
        angularVelocity: new Vector3(0, 0, 0),
        rotation: new Vector3(0, 0, 0),
        mass: 1.0,
        dimensions: new Vector3(0.5, 0.5, 0.5), // radius for sphere
        shape: 'sphere',
        restitution: 0.8
      });
    }

    console.log(`🧱 Initialized ${this.bodies.length} rigid bodies`);
  }

  update(timestep: number): void {
    this.time += timestep;

    for (const body of this.bodies) {
      // Apply gravity
      const gravityForce = this.gravity.clone().scale(body.mass);
      const acceleration = gravityForce.clone().scale(1 / body.mass);

      // Update velocity (linear)
      body.velocity.add(acceleration.clone().scale(timestep));

      // Apply air damping
      body.velocity.scale(this.airDamping);
      body.angularVelocity.scale(this.airDamping);

      // Update position
      body.position.add(body.velocity.clone().scale(timestep));

      // Update rotation (simplified)
      body.rotation.add(body.angularVelocity.clone().scale(timestep));

      // Simple ground collision
      const groundY = -5;
      if (body.shape === 'box') {
        const halfHeight = body.dimensions.y * 0.5;
        if (body.position.y - halfHeight <= groundY) {
          body.position.y = groundY + halfHeight;
          body.velocity.y = -body.velocity.y * body.restitution;
          // Add some angular velocity on ground impact
          body.angularVelocity.x += (Math.random() - 0.5) * 2;
          body.angularVelocity.z += (Math.random() - 0.5) * 2;
        }
      } else if (body.shape === 'sphere') {
        const radius = body.dimensions.x; // using x as radius
        if (body.position.y - radius <= groundY) {
          body.position.y = groundY + radius;
          body.velocity.y = -body.velocity.y * body.restitution;
        }
      }

      // Simple wall collisions
      const wallDistance = 10;
      if (Math.abs(body.position.x) > wallDistance) {
        body.position.x = Math.sign(body.position.x) * wallDistance;
        body.velocity.x = -body.velocity.x * body.restitution;
      }
      if (Math.abs(body.position.z) > wallDistance) {
        body.position.z = Math.sign(body.position.z) * wallDistance;
        body.velocity.z = -body.velocity.z * body.restitution;
      }
    }
  }

  reset(): void {
    this.time = 0;
    this.initializeRigidBodies();
  }

  getState(): ISimulationState {
    return {
      entities: new Set(this.bodies.map((_, index) => index)),
      time: this.time,
      deltaTime: 0, // Will be set by simulation manager
      isRunning: true,
      metadata: new Map<string, any>([
        ['bodyCount', this.bodies.length],
        ['gravity', this.gravity.toString()],
        ['airDamping', this.airDamping]
      ]),
      bodies: [...this.bodies], // Clone bodies
      gravity: this.gravity.clone(),
      airDamping: this.airDamping
    } as RigidBodyState;
  }

  setState(state: ISimulationState): void {
    const rigidBodyState = state as RigidBodyState;
    this.bodies = rigidBodyState.bodies ? [...rigidBodyState.bodies] : [];
    this.time = rigidBodyState.time;
    this.gravity = rigidBodyState.gravity || this.gravity;
    this.airDamping = rigidBodyState.airDamping || this.airDamping;
  }

  setWorld(world: any): void {
    this.world = world;
  }
}
