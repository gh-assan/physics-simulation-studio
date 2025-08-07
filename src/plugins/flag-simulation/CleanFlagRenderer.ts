import { FlagComponent } from "./FlagComponent";
import { PoleComponent } from "./PoleComponent";
import * as THREE from "three";

/**
 * Clean flag mesh creation utilities
 * No debug code, optimized for production use
 */

export function createFlagMesh(flag: FlagComponent): THREE.Mesh {
  const geometry = new THREE.BufferGeometry();
  const segX = flag.segmentsX;
  const segY = flag.segmentsY;

  // Create vertex and index arrays
  const vertices: number[] = [];
  const indices: number[] = [];

  // Generate vertices from flag points
  for (let y = 0; y <= segY; y++) {
    for (let x = 0; x <= segX; x++) {
      const idx = y * (segX + 1) + x;
      const point = flag.points[idx];
      vertices.push(point.position.x, point.position.y, point.position.z);
    }
  }

  // Generate indices for triangulated quads
  for (let y = 0; y < segY; y++) {
    for (let x = 0; x < segX; x++) {
      const i0 = y * (segX + 1) + x;
      const i1 = i0 + 1;
      const i2 = i0 + (segX + 1);
      const i3 = i2 + 1;
      indices.push(i0, i2, i1, i1, i2, i3);
    }
  }

  // Set geometry attributes
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  // Create material with texture if available
  const material = flag.textureUrl
    ? new THREE.MeshLambertMaterial({
        map: new THREE.TextureLoader().load(flag.textureUrl),
        side: THREE.DoubleSide
      })
    : new THREE.MeshLambertMaterial({
        color: 0x0077ff,
        side: THREE.DoubleSide
      });

  return new THREE.Mesh(geometry, material);
}

export function createPoleMesh(pole: PoleComponent): THREE.Mesh {
  const geometry = new THREE.CylinderGeometry(0.05, 0.05, pole.height, 8);
  const material = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
  return new THREE.Mesh(geometry, material);
}
