import { CelestialBodyComponent } from "./components";
import * as THREE from "three";

export function createCelestialBodyMesh(body: CelestialBodyComponent, color: string): THREE.Mesh {
  // Use a sphere geometry with segments for smoothness
  const geometry = new THREE.SphereGeometry(1, 32, 32);
  const material = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.1 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = body.name;
  return mesh;
}
