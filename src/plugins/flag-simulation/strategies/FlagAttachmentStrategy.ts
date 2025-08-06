import { Vector3 } from "../utils/Vector3";

export interface FlagAttachmentStrategy {
  shouldAttachPoint(x: number, y: number, numCols: number, numRows: number): boolean;
  calculatePosition(
    polePosition: Vector3,
    poleHeight: number,
    flagWidth: number,
    x: number,
    y: number,
    numCols: number,
    numRows: number
  ): Vector3;
}

export class LeftAttachmentStrategy implements FlagAttachmentStrategy {
  shouldAttachPoint(x: number, y: number, numCols: number, numRows: number): boolean {
    const isLeftCol = x === 0;
    const isBottomRow = y === 0;
    const isTopRow = y === numRows - 1;
    return isLeftCol && (isBottomRow || isTopRow);
  }

  calculatePosition(
    polePosition: Vector3,
    poleHeight: number,
    flagWidth: number,
    x: number,
    y: number,
    numCols: number,
    numRows: number
  ): Vector3 {
    const isTopRow = y === numRows - 1;
    return new Vector3(
      polePosition.x,
      isTopRow ? polePosition.y + poleHeight : polePosition.y,
      polePosition.z
    );
  }
}

export class RightAttachmentStrategy implements FlagAttachmentStrategy {
  shouldAttachPoint(x: number, y: number, numCols: number, numRows: number): boolean {
    const isRightCol = x === numCols - 1;
    const isBottomRow = y === 0;
    const isTopRow = y === numRows - 1;
    return isRightCol && (isBottomRow || isTopRow);
  }

  calculatePosition(
    polePosition: Vector3,
    poleHeight: number,
    flagWidth: number,
    x: number,
    y: number,
    numCols: number,
    numRows: number
  ): Vector3 {
    const isTopRow = y === numRows - 1;
    return new Vector3(
      polePosition.x,
      isTopRow ? polePosition.y + poleHeight : polePosition.y,
      polePosition.z
    );
  }
}

export class TopAttachmentStrategy implements FlagAttachmentStrategy {
  shouldAttachPoint(x: number, y: number, numCols: number, numRows: number): boolean {
    const isTopRow = y === numRows - 1;
    const isLeftCol = x === 0;
    const isRightCol = x === numCols - 1;
    return isTopRow && (isLeftCol || isRightCol);
  }

  calculatePosition(
    polePosition: Vector3,
    poleHeight: number,
    flagWidth: number,
    x: number,
    y: number,
    numCols: number,
    numRows: number
  ): Vector3 {
    const isRightCol = x === numCols - 1;
    return new Vector3(
      polePosition.x + (isRightCol ? flagWidth / 2 : -flagWidth / 2),
      polePosition.y,
      polePosition.z
    );
  }
}

export class BottomAttachmentStrategy implements FlagAttachmentStrategy {
  shouldAttachPoint(x: number, y: number, numCols: number, numRows: number): boolean {
    const isBottomRow = y === 0;
    const isLeftCol = x === 0;
    const isRightCol = x === numCols - 1;
    return isBottomRow && (isLeftCol || isRightCol);
  }

  calculatePosition(
    polePosition: Vector3,
    poleHeight: number,
    flagWidth: number,
    x: number,
    y: number,
    numCols: number,
    numRows: number
  ): Vector3 {
    const isRightCol = x === numCols - 1;
    return new Vector3(
      polePosition.x + (isRightCol ? flagWidth / 2 : -flagWidth / 2),
      polePosition.y,
      polePosition.z
    );
  }
}

export class FlagAttachmentStrategyFactory {
  static create(attachedEdge: string): FlagAttachmentStrategy {
    const strategies = new Map<string, FlagAttachmentStrategy>([
      ['left', new LeftAttachmentStrategy()],
      ['right', new RightAttachmentStrategy()],
      ['top', new TopAttachmentStrategy()],
      ['bottom', new BottomAttachmentStrategy()]
    ]);

    const strategy = strategies.get(attachedEdge);
    if (!strategy) {
      throw new Error(`Unknown attachment edge: ${attachedEdge}`);
    }

    return strategy;
  }
}
