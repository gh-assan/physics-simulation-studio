import { IWorld } from '../../core/ecs/IWorld';
import { ISimulationAlgorithm, ISimulationState } from '../../core/plugin/EnhancedPluginInterfaces';
import { SimulationManager } from '../../studio/simulation/SimulationManager';
import { Vector3 } from './utils/Vector3';

/**
 * Water Algorithm - SPH (Smoothed Particle Hydrodynamics) calculations without rendering
 */
export class WaterAlgorithm implements ISimulationAlgorithm {
  private world: IWorld | null = null;
  private simulationManager: SimulationManager | null = null;
  private particles: Array<{
    id: number;
    position: Vector3;
    velocity: Vector3;
    density: number;
    pressure: number;
    mass: number;
  }> = [];

  // SPH Constants
  private readonly restDensity = 998.29; // kg/m³ (water density)
  private readonly gasConstant = 2000.0;
  private readonly viscosity = 250.0;
  private readonly smoothingRadius = 0.0457;
  private readonly particleMass = 0.00020543;
  private readonly damping = 0.5;

  initialize(simulationManager: SimulationManager): void {
    this.simulationManager = simulationManager;
    this.initializeParticles();
    console.log('💧 WaterAlgorithm initialized with SPH physics');
  }

  update(timestep: number): void {
    if (this.particles.length === 0) {
      return;
    }

    // SPH Algorithm Steps:
    // 1. Find neighbors for each particle
    // 2. Calculate density and pressure
    // 3. Calculate forces (pressure, viscosity, gravity)
    // 4. Integrate positions and velocities
    // 5. Handle boundary conditions

    this.calculateDensityAndPressure();
    this.calculateForces(timestep);
    this.integrate(timestep);
    this.handleBoundaryConditions();
  }

  reset(): void {
    this.initializeParticles();
    console.log('🔄 Water simulation reset to initial state');
  }

  getState(): ISimulationState {
    return {
      entities: new Set(),
      time: 0,
      deltaTime: 0,
      isRunning: false,
      metadata: new Map(),
      particles: this.particles.map(particle => ({
        id: particle.id,
        position: {
          x: particle.position.x,
          y: particle.position.y,
          z: particle.position.z
        },
        velocity: {
          x: particle.velocity.x,
          y: particle.velocity.y,
          z: particle.velocity.z
        },
        density: particle.density,
        pressure: particle.pressure,
        mass: particle.mass
      }))
    };
  }

  setState(state: ISimulationState): void {
    const particles = (state as any).particles;
    if (particles && Array.isArray(particles)) {
      this.particles = particles.map((p: any) => ({
        id: p.id,
        position: new Vector3(p.position.x, p.position.y, p.position.z),
        velocity: new Vector3(p.velocity.x, p.velocity.y, p.velocity.z),
        density: p.density,
        pressure: p.pressure,
        mass: p.mass
      }));
    }
  }

  setWorld(world: IWorld): void {
    this.world = world;
  }

