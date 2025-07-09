import { FlagComponent } from "../FlagComponent";
import { PositionComponent } from "../../../core/components/PositionComponent";
import { PointMass } from "./PointMass";
import { Spring } from "./Spring";
import { Vector3 } from "./Vector3";

export class FlagPhysicsInitializer {
  static initializeFlag(
    flagComponent: FlagComponent,
    positionComponent: PositionComponent
  ): void {
    flagComponent.points = [];
    flagComponent.springs = [];

    const numRows = flagComponent.segmentsY + 1;
    const numCols = flagComponent.segmentsX + 1;
    const segmentWidth = flagComponent.width / flagComponent.segmentsX;
    const segmentHeight = flagComponent.height / flagComponent.segmentsY;

    // Create PointMass objects
    for (let y = 0; y < numRows; y++) {
      for (let x = 0; x < numCols; x++) {
        const isFixed = x === 0; // Left column is fixed
        const position = new Vector3(
          positionComponent.x + x * segmentWidth - flagComponent.width / 2,
          positionComponent.y + y * segmentHeight,
          positionComponent.z
        );
        const pointMass = new PointMass(position, flagComponent.mass, isFixed);
        flagComponent.points.push(pointMass);
      }
    }

    // Create springs
    for (let y = 0; y < numRows; y++) {
      for (let x = 0; x < numCols; x++) {
        const p1Index = y * numCols + x;
        const p1 = flagComponent.points[p1Index];

        // Structural springs (horizontal and vertical)
        if (x < numCols - 1) {
          // Horizontal
          const p2 = flagComponent.points[y * numCols + x + 1];
          flagComponent.springs.push(
            new Spring(
              p1,
              p2,
              segmentWidth,
              flagComponent.stiffness,
              flagComponent.damping
            )
          );
        }
        if (y < numRows - 1) {
          // Vertical
          const p2 = flagComponent.points[(y + 1) * numCols + x];
          flagComponent.springs.push(
            new Spring(
              p1,
              p2,
              segmentHeight,
              flagComponent.stiffness,
              flagComponent.damping
            )
          );
        }

        // Shear springs (diagonal)
        if (x < numCols - 1 && y < numRows - 1) {
          // Diagonal \\
          const p2 = flagComponent.points[(y + 1) * numCols + x + 1];
          const restLength = Math.sqrt(
            segmentWidth * segmentWidth + segmentHeight * segmentHeight
          );
          flagComponent.springs.push(
            new Spring(
              p1,
              p2,
              restLength,
              flagComponent.stiffness,
              flagComponent.damping
            )
          );
          // Diagonal //
          const p3 = flagComponent.points[(y + 1) * numCols + x - 1];
          if (x > 0) {
            flagComponent.springs.push(
              new Spring(
                p1,
                p3,
                restLength,
                flagComponent.stiffness,
                flagComponent.damping
              )
            );
          }
        }

        // Bend springs (every other point)
        if (x < numCols - 2) {
          // Horizontal bend
          const p2 = flagComponent.points[y * numCols + x + 2];
          flagComponent.springs.push(
            new Spring(
              p1,
              p2,
              segmentWidth * 2,
              flagComponent.stiffness,
              flagComponent.damping
            )
          );
        }
        if (y < numRows - 2) {
          // Vertical bend
          const p2 = flagComponent.points[(y + 2) * numCols + x];
          flagComponent.springs.push(
            new Spring(
              p1,
              p2,
              segmentHeight * 2,
              flagComponent.stiffness,
              flagComponent.damping
            )
          );
        }
      }
    }
  }
}
