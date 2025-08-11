import { ISimulationState, ISimulationAlgorithm } from '../../core/plugin/EnhancedPluginInterfaces';
import { SimulationManager } from '../../studio/simulation/SimulationManager';
import { IWorld } from '../../core/ecs/IWorld';
import { PositionComponent } from '../../core/components/PositionComponent';
import { CelestialBodyComponent, OrbitComponent } from './components';
import { RenderableComponent } from '../../core/components/RenderableComponent';

/**
 * Solar System Algorithm - Pure physics calculations without rendering
 */
export class SolarSystemAlgorithm implements ISimulationAlgorithm {
  private world: IWorld | null = null;
  private simulationManager: SimulationManager | null = null;
  private celestialBodies: Array<{
    entityId: number;
    mass: number;
    radius: number;
    position: { x: number; y: number; z: number };
    velocity: { x: number; y: number; z: number };
  }> = [];

  initialize(simulationManager: SimulationManager): void {
    this.simulationManager = simulationManager;
    // Initialize with default bodies even without world reference
    this.initializeCelestialBodies();
    console.log('🌟 SolarSystemAlgorithm initialized');
  }

  update(timestep: number): void {
    if (!this.world || this.celestialBodies.length === 0) {
      return;
    }

    // Apply gravitational forces between all bodies
    this.applyGravitationalForces(timestep);

    // Update positions based on velocities
    this.updatePositions(timestep);

    // Update ECS components with new positions
    this.syncWithECS();
  }

  reset(): void {
    // Reset to initial state
    this.initializeCelestialBodies();
    console.log('🔄 Solar system reset to initial state');
  }

  getState(): ISimulationState {
    return {
      entities: new Set(),
      time: 0,
      deltaTime: 0,
      isRunning: false,
      metadata: new Map(),
      bodies: this.celestialBodies.map(body => ({
        entityId: body.entityId,
        position: { ...body.position },
        velocity: { ...body.velocity },
        mass: body.mass,
        radius: body.radius
      }))
    };
  }

  setState(state: ISimulationState): void {
    const bodies = (state as any).bodies;
    if (bodies && Array.isArray(bodies)) {
      this.celestialBodies = bodies.map((body: any) => ({
        entityId: body.entityId,
        mass: body.mass,
        radius: body.radius,
        position: { ...body.position },
        velocity: { ...body.velocity }
      }));
      this.syncWithECS();
    }
  }

  setWorld(world: IWorld): void {
    this.world = world;
    this.initializeCelestialBodies();
  }

  private initializeCelestialBodies(): void {
    // Always initialize with default celestial bodies for testing
    this.celestialBodies = [
      {
        entityId: 1,
        mass: 1.989e30, // Sun mass
        radius: 695700,
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 }
      },
      {
        entityId: 2,
        mass: 5.972e24, // Earth mass
        radius: 6371,
        position: { x: 149.6e6, y: 0, z: 0 }, // 1 AU from sun
        velocity: { x: 0, y: 29780, z: 0 } // Earth orbital velocity
      }
    ];

    // If we have a world reference, sync with ECS
    if (this.world) {
      this.syncWithECS();
    }
  }

  private applyGravitationalForces(timestep: number): void {
    const G = 6.67430e-11; // Gravitational constant

    // Calculate forces between all pairs of bodies
    for (let i = 0; i < this.celestialBodies.length; i++) {
      for (let j = i + 1; j < this.celestialBodies.length; j++) {
        const body1 = this.celestialBodies[i];
        const body2 = this.celestialBodies[j];

        // Calculate distance vector
        const dx = body2.position.x - body1.position.x;
        const dy = body2.position.y - body1.position.y;
        const dz = body2.position.z - body1.position.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (distance === 0) continue;

        // Calculate gravitational force magnitude
        const force = G * body1.mass * body2.mass / (distance * distance);

        // Calculate force components
        const fx = force * dx / distance;
        const fy = force * dy / distance;
        const fz = force * dz / distance;

        // Apply forces (Newton's third law)
        const acceleration1 = {
          x: fx / body1.mass,
          y: fy / body1.mass,
          z: fz / body1.mass
        };

        const acceleration2 = {
          x: -fx / body2.mass,
          y: -fy / body2.mass,
          z: -fz / body2.mass
        };

        // Update velocities
        body1.velocity.x += acceleration1.x * timestep;
        body1.velocity.y += acceleration1.y * timestep;
        body1.velocity.z += acceleration1.z * timestep;

        body2.velocity.x += acceleration2.x * timestep;
        body2.velocity.y += acceleration2.y * timestep;
        body2.velocity.z += acceleration2.z * timestep;
      }
    }
  }

  private updatePositions(timestep: number): void {
    for (const body of this.celestialBodies) {
      body.position.x += body.velocity.x * timestep;
      body.position.y += body.velocity.y * timestep;
      body.position.z += body.velocity.z * timestep;
    }
  }

  private syncWithECS(): void {
    if (!this.world) return;

    // Update ECS components with current physics state
    for (const body of this.celestialBodies) {
      const positionComponent = this.world.getComponent(body.entityId, PositionComponent.type) as PositionComponent;
      if (positionComponent) {
        positionComponent.x = body.position.x;
        positionComponent.y = body.position.y;
        positionComponent.z = body.position.z;
      }
    }
  }
}
