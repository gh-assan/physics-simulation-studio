import * as THREE from 'three';

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
                    if (Array.isArray((object as any).material)) {
                        for (const mat of (object as any).material) {
                            if (mat && typeof mat.dispose === 'function') mat.dispose();
                        }
                    } else if (typeof (object as any).material.dispose === 'function') {
                        (object as any).material.dispose();
                    }
                }
            }
        }
        recursiveRemove(scene);
    }
}
