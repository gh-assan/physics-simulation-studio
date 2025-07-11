import { Vector3 } from "./Vector3";

export class SpatialHasher {
  private cellSize: number;
  private table: Map<string, number[]> = new Map(); // Map cell ID to array of entity IDs

  constructor(cellSize: number) {
    this.cellSize = cellSize;
  }

  // Generates a unique string key for a 3D grid cell
  private getCellId(position: Vector3): string {
    const x = Math.floor(position.x / this.cellSize);
    const y = Math.floor(position.y / this.cellSize);
    const z = Math.floor(position.z / this.cellSize);
    return `${x},${y},${z}`;
  }

  // Adds an entity to the spatial hash table
  add(entityId: number, position: Vector3): void {
    const cellId = this.getCellId(position);
    if (!this.table.has(cellId)) {
      this.table.set(cellId, []);
    }
    this.table.get(cellId)?.push(entityId);
  }

  // Retrieves potential neighbors for a given position
  getNeighbors(position: Vector3): number[] {
    const neighbors: number[] = [];
    const x = Math.floor(position.x / this.cellSize);
    const y = Math.floor(position.y / this.cellSize);
    const z = Math.floor(position.z / this.cellSize);

    // Check current cell and 26 surrounding cells
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        for (let k = -1; k <= 1; k++) {
          const cellId = `${x + i},${y + j},${z + k}`;
          if (this.table.has(cellId)) {
            neighbors.push(...this.table.get(cellId)!);
          }
        }
      }
    }
    return neighbors;
  }

  // Clears the hash table for a new frame
  clear(): void {
    this.table.clear();
  }
}
