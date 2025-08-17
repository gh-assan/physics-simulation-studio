/**
 * Flag Physics Engine
 *
 * Core cloth simulation physics extracted from FlagAlgorithm
 * for better modularity and testing.
 */

import { Vector3 } from '../utils/Vector3';
import { ClothPoint, ClothSpring, FlagPhysicsConfig } from '../types/FlagTypes';

export class FlagPhysicsEngine {
  private points: ClothPoint[] = [];
  private springs: ClothSpring[] = [];
  private config: FlagPhysicsConfig;

  // Flag dimensions (grid size)
  private readonly flagWidth = 10;  // Number of points across
  private readonly flagHeight = 6;  // Number of points down
  private readonly spacing = 0.1;   // Distance between points

  constructor(config?: Partial<FlagPhysicsConfig>) {
    this.config = {
      gravity: new Vector3(0, -9.81, 0),
      wind: new Vector3(2, 0, 1),
      damping: 0.99,
      timestep: 1 / 60,
      stiffness: 0.8,
      flagWidth: this.flagWidth,
      flagHeight: this.flagHeight,
      spacing: this.spacing,
      ...config
    };

    this.initializeClothMesh();
  }

  /**
   * Initialize the cloth mesh with points and springs
   */
  initializeClothMesh(): void {
    this.points = [];
    this.springs = [];

    // Create cloth points
    for (let y = 0; y < this.flagHeight; y++) {
      for (let x = 0; x < this.flagWidth; x++) {
        const id = y * this.flagWidth + x;
        const point: ClothPoint = {
          id,
          position: new Vector3(x * this.spacing, -y * this.spacing, 0),
          previousPosition: new Vector3(x * this.spacing, -y * this.spacing, 0),
          forces: new Vector3(0, 0, 0),
          pinned: x === 0, // Pin left edge to pole
          mass: 1.0
        };
        this.points.push(point);
      }
    }

    // Create springs (structural constraints)
    for (let y = 0; y < this.flagHeight; y++) {
      for (let x = 0; x < this.flagWidth; x++) {
        const i = y * this.flagWidth + x;

        // Horizontal springs
        if (x < this.flagWidth - 1) {
          const j = y * this.flagWidth + (x + 1);
          this.springs.push({
            p1: i,
            p2: j,
            restLength: this.spacing,
            stiffness: this.config.stiffness
          });
        }

        // Vertical springs
        if (y < this.flagHeight - 1) {
          const j = (y + 1) * this.flagWidth + x;
          this.springs.push({
            p1: i,
            p2: j,
            restLength: this.spacing,
            stiffness: this.config.stiffness
          });
        }
      }
    }

    console.log(`🏁 Initialized ${this.points.length} cloth points and ${this.springs.length} springs`);
  }

  /**
   * Update physics simulation
   */
  update(deltaTime: number): void {
    this.applyForces();
    this.integrate(deltaTime);
    this.satisfyConstraints();
  }

  /**
   * Apply forces to all points (gravity, wind, etc.)
   */
  private applyForces(): void {
    for (const point of this.points) {
      if (point.pinned) continue;

      // Reset forces
      point.forces = new Vector3(0, 0, 0);

      // Apply gravity
      point.forces = point.forces.add(this.config.gravity.multiplyScalar(point.mass));

      // Apply wind force (simple model)
      const windForce = this.config.wind.multiplyScalar(0.5);
      point.forces = point.forces.add(windForce);
    }
  }

  /**
   * Integrate using Verlet integration
   */
  private integrate(deltaTime: number): void {
    for (const point of this.points) {
      if (point.pinned) continue;

      // Verlet integration
      const acceleration = point.forces.multiplyScalar(1 / point.mass);
      const newPosition = point.position
        .multiplyScalar(2)
        .subtract(point.previousPosition.multiplyScalar(this.config.damping))
        .add(acceleration.multiplyScalar(deltaTime * deltaTime));

      point.previousPosition = new Vector3(point.position.x, point.position.y, point.position.z);
      point.position = newPosition;
    }
  }

  /**
   * Satisfy spring constraints
   */
  private satisfyConstraints(): void {
    // Multiple iterations for stability
    const iterations = 3;

    for (let iter = 0; iter < iterations; iter++) {
      for (const spring of this.springs) {
        const p1 = this.points[spring.p1];
        const p2 = this.points[spring.p2];

        const delta = p2.position.subtract(p1.position);
        const distance = delta.magnitude();

        if (distance === 0) continue;

        const difference = (distance - spring.restLength) / distance;
        const correction = delta.multiplyScalar(difference * 0.5);

        if (!p1.pinned) {
          p1.position = p1.position.add(correction);
        }
        if (!p2.pinned) {
          p2.position = p2.position.subtract(correction);
        }
      }
    }
  }

  /**
   * Update physics configuration
   */
  updateConfig(updates: Partial<FlagPhysicsConfig>): void {
    this.config = { ...this.config, ...updates };

    // Update spring stiffness if changed
    if (updates.stiffness !== undefined) {
      this.springs.forEach(spring => {
        spring.stiffness = updates.stiffness!;
      });
    }
  }

  /**
   * Get current cloth points (for rendering)
   */
  getClothPoints(): ClothPoint[] {
    return [...this.points]; // Return copy to prevent external modification
  }

  /**
   * Get current springs (for debugging)
   */
  getSprings(): ClothSpring[] {
    return [...this.springs]; // Return copy to prevent external modification
  }

  /**
   * Get current physics configuration
   */
  getConfig(): FlagPhysicsConfig {
    return { ...this.config }; // Return copy
  }

  /**
   * Reset simulation to initial state
   */
  reset(): void {
    this.initializeClothMesh();
  }

  /**
   * Dispose and cleanup
   */
  dispose(): void {
    this.points = [];
    this.springs = [];
  }
}
