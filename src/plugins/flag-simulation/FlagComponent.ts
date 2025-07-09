import { IComponent } from '../../core/ecs/IComponent';

// PointMass and Spring are defined in FlagSystem, but for type safety and reusability, define them here as well
export interface PointMass {
    position: { x: number; y: number; z: number };
    previousPosition: { x: number; y: number; z: number };
    velocity: { x: number; y: number; z: number };
    forces: { x: number; y: number; z: number };
    mass: number;
    isFixed: boolean;
}

export interface Spring {
    p1: PointMass;
    p2: PointMass;
    restLength: number;
    stiffness: number;
    damping: number;
    type: 'structural' | 'shear' | 'bend';
}

export class FlagComponent implements IComponent {
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
    initialPoints: { x: number, y: number, z: number }[];
    points: PointMass[];
    springs: Spring[];

    // Add wind properties for UI controls
    windStrength: number;
    windDirection: { x: number; y: number; z: number };

    constructor(
        width: number = 10,
        height: number = 6,
        segmentsX: number = 10,
        segmentsY: number = 6,
        mass: number = 0.1,
        stiffness: number = 0.5,
        damping: number = 0.05,
        textureUrl: string = '',
        windStrength: number = 0,
        windDirection: { x: number; y: number; z: number } = { x: 1, y: 0, z: 0 }
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
        // Defensive: always ensure windDirection is an object with x/y/z
        if (!windDirection || typeof windDirection !== 'object') {
            this.windDirection = { x: 1, y: 0, z: 0 };
        } else {
            this.windDirection = {
                x: typeof windDirection.x === 'number' ? windDirection.x : 1,
                y: typeof windDirection.y === 'number' ? windDirection.y : 0,
                z: typeof windDirection.z === 'number' ? windDirection.z : 0
            };
        }
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

    private generateInitialPoints(): { x: number, y: number, z: number }[] {
        const points: { x: number, y: number, z: number }[] = [];
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
}