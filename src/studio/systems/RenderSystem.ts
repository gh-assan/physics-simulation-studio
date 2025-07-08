import * as THREE from 'three';
import { System } from '../../core/ecs/System';
import { World } from '../../core/ecs/World';
import { PositionComponent } from '../../core/components/PositionComponent';
import { RotationComponent } from '../../core/components/RotationComponent';
import { RenderableComponent } from '../../core/components/RenderableComponent';
import { FlagComponent } from '../../plugins/flag-simulation/FlagComponent';

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

        const flagEntities = world.componentManager.getEntitiesWithComponents([
            PositionComponent,
            RenderableComponent, // Flag will also have a renderable component for color/material
            FlagComponent
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

        // Handle FlagComponent rendering
        for (const entityId of flagEntities) {
            const flag = world.componentManager.getComponent(entityId, FlagComponent.name);
            const renderable = world.componentManager.getComponent(entityId, RenderableComponent.name);

            if (!flag || !renderable || flag.points.length === 0) {
                continue;
            }

            let flagMesh = this.meshes.get(entityId);

            if (!flagMesh || !(flagMesh.userData && flagMesh.userData.isFlag)) {
                // If it's not a flag mesh or doesn't exist, create it
                const geometry = new THREE.BufferGeometry();
                const material = new THREE.MeshBasicMaterial({ color: renderable.color, side: THREE.DoubleSide });
                flagMesh = new THREE.Mesh(geometry, material);
                flagMesh.userData.isFlag = true; // Mark this mesh as a flag
                this.scene.add(flagMesh);
                this.meshes.set(entityId, flagMesh);
            }

            // Update flag geometry
            const positions = [];
            const uvs = [];
            const indices = [];

            const numRows = flag.segmentsY + 1;
            const numCols = flag.segmentsX + 1;

            for (let i = 0; i < flag.points.length; i++) {
                const point = flag.points[i];
                positions.push(point.position.x, point.position.y, point.position.z);

                const x = i % numCols;
                const y = Math.floor(i / numCols);
                uvs.push(x / (numCols - 1), 1 - (y / (numRows - 1))); // Flip Y for UVs
            }

            for (let y = 0; y < numRows - 1; y++) {
                for (let x = 0; x < numCols - 1; x++) {
                    const i0 = y * numCols + x;
                    const i1 = y * numCols + x + 1;
                    const i2 = (y + 1) * numCols + x;
                    const i3 = (y + 1) * numCols + x + 1;

                    // Triangle 1
                    indices.push(i0, i2, i1);
                    // Triangle 2
                    indices.push(i1, i2, i3);
                }
            }

            const geometry = flagMesh.geometry as THREE.BufferGeometry;
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
            geometry.setIndex(indices);
            geometry.computeVertexNormals(); // Recalculate normals for lighting
            geometry.attributes.position.needsUpdate = true;
            geometry.attributes.uv.needsUpdate = true;
            if (geometry.index) {
                geometry.index.needsUpdate = true;
            }
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
