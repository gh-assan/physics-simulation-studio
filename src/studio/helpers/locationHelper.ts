// Placeholder for locationHelper.ts

/**
 * Utility function to calculate relative positions.
 * @param x The x-coordinate.
 * @param y The y-coordinate.
 * @returns The relative position as a string.
 */
export function calculateRelativePosition(x: number, y: number): string {
  return `Relative position: (${x}, ${y})`;
}

/**
 * Utility function to calculate the distance between two points.
 * @param x1 The x-coordinate of the first point.
 * @param y1 The y-coordinate of the first point.
 * @param x2 The x-coordinate of the second point.
 * @param y2 The y-coordinate of the second point.
 * @returns The distance between the two points.
 */
export function calculateDistance(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

/**
 * Utility function to check if a point is within a given rectangle.
 * @param x The x-coordinate of the point.
 * @param y The y-coordinate of the point.
 * @param rectX The x-coordinate of the rectangle's top-left corner.
 * @param rectY The y-coordinate of the rectangle's top-left corner.
 * @param rectWidth The width of the rectangle.
 * @param rectHeight The height of the rectangle.
 * @returns True if the point is within the rectangle, false otherwise.
 */
export function isPointInRectangle(
  x: number,
  y: number,
  rectX: number,
  rectY: number,
  rectWidth: number,
  rectHeight: number,
): boolean {
  return (
    x >= rectX &&
    x <= rectX + rectWidth &&
    y >= rectY &&
    y <= rectY + rectHeight
  );
}
