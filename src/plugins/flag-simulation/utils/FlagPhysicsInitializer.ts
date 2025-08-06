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

    const poleInfo = this.getPoleInfo(flagComponent, world);

    // Create PointMass objects
    for (let y = 0; y < numRows; y++) {
      for (let x = 0; x < numCols; x++) {
        const pointInfo = this.createPoint(
          x, y, numCols, numRows,
          flagComponent, positionComponent,
          poleInfo, segmentWidth, segmentHeight
        );

        const position = new Vector3(pointInfo.x, pointInfo.y, pointInfo.z);
        const pointMass = new PointMass(position, flagComponent.mass, pointInfo.isFixed);
        flagComponent.points.push(pointMass);
      }
    }

    this.createSprings(flagComponent, numRows, numCols, segmentWidth, segmentHeight);
  }

  private static getPoleInfo(flagComponent: FlagComponent, world: World) {
    if (flagComponent.poleEntityId === null) {
      return null;
    }

    const poleEntity = world.entityManager.getEntityById(flagComponent.poleEntityId);
    if (poleEntity === undefined) {
      return null;
    }

    const poleComp = world.componentManager.getComponent(poleEntity, PoleComponent.type) as PoleComponent;
    if (!poleComp) {
      return null;
    }

    return {
      position: poleComp.position,
      height: poleComp.height
    };
  }

  private static createPoint(
    x: number, y: number, numCols: number, numRows: number,
    flagComponent: FlagComponent, positionComponent: PositionComponent,
    poleInfo: any, segmentWidth: number, segmentHeight: number
  ) {
    const isTopRow = y === numRows - 1;
    const isBottomRow = y === 0;
    const isLeftCol = x === 0;
    const isRightCol = x === numCols - 1;

    const isFixed = poleInfo && this.shouldPointBeFixed(
      flagComponent.attachedEdge, isTopRow, isBottomRow, isLeftCol, isRightCol
    );

    if (isFixed) {
      return this.calculatePoleAttachmentPosition(
        flagComponent.attachedEdge, poleInfo,
        isTopRow, isBottomRow, isLeftCol, isRightCol,
        flagComponent.width
      );
    }

    // Standard grid position
    return {
      x: positionComponent.x + x * segmentWidth - flagComponent.width / 2,
      y: positionComponent.y + y * segmentHeight,
      z: positionComponent.z,
      isFixed: false
    };
  }

  private static shouldPointBeFixed(
    attachedEdge: string,
    isTopRow: boolean, isBottomRow: boolean, isLeftCol: boolean, isRightCol: boolean
  ): boolean {
    switch (attachedEdge) {
      case "left": return isLeftCol && (isTopRow || isBottomRow);
      case "right": return isRightCol && (isTopRow || isBottomRow);
      case "top": return isTopRow && (isLeftCol || isRightCol);
      case "bottom": return isBottomRow && (isLeftCol || isRightCol);
      default: return false;
    }
  }

  private static calculatePoleAttachmentPosition(
    attachedEdge: string, poleInfo: any,
    isTopRow: boolean, isBottomRow: boolean, isLeftCol: boolean, isRightCol: boolean,
    flagWidth: number
  ) {
    const result = {
      x: poleInfo.position.x,
      y: poleInfo.position.y,
      z: poleInfo.position.z,
      isFixed: true
    };

    if (attachedEdge === "left" || attachedEdge === "right") {
      result.y = isBottomRow ? poleInfo.position.y : poleInfo.position.y + poleInfo.height;
      return result;
    }

    result.x = isLeftCol
      ? poleInfo.position.x - flagWidth / 2
      : poleInfo.position.x + flagWidth / 2;

    return result;
  }

  private static createSprings(
    flagComponent: FlagComponent,
    numRows: number, numCols: number,
    segmentWidth: number, segmentHeight: number
  ): void {
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
