import * as THREE from 'three';
import { MaterialDisposer } from '../utils/MaterialDisposer';

/**
 * Provides a singleton instance of the Three.js renderer.
 * This class is responsible for creating and managing a single WebGL renderer instance
 * that can be used throughout the application.
 */
export class RendererProvider {
    static createRenderer(): THREE.WebGLRenderer {
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        if (typeof (renderer as any).setPixelRatio === 'function') {
            renderer.setPixelRatio(window.devicePixelRatio);
        }
        return renderer;
    }

    static attachRendererDom(renderer: THREE.WebGLRenderer, container: HTMLElement = document.body) {
        container.appendChild(renderer.domElement);
    }

    /**
     * Recursively removes and disposes all non-persistent objects from the scene.
     * Handles nested groups and child meshes.
     */
    static clearScene(scene: THREE.Scene, persistentNames: string[] = ["grid", "axes", "origin", "ambientLight", "directionalLight"]) {
        function recursiveRemove(object: THREE.Object3D) {
            for (const child of [...object.children]) {
                recursiveRemove(child);
            }
            if (!persistentNames.includes(object.name) && object !== scene) {
                if (object.parent) {
                    object.parent.remove(object);
                }
                // Dispose geometry and material if present
                if ((object as any).geometry && typeof (object as any).geometry.dispose === 'function') {
                    (object as any).geometry.dispose();
                }
                if ((object as any).material) {
                    MaterialDisposer.dispose((object as any).material);
                }
            }
        }
        recursiveRemove(scene);
    }
}
