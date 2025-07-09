import * as THREE from 'three';
import { System } from '../../core/ecs/System';
import { World } from '../../core/ecs/World';
import { PositionComponent } from '../../core/components/PositionComponent';
import { RotationComponent } from '../../core/components/RotationComponent';
import { RenderableComponent } from '../../core/components/RenderableComponent';
import { FlagComponent } from '../../plugins/flag-simulation/FlagComponent';
import { Studio } from '../Studio'; // Import Studio
import { WaterRenderer } from '../../plugins/water-simulation/WaterRenderer'; // Import WaterRenderer
import { SelectableComponent } from '../../core/components/SelectableComponent'; // Import SelectableComponent

export class RenderSystem extends System {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private meshes: Map<number, THREE.Mesh> = new Map();
    private studio: Studio; // Add studio reference
    private raycaster: THREE.Raycaster;
    private mouse: THREE.Vector2;

    constructor(studio: Studio) { // Add studio to constructor
        super();
        this.studio = studio; // Store studio reference
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        this.camera.position.z = 20;
        this.camera.position.y = 5;

        // Add lights
        const ambientLight = new THREE.AmbientLight(0x404040); // soft white light
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5); // white light, 0.5 intensity
        directionalLight.position.set(1, 1, 1).normalize();
        this.scene.add(directionalLight);

        // Handle window resizing
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Setup raycaster for object selection
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        window.addEventListener('mousedown', this.onMouseDown.bind(this), false);
    }

    private onMouseDown(event: MouseEvent): void {
        // Calculate mouse position in normalized device coordinates (-1 to +1) for both components
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Update the raycaster with the camera and mouse position
        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Calculate objects intersecting the ray
        const intersects = this.raycaster.intersectObjects(this.scene.children);

        // Get the current world from the studio
        const world = this.studio.world;

        // Deselect all currently selected entities
        const currentlySelected = world.componentManager.getEntitiesWithComponents([SelectableComponent]).filter(entityId => {
            const selectable = world.componentManager.getComponent(entityId, SelectableComponent.name) as SelectableComponent;
            return selectable.isSelected;
        });

        currentlySelected.forEach(entityId => {
            const selectable = world.componentManager.getComponent(entityId, SelectableComponent.name) as SelectableComponent;
            selectable.isSelected = false;
        });

        if (intersects.length > 0) {
            // Find the first intersected object that corresponds to an entity
            const intersectedMesh = intersects[0].object as THREE.Mesh;
            let selectedEntityId: number | null = null;

            // Find the entity ID associated with the intersected mesh
            for (const [entityId, mesh] of this.meshes.entries()) {
                if (mesh === intersectedMesh) {
                    selectedEntityId = entityId;
                    break;
                }
            }

            if (selectedEntityId !== null) {
                const selectable = world.componentManager.getComponent(selectedEntityId, SelectableComponent.name) as SelectableComponent;
                if (selectable) {
                    selectable.isSelected = true;
                }
            }
        }
    }

    public update(world: World, deltaTime: number): void {
        // console.log("RenderSystem update called.");
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

        // console.log(`Found ${entities.length} general entities and ${flagEntities.length} flag entities.`);

        for (const entityId of entities) {
            const position = world.componentManager.getComponent(entityId, PositionComponent.name);
            const rotation = world.componentManager.getComponent(entityId, RotationComponent.name);
            const renderable = world.componentManager.getComponent(entityId, RenderableComponent.name);

            if (!position || !rotation || !renderable) {
                continue; // Skip if any required component is missing
            }

            let mesh = this.meshes.get(entityId);

            if (!mesh) {
                // Create new mesh if it's not a flag mesh or doesn't exist
                const geometry = this.createGeometry(renderable.geometry);
                const material = new THREE.MeshBasicMaterial({ color: renderable.color });
                mesh = new THREE.Mesh(geometry, material);
                this.scene.add(mesh);
                this.meshes.set(entityId, mesh);
            }

            // Update mesh position and rotation
            mesh.position.set(position.x, position.y, position.z);
            mesh.rotation.setFromQuaternion(new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w));

            // Handle selection highlight
            const selectable = world.componentManager.getComponent(entityId, SelectableComponent.name) as SelectableComponent;
            if (selectable) {
                const material = mesh.material as THREE.MeshBasicMaterial;
                if (selectable.isSelected) {
                    material.color.set(0xffff00); // Highlight color (yellow)
                } else {
                    material.color.set(renderable.color); // Original color
                }
            }
        }

        // Handle FlagComponent rendering
        for (const entityId of flagEntities) {
            const flag = world.componentManager.getComponent(entityId, FlagComponent.name);
            const renderable = world.componentManager.getComponent(entityId, RenderableComponent.name);

            if (!flag || !renderable || flag.points.length === 0) {
                // console.log(`Skipping flag entity ${entityId}: missing components or no points.`, { flag, renderable });
                continue;
            }

            // console.log(`Processing flag entity ${entityId}. Points length: ${flag.points.length}`);
            // if (flag.points.length > 0) {
            //     console.log("First flag point position:", flag.points[0].position);
            // }

            let flagMesh = this.meshes.get(entityId);

            if (!flagMesh || !(flagMesh.userData && flagMesh.userData.isFlag)) {
                // If it's not a flag mesh or doesn't exist, create it
                const geometry = new THREE.BufferGeometry();
                const material = new THREE.MeshStandardMaterial({ color: renderable.color, side: THREE.DoubleSide });
                flagMesh = new THREE.Mesh(geometry, material);
                flagMesh.userData = { isFlag: true }; // Initialize userData
                this.scene.add(flagMesh);
                this.meshes.set(entityId, flagMesh);
                console.log(`RenderSystem: Created and added flag mesh for entity ${entityId}. Mesh:`, flagMesh);
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

        // Call plugin-specific renderer if available
        const activeRenderer = this.studio.getRenderer();
        if (activeRenderer instanceof WaterRenderer) {
            activeRenderer.render(world, this.scene, this.camera);
        }

        this.renderer.render(this.scene, this.camera);
        console.log("RenderSystem: Scene children after rendering:", this.scene.children);
    }

    public clear(): void {
        this.meshes.forEach(mesh => {
            this.scene.remove(mesh);
            mesh.geometry.dispose();
            if (mesh.material instanceof THREE.Material) {
                mesh.material.dispose();
            } else if (Array.isArray(mesh.material)) {
                mesh.material.forEach(material => material.dispose());
            }
        });
        this.meshes.clear();

        // Dispose of water mesh if it exists
        const activeRenderer = this.studio.getRenderer();
        if (activeRenderer instanceof WaterRenderer && activeRenderer.waterMesh) {
            this.scene.remove(activeRenderer.waterMesh);
            activeRenderer.waterMesh.geometry.dispose();
            if (activeRenderer.waterMesh.material instanceof THREE.Material) {
                activeRenderer.waterMesh.material.dispose();
            } else if (Array.isArray(activeRenderer.waterMesh.material)) {
                activeRenderer.waterMesh.material.forEach(material => material.dispose());
            }
            activeRenderer.waterMesh = null; // Reset the reference
        }

        // Remove all ripple meshes from the scene
        this.scene.children = this.scene.children.filter(child => !child.name.startsWith('ripple_'));
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