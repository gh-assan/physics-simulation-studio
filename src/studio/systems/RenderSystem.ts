import * as THREE from 'three';
import { System } from '../../core/ecs/System';
import { World } from '../../core/ecs/World';
import { PositionComponent } from '../../core/components/PositionComponent';
import { RotationComponent } from '../../core/components/RotationComponent';
import { RenderableComponent } from '../../core/components/RenderableComponent';

export class RenderSystem extends System {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private meshes: Map<number, THREE.Mesh> = new Map();

    constructor() {
        super();
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        this.camera.position.z = 5;

        // Handle window resizing
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    public update(world: World, deltaTime: number): void {
        const entities = world.componentManager.getEntitiesWithComponents([
            PositionComponent,
            RotationComponent,
            RenderableComponent
        ]);

        for (const entityId of entities) {
            const position = world.componentManager.getComponent(entityId, PositionComponent.name);
            const rotation = world.componentManager.getComponent(entityId, RotationComponent.name);
            const renderable = world.componentManager.getComponent(entityId, RenderableComponent.name);

            if (!position || !rotation || !renderable) {
                continue; // Skip if any required component is missing
            }

            let mesh = this.meshes.get(entityId);

            if (!mesh) {
                // Create new mesh if it doesn't exist
                const geometry = this.createGeometry(renderable.geometry);
                const material = new THREE.MeshBasicMaterial({ color: renderable.color });
                mesh = new THREE.Mesh(geometry, material);
                this.scene.add(mesh);
                this.meshes.set(entityId, mesh);
            }

            // Update mesh position and rotation
            mesh.position.set(position.x, position.y, position.z);
            mesh.rotation.setFromQuaternion(new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w));
        }

        this.renderer.render(this.scene, this.camera);
    }

    private createGeometry(geometryType: RenderableComponent['geometry']): THREE.BufferGeometry {
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
}
