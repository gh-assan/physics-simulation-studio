import { IComponent } from "../../core/ecs/IComponent";
import { PointMass } from "./utils/PointMass";
import { Spring } from "./utils/Spring";
import { Vector3 } from "./utils/Vector3";
import { RenderableComponent } from "../../core/ecs/RenderableComponent";

export class FlagComponent implements IComponent {
  public static readonly type = "FlagComponent";
  readonly type = FlagComponent.type;
  public simulationType = "flag-simulation";
  // Flag dimensions
  width: number;
  height: number;
  segmentsX: number;
  segmentsY: number;

  // Pole attachment
  poleEntityId: number | null = null;
  attachedEdge: "left" | "right" | "top" | "bottom";

  // Material properties
  mass: number; // Mass of each point in the grid
  textureUrl: string;

  // Spring properties
  stiffness: number;
  damping: number;

  // Initial grid of points (masses)
  // This will be an array of {x, y, z} objects representing the initial position of each point
  initialPoints: { x: number; y: number; z: number }[];
  points: PointMass[];
  springs: Spring[];

  // Physics properties
  gravity: { x: number; y: number; z: number }; // Moved from FlagSystem

  // Add wind properties for UI controls
  windStrength: number;
  windDirection: { x: number; y: number; z: number };

  public renderable: RenderableComponent;

  constructor(
    width = 10,
    height = 6,
    segmentsX = 10,
    segmentsY = 6,
    mass = 0.1,
    stiffness = 0.5,
    damping = 0.05,
    textureUrl = "",
    windStrength = 0,
    windDirection = { x: 1, y: 0, z: 0 },
    gravity = { x: 0, y: -9.81, z: 0 },
    poleEntityId: number | null = null,
    attachedEdge: "left" | "right" | "top" | "bottom" = "left"
  ) {
    this.renderable = new RenderableComponent("plane", 0xffffff);
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
    this.poleEntityId = poleEntityId;
    this.attachedEdge = attachedEdge;
    this.windDirection = windDirection;
    this.gravity = gravity;
  }

  // Add setters to keep wind vector in sync
  setWind(strength: number, direction: { x: number; y: number; z: number }) {
    this.windStrength = strength;
    this.windDirection = { ...direction };
  }

  get wind() {
    return {
      x: this.windStrength * this.windDirection.x,
      y: this.windStrength * this.windDirection.y,
      z: this.windStrength * this.windDirection.z
    };
  }

  private generateInitialPoints(): { x: number; y: number; z: number }[] {
    const points: { x: number; y: number; z: number }[] = [];
    const segmentWidth = this.width / this.segmentsX;
    const segmentHeight = this.height / this.segmentsY;

    for (let y = 0; y <= this.segmentsY; y++) {
      for (let x = 0; x <= this.segmentsX; x++) {
        points.push({
          x: x * segmentWidth - this.width / 2,
          y: y * segmentHeight,
          z: 0
        });
      }
    }
    return points;
  }

  /**
   * Determines if the flag is visible.
   * @returns True if the flag is visible, false otherwise.
   */
  public isVisible(): boolean {
    // Placeholder logic for visibility; update as needed
    return true;
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
      { ...this.windDirection },
      { ...this.gravity },
      this.poleEntityId,
      this.attachedEdge
    );
  }
}
