// src/studio/utils/ThreeJsUtils.ts

import * as THREE from 'three';
import {RenderableComponent} from '@core/components/RenderableComponent';

export function createGeometry(
  geometryType: RenderableComponent['geometry'],
): THREE.BufferGeometry {
  switch (geometryType) {
    case 'box':
      return new THREE.BoxGeometry();
    case 'sphere':
      return new THREE.SphereGeometry();
    case 'cylinder':
      return new THREE.CylinderGeometry();
    case 'cone':
      return new THREE.ConeGeometry();
    case 'plane':
      return new THREE.PlaneGeometry();
    default:
      return new THREE.BoxGeometry(); // Default to box
  }
}

export function disposeThreeJsObject(object: THREE.Object3D): void {
  if (object instanceof THREE.Mesh) {
    if (object.geometry) {
      object.geometry.dispose();
    }
    if (object.material) {
      if (Array.isArray(object.material)) {
        object.material.forEach(material => material.dispose());
      } else {
        object.material.dispose();
      }
    }
  }
}
