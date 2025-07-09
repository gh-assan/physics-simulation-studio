import { FlagComponent } from "./FlagComponent";
import * as THREE from "three";

export function createFlagMesh(flag: FlagComponent): THREE.Mesh {
  const geometry = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const indices: number[] = [];
  const segX = flag.segmentsX;
  const segY = flag.segmentsY;
  // Vertices
  for (let y = 0; y <= segY; ++y) {
    for (let x = 0; x <= segX; ++x) {
      const idx = y * (segX + 1) + x;
      const p = flag.points[idx];
      vertices.push(p.position.x, p.position.y, p.position.z);
    }
  }
  // Indices (two triangles per quad)
  for (let y = 0; y < segY; ++y) {
    for (let x = 0; x < segX; ++x) {
      const i0 = y * (segX + 1) + x;
      const i1 = i0 + 1;
      const i2 = i0 + (segX + 1);
      const i3 = i2 + 1;
      indices.push(i0, i2, i1);
      indices.push(i1, i2, i3);
    }
  }
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3)
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide
  });
  return new THREE.Mesh(geometry, material);
}
