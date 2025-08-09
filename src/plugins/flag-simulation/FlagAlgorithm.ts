import { ISimulationState, ISimulationAlgorithm } from '../../core/plugin/EnhancedPluginInterfaces';
import { SimulationManager } from '../../studio/simulation/SimulationManager';
import { IWorld } from '../../core/ecs/IWorld';
import { Vector3 } from './utils/Vector3';

// Internal types for cloth physics
interface ClothPoint {
  id: number;
  position: Vector3;
  previousPosition: Vector3;
  forces: Vector3;
  pinned: boolean;
  mass: number;
}

interface ClothSpring {
  p1: number; // Point index
  p2: number; // Point index
  restLength: number;
  stiffness: number;
}

/**
 * Flag Algorithm - Cloth physics using Verlet integration without rendering
 */
export class FlagAlgorithm implements ISimulationAlgorithm {
  private world: IWorld | null = null;
  private simulationManager: SimulationManager | null = null;
  private points: ClothPoint[] = [];
  private springs: ClothSpring[] = [];

  // Cloth physics constants
  private readonly gravity = new Vector3(0, -9.81, 0);
  private readonly wind = new Vector3(2, 0, 1);
  private readonly damping = 0.99;
  private readonly timestep = 1/60;

  // Flag dimensions
  private readonly flagWidth = 10;  // Number of points across
  private readonly flagHeight = 6;  // Number of points down
  private readonly spacing = 0.1;   // Distance between points

  initialize(simulationManager: SimulationManager): void {
    this.simulationManager = simulationManager;
    this.initializeClothMesh();
    console.log('🏁 FlagAlgorithm initialized with Verlet cloth physics');
  }

  update(timestep: number): void {
    this.applyForces();
    this.integrate(timestep);
    this.satisfyConstraints();
  }

  reset(): void {
    this.initializeClothMesh();
    console.log('🔄 Flag simulation reset to initial state');
  }

  getState(): ISimulationState {
    return {
      entities: new Set(),
      time: 0,
      deltaTime: 0,
      isRunning: false,
      metadata: new Map(),
      points: this.points.map(point => ({
        id: point.id,
        position: {
          x: point.position.x,
          y: point.position.y,
          z: point.position.z
        },
        previousPosition: {
          x: point.previousPosition.x,
          y: point.previousPosition.y,
          z: point.previousPosition.z
        },
        pinned: point.pinned,
        mass: point.mass
      })),
      springs: this.springs.map(spring => ({
        p1: spring.p1,
        p2: spring.p2,
        restLength: spring.restLength,
        stiffness: spring.stiffness
      }))
    };
  }

  setState(state: ISimulationState): void {
    const points = (state as any).points;
    const springs = (state as any).springs;

    if (points && Array.isArray(points)) {
      this.points = points.map((p: any) => ({
        id: p.id,
        position: new Vector3(p.position.x, p.position.y, p.position.z),
        previousPosition: new Vector3(p.previousPosition.x, p.previousPosition.y, p.previousPosition.z),
        forces: new Vector3(0, 0, 0),
        pinned: p.pinned,
        mass: p.mass
      }));
    }

    if (springs && Array.isArray(springs)) {
      this.springs = springs.map((s: any) => ({
        p1: s.p1,
        p2: s.p2,
        restLength: s.restLength,
        stiffness: s.stiffness
      }));
    }
  }

  setWorld(world: IWorld): void {
    this.world = world;
  }

  private initializeClothMesh(): void {
    this.points = [];
    this.springs = [];

    // Create grid of points
    let pointId = 0;
    for (let y = 0; y < this.flagHeight; y++) {
      for (let x = 0; x < this.flagWidth; x++) {
        const position = new Vector3(x * this.spacing, -y * this.spacing, 0);

        this.points.push({
          id: pointId++,
          position: position.clone(),
          previousPosition: position.clone(),
          forces: new Vector3(0, 0, 0),
          pinned: x === 0, // Pin left edge to pole
          mass: 0.1
        });
      }
    }

    // Create structural springs (horizontal and vertical)
    for (let y = 0; y < this.flagHeight; y++) {
      for (let x = 0; x < this.flagWidth; x++) {
        const currentIndex = y * this.flagWidth + x;

        // Right connection
        if (x < this.flagWidth - 1) {
          const rightIndex = y * this.flagWidth + (x + 1);
          this.springs.push({
            p1: currentIndex,
            p2: rightIndex,
            restLength: this.spacing,
            stiffness: 0.8
          });
        }

        // Down connection
        if (y < this.flagHeight - 1) {
          const downIndex = (y + 1) * this.flagWidth + x;
          this.springs.push({
            p1: currentIndex,
            p2: downIndex,
            restLength: this.spacing,
            stiffness: 0.8
          });
        }

        // Diagonal springs for structural integrity
        if (x < this.flagWidth - 1 && y < this.flagHeight - 1) {
          const diagonalIndex = (y + 1) * this.flagWidth + (x + 1);
          this.springs.push({
            p1: currentIndex,
            p2: diagonalIndex,
            restLength: this.spacing * Math.sqrt(2),
            stiffness: 0.5
          });
        }
      }
    }

    console.log(`🏁 Initialized ${this.points.length} cloth points and ${this.springs.length} springs`);
  }

  private applyForces(): void {
    // Reset forces
    this.points.forEach(point => {
      point.forces.set(0, 0, 0);

      if (!point.pinned) {
        // Apply gravity
        point.forces.add(this.gravity.clone().multiplyScalar(point.mass));

        // Apply wind force (simplified)
        point.forces.add(this.wind.clone().multiplyScalar(0.1));
      }
    });
  }

  private integrate(timestep: number): void {
    this.points.forEach(point => {
      if (!point.pinned) {
        // Verlet integration
        const velocity = point.position.clone()
          .subtract(point.previousPosition)
          .multiplyScalar(this.damping);

        const acceleration = point.forces.clone().multiplyScalar(1 / point.mass);

        const newPosition = point.position.clone()
          .add(velocity)
          .add(acceleration.multiplyScalar(timestep * timestep));

        point.previousPosition = point.position.clone();
        point.position = newPosition;
      }
    });
  }

  private satisfyConstraints(): void {
    // Satisfy spring constraints (multiple iterations for stability)
    const iterations = 3;

    for (let iter = 0; iter < iterations; iter++) {
      this.springs.forEach(spring => {
        const p1 = this.points[spring.p1];
        const p2 = this.points[spring.p2];

        const delta = p2.position.clone().subtract(p1.position);
        const currentLength = delta.magnitude();
        const difference = (currentLength - spring.restLength) / currentLength;

        const correction = delta.clone().multiplyScalar(difference * spring.stiffness * 0.5);

        if (!p1.pinned) {
          p1.position.add(correction);
        }
        if (!p2.pinned) {
          p2.position.subtract(correction);
        }
      });
    }
  }
}
