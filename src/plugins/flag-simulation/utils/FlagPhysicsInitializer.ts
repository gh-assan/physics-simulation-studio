import { FlagComponent } from "../FlagComponent";
import { PositionComponent } from "../../../core/components/PositionComponent";
import { PointMass } from "./PointMass";
import { Spring } from "./Spring";
import { Vector3 } from "./Vector3";
import { World } from "../../../core/ecs/World";
import { PoleComponent } from "../PoleComponent";

export class FlagPhysicsInitializer {
  static initializeFlag(
    flagComponent: FlagComponent,
    positionComponent: PositionComponent,
    world: World
  ): void {
    flagComponent.points = [];
    flagComponent.springs = [];

    const numRows = flagComponent.segmentsY + 1;
    const numCols = flagComponent.segmentsX + 1;
    const segmentWidth = flagComponent.width / flagComponent.segmentsX;
    const segmentHeight = flagComponent.height / flagComponent.segmentsY;

    let polePosition: Vector3 | null = null;
    let poleHeight: number = 0; // Initialize poleHeight

    if (flagComponent.poleEntityId !== null) {
      const poleEntity = world.entityManager.getEntityById(flagComponent.poleEntityId);
      if (poleEntity !== undefined) {
        const poleComp = world.componentManager.getComponent(
          poleEntity,
          PoleComponent.type
        ) as PoleComponent;
        if (poleComp) {
          polePosition = poleComp.position;
          poleHeight = poleComp.height;
        }
      }
    }

    // Create PointMass objects
    for (let y = 0; y < numRows; y++) {
      for (let x = 0; x < numCols; x++) {
        let isFixed = false;
        let finalPointX: number;
        let finalPointY: number;
        let finalPointZ: number;

        // Determine if this point is one of the two fixed corners
        const isTopRow = y === numRows - 1;
        const isBottomRow = y === 0;
        const isLeftCol = x === 0;
        const isRightCol = x === numCols - 1;

        if (polePosition) { // Only consider fixing if a pole exists
          switch (flagComponent.attachedEdge) {
            case 'left':
              isFixed = isLeftCol && (isTopRow || isBottomRow);
              break;
            case 'right':
              isFixed = isRightCol && (isTopRow || isBottomRow);
              break;
            case 'top':
              isFixed = isTopRow && (isLeftCol || isRightCol);
              break;
            case 'bottom':
              isFixed = isBottomRow && (isLeftCol || isRightCol);
              break;
          }
        }

        if (isFixed && polePosition) {
          // Set position directly to pole attachment point
          finalPointZ = polePosition.z; // Assume flag is in the same Z plane as pole

          if (flagComponent.attachedEdge === 'left' || flagComponent.attachedEdge === 'right') {
            finalPointX = polePosition.x;
            if (isBottomRow) {
              finalPointY = polePosition.y; // Bottom of pole
            } else { // isTopRow
              finalPointY = polePosition.y + poleHeight; // Top of pole
            }
          } else { // 'top' or 'bottom' attachedEdge
            finalPointY = polePosition.y; // Assume horizontal attachment at pole's base Y
            if (isLeftCol) {
              finalPointX = polePosition.x - flagComponent.width / 2; // Left end of flag
            } else { // isRightCol
              finalPointX = polePosition.x + flagComponent.width / 2; // Right end of flag
            }
          }
          console.log(`[FlagPhysicsInitializer] Fixed point (${x},${y}) - Adjusted to Pole: (${finalPointX}, ${finalPointY}, ${finalPointZ})`);
        } else {
          // Calculate initial position relative to flag's positionComponent
          finalPointX = positionComponent.x + x * segmentWidth - flagComponent.width / 2;
          finalPointY = positionComponent.y + y * segmentHeight;
          finalPointZ = positionComponent.z;
        }

        const position = new Vector3(
          finalPointX,
          finalPointY,
          finalPointZ
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