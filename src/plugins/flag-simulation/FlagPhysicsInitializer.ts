import {FlagComponent} from './FlagComponent';
import {PositionComponent} from '../../core/components/PositionComponent';
import {PointMass, Spring} from './types';

export class FlagPhysicsInitializer {
  public static initializeFlag(
    flagComponent: FlagComponent,
    positionComponent: PositionComponent,
  ): void {
    flagComponent.points = [];
    flagComponent.springs = [];

    const segmentWidth = flagComponent.width / flagComponent.segmentsX;
    const segmentHeight = flagComponent.height / flagComponent.segmentsY;

    // Create point masses
    for (let y = 0; y <= flagComponent.segmentsY; y++) {
      for (let x = 0; x <= flagComponent.segmentsX; x++) {
        const initialPoint =
          flagComponent.initialPoints[y * (flagComponent.segmentsX + 1) + x];
        const pointMass: PointMass = {
          position: {
            x: positionComponent.x + initialPoint.x,
            y: positionComponent.y + initialPoint.y,
            z: positionComponent.z + initialPoint.z,
          },
          previousPosition: {
            x: positionComponent.x + initialPoint.x,
            y: positionComponent.y + initialPoint.y,
            z: positionComponent.z + initialPoint.z,
          },
          velocity: {x: 0, y: 0, z: 0},
          forces: {x: 0, y: 0, z: 0},
          mass: flagComponent.mass,
          isFixed:
            (x === 0 && y === 0) || (x === 0 && y === flagComponent.segmentsY), // Fix top-left and bottom-left corners
        };
        flagComponent.points.push(pointMass);
      }
    }

    // Create springs
    for (let y = 0; y <= flagComponent.segmentsY; y++) {
      for (let x = 0; x <= flagComponent.segmentsX; x++) {
        const p1Index = y * (flagComponent.segmentsX + 1) + x;
        const p1 = flagComponent.points[p1Index];

        // Structural springs (horizontal and vertical)
        if (x < flagComponent.segmentsX) {
          const p2 = flagComponent.points[p1Index + 1];
          flagComponent.springs.push(
            FlagPhysicsInitializer.createSpring(
              p1,
              p2,
              'structural',
              segmentWidth,
              flagComponent.stiffness,
              flagComponent.damping,
            ),
          );
        }
        if (y < flagComponent.segmentsY) {
          const p2 =
            flagComponent.points[p1Index + (flagComponent.segmentsX + 1)];
          flagComponent.springs.push(
            FlagPhysicsInitializer.createSpring(
              p1,
              p2,
              'structural',
              segmentHeight,
              flagComponent.stiffness,
              flagComponent.damping,
            ),
          );
        }

        // Shear springs (diagonal)
        if (x < flagComponent.segmentsX && y < flagComponent.segmentsY) {
          const p2 =
            flagComponent.points[p1Index + 1 + (flagComponent.segmentsX + 1)];
          flagComponent.springs.push(
            FlagPhysicsInitializer.createSpring(
              p1,
              p2,
              'shear',
              Math.sqrt(
                segmentWidth * segmentWidth + segmentHeight * segmentHeight,
              ),
              flagComponent.stiffness,
              flagComponent.damping,
            ),
          );

          const p3 =
            flagComponent.points[p1Index + (flagComponent.segmentsX + 1) - 1];
          if (x > 0) {
            flagComponent.springs.push(
              FlagPhysicsInitializer.createSpring(
                p1,
                p3,
                'shear',
                Math.sqrt(
                  segmentWidth * segmentWidth + segmentHeight * segmentHeight,
                ),
                flagComponent.stiffness,
                flagComponent.damping,
              ),
            );
          }
        }

        // Bend springs (every other point)
        if (x < flagComponent.segmentsX - 1) {
          const p2 = flagComponent.points[p1Index + 2];
          flagComponent.springs.push(
            FlagPhysicsInitializer.createSpring(
              p1,
              p2,
              'bend',
              segmentWidth * 2,
              flagComponent.stiffness,
              flagComponent.damping,
            ),
          );
        }
        if (y < flagComponent.segmentsY - 1) {
          const p2 =
            flagComponent.points[p1Index + 2 * (flagComponent.segmentsX + 1)];
          flagComponent.springs.push(
            FlagPhysicsInitializer.createSpring(
              p1,
              p2,
              'bend',
              segmentHeight * 2,
              flagComponent.stiffness,
              flagComponent.damping,
            ),
          );
        }
      }
    }
  }

  private static createSpring(
    p1: PointMass,
    p2: PointMass,
    type: Spring['type'],
    restLength: number,
    stiffness: number,
    damping: number,
  ): Spring {
    return {p1, p2, restLength, stiffness, damping, type};
  }
}
