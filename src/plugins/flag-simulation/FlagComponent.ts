import {IComponent} from '../../core/ecs/IComponent';
import {PointMass, Spring} from './types';
import {Vector3} from './utils/Vector3';

export class FlagComponent implements IComponent<FlagComponent> {
  // Flag dimensions
  width: number;
  height: number;
  segmentsX: number;
  segmentsY: number;

  // Material properties
  mass: number; // Mass of each point in the grid
  textureUrl: string;

  // Spring properties
  stiffness: number;
  damping: number;

  // Initial grid of points (masses)
  // This will be an array of {x, y, z} objects representing the initial position of each point
  initialPoints: {x: number; y: number; z: number}[];
  points: PointMass[];
  springs: Spring[];

  // Add wind properties for UI controls
  windStrength: number;
  windDirection: Vector3;

  constructor(
    width = 10,
    height = 6,
    segmentsX = 10,
    segmentsY = 6,
    mass = 0.1,
    stiffness = 0.5,
    damping = 0.05,
    textureUrl = '',
    windStrength = 0,
    windDirection?: Vector3 | {x: number; y: number; z: number} | null,
  ) {
    this.width = width;
    this.height = height;
    this.segmentsX = segmentsX;
    this.segmentsY = segmentsY;
    this.mass = mass;
    this.stiffness = stiffness;
    this.damping = damping;
    this.textureUrl = textureUrl;
    this.initialPoints = this.generateInitialPoints();
    this.points = [];
    this.springs = [];
    this.windStrength = windStrength;
    // Defensive: always ensure windDirection is a Vector3
    if (windDirection instanceof Vector3) {
      this.windDirection = windDirection;
    } else if (windDirection && typeof windDirection === 'object') {
      this.windDirection = new Vector3(
        typeof windDirection.x === 'number' ? windDirection.x : 1,
        typeof windDirection.y === 'number' ? windDirection.y : 0,
        typeof windDirection.z === 'number' ? windDirection.z : 0,
      );
    } else {
      this.windDirection = new Vector3(1, 0, 0);
    }
  }

  // Add setters to keep wind vector in sync
  setWind(strength: number, direction: Vector3) {
    this.windStrength = strength;
    this.windDirection = direction.clone();
  }

  get wind(): Vector3 {
    return this.windDirection.scale(this.windStrength);
  }

  private generateInitialPoints(): {x: number; y: number; z: number}[] {
    const points: {x: number; y: number; z: number}[] = [];
    const segmentWidth = this.width / this.segmentsX;
    const segmentHeight = this.height / this.segmentsY;

    for (let y = 0; y <= this.segmentsY; y++) {
      for (let x = 0; x <= this.segmentsX; x++) {
        points.push({
          x: x * segmentWidth - this.width / 2,
          y: y * segmentHeight,
          z: 0,
        });
      }
    }
    return points;
  }

  clone(): FlagComponent {
    return new FlagComponent(
      this.width,
      this.height,
      this.segmentsX,
      this.segmentsY,
      this.mass,
      this.stiffness,
      this.damping,
      this.textureUrl,
      this.windStrength,
      this.windDirection.clone(),
    );
  }
}
