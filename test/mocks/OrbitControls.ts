import * as THREE from 'three';

export class OrbitControls {
  object: THREE.Camera;
  domElement: HTMLElement;
  enabled = true;
  target: THREE.Vector3 = new THREE.Vector3();

  constructor(object: THREE.Camera, domElement: HTMLElement) {
    this.object = object;
    this.domElement = domElement;
  }

  update(): boolean {
    return false;
  }

  dispose(): void {
    // Mock disposal
  }

  reset(): void {
    // Mock reset
  }
}