  private initializeParticles(): void {
    this.particles = [];

    // Create a small grid of water particles
    const gridSize = 5;
    const spacing = 0.05;
    let id = 0;

    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        for (let z = 0; z < gridSize; z++) {
          this.particles.push({
            id: id++,
            position: new Vector3(
              (x - gridSize / 2) * spacing,
              y * spacing + 2.0, // Start above ground
              (z - gridSize / 2) * spacing
            ),
            velocity: new Vector3(0, 0, 0),
            density: this.restDensity,
            pressure: 0,
            mass: this.particleMass
          });
        }
      }
    }

    console.log(`💧 Initialized ${this.particles.length} water particles`);
  }

  private calculateDensityAndPressure(): void {
    for (const particle of this.particles) {
      let density = 0;

      // Find neighbors and calculate density
      for (const neighbor of this.particles) {
        if (particle.id === neighbor.id) continue;

        const distance = particle.position.distanceTo(neighbor.position);
        if (distance < this.smoothingRadius) {
          const q = distance / this.smoothingRadius;
          const w = this.poly6Kernel(q);
          density += neighbor.mass * w;
        }
      }

      particle.density = Math.max(density, this.restDensity);
      particle.pressure = this.gasConstant * (particle.density - this.restDensity);
    }
  }

  private calculateForces(timestep: number): void {
    for (const particle of this.particles) {
      const pressureForce = new Vector3(0, 0, 0);
      const viscosityForce = new Vector3(0, 0, 0);

      // Calculate pressure and viscosity forces from neighbors
      for (const neighbor of this.particles) {
        if (particle.id === neighbor.id) continue;

        const distance = particle.position.distanceTo(neighbor.position);
        if (distance < this.smoothingRadius && distance > 0) {
          const direction = particle.position.clone().subtract(neighbor.position).normalize();
          const q = distance / this.smoothingRadius;

          // Pressure force (Spiky kernel gradient)
          const pressureKernel = this.spikyKernelGradient(q);
          const pressureMagnitude = (particle.pressure + neighbor.pressure) / (2 * neighbor.density);
          pressureForce.add(direction.multiplyScalar(neighbor.mass * pressureMagnitude * pressureKernel));

          // Viscosity force (Viscosity kernel laplacian)
          const viscosityKernel = this.viscosityKernelLaplacian(q);
          const velocityDiff = neighbor.velocity.clone().subtract(particle.velocity);
          viscosityForce.add(velocityDiff.multiplyScalar(neighbor.mass * viscosityKernel / neighbor.density));
        }
      }

      // Apply forces to velocity
      const acceleration = new Vector3(0, -9.81, 0); // Gravity
      acceleration.subtract(pressureForce.multiplyScalar(1 / particle.density));
      acceleration.add(viscosityForce.multiplyScalar(this.viscosity / particle.density));

      particle.velocity.add(acceleration.multiplyScalar(timestep));
    }
  }

  private integrate(timestep: number): void {
    for (const particle of this.particles) {
      // Update position
      particle.position.add(particle.velocity.clone().multiplyScalar(timestep));
    }
  }

  private handleBoundaryConditions(): void {
    const bounds = {
      minX: -5, maxX: 5,
      minY: 0, maxY: 10,
      minZ: -5, maxZ: 5
    };

    for (const particle of this.particles) {
      // Floor collision
      if (particle.position.y < bounds.minY) {
        particle.position.y = bounds.minY;
        particle.velocity.y *= -this.damping;
      }

      // Wall collisions
      if (particle.position.x < bounds.minX) {
        particle.position.x = bounds.minX;
        particle.velocity.x *= -this.damping;
      }
      if (particle.position.x > bounds.maxX) {
        particle.position.x = bounds.maxX;
        particle.velocity.x *= -this.damping;
      }
      if (particle.position.z < bounds.minZ) {
        particle.position.z = bounds.minZ;
        particle.velocity.z *= -this.damping;
      }
      if (particle.position.z > bounds.maxZ) {
        particle.position.z = bounds.maxZ;
        particle.velocity.z *= -this.damping;
      }
    }
  }

  // SPH Kernel Functions
  private poly6Kernel(q: number): number {
    if (q >= 1) return 0;
    const factor = 315 / (64 * Math.PI * Math.pow(this.smoothingRadius, 9));
    return factor * Math.pow(1 - q * q, 3);
  }

  private spikyKernelGradient(q: number): number {
    if (q >= 1) return 0;
    const factor = -45 / (Math.PI * Math.pow(this.smoothingRadius, 6));
    return factor * Math.pow(1 - q, 2);
  }

  private viscosityKernelLaplacian(q: number): number {
    if (q >= 1) return 0;
    const factor = 45 / (Math.PI * Math.pow(this.smoothingRadius, 6));
    return factor * (1 - q);
  }
}
