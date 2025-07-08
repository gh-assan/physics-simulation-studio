import { System, World } from '@core/ecs';
import { PositionComponent, RotationComponent, RenderableComponent } from '@core/components';
import * as THREE from 'three';

export class RenderSystem extends System {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private visualMap = new Map<number, THREE.Mesh>(); // Maps entityID to Mesh

    constructor(containerId: string = 'viewport-container') {
        super();

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x282c34);

        // Camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 5;

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        const container = document.getElementById(containerId);
        if (container) {
            container.appendChild(this.renderer.domElement);
        } else {
            console.error(`Container with ID '${containerId}' not found for RenderSystem.`);
            document.body.appendChild(this.renderer.domElement); // Fallback
        }

        // Handle window resizing
        window.addEventListener('resize', this.onWindowResize.bind(this), false);
    }

    private onWindowResize(): void {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    public update(world: World, deltaTime: number): void {
        const entities = world.componentManager.getEntitiesWithComponents([
            'PositionComponent',
            'RotationComponent',
            'RenderableComponent',
        ]);

        for (const entityID of entities) {
            const positionComp = world.componentManager.getComponent<PositionComponent>(entityID, 'PositionComponent')!;
            const rotationComp = world.componentManager.getComponent<RotationComponent>(entityID, 'RotationComponent')!;
            const renderableComp = world.componentManager.getComponent<RenderableComponent>(entityID, 'RenderableComponent')!;

            let mesh = this.visualMap.get(entityID);

            if (!mesh) {
                // Create new mesh if it doesn't exist
                let geometry: THREE.BufferGeometry;
                switch (renderableComp.geometryType) {
                    case 'box':
                        geometry = new THREE.BoxGeometry(renderableComp.width, renderableComp.height, renderableComp.depth);
                        break;
                    case 'sphere':
                        geometry = new THREE.SphereGeometry(renderableComp.radius);
                        break;
                    case 'plane':
                        geometry = new THREE.PlaneGeometry(renderableComp.width, renderableComp.height);
                        break;
                    default:
                        geometry = new THREE.BoxGeometry(1, 1, 1); // Default to a unit box
                }
                const material = new THREE.MeshBasicMaterial({ color: renderableComp.color });
                mesh = new THREE.Mesh(geometry, material);
                this.scene.add(mesh);
                this.visualMap.set(entityID, mesh);
            }

            // Update mesh position and rotation
            mesh.position.set(positionComp.x, positionComp.y, positionComp.z);
            mesh.quaternion.set(rotationComp.x, rotationComp.y, rotationComp.z, rotationComp.w);
        }

        // Render the scene
        this.renderer.render(this.scene, this.camera);
    }
}
