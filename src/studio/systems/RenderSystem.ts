import * as THREE from 'three';
import { System, World } from '@core/ecs';
import { PositionComponent, RenderableComponent, RotationComponent } from '@core/components';

export class RenderSystem extends System {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private meshes: Map<number, THREE.Mesh> = new Map();

    constructor(container: HTMLElement) {
        super();
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(this.renderer.domElement);

        // Basic lighting
        const ambientLight = new THREE.AmbientLight(0x404040); // soft white light
        this.scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(1, 1, 1).normalize();
        this.scene.add(directionalLight);

        this.camera.position.z = 5;

        // Handle window resizing
        window.addEventListener('resize', this.onWindowResize.bind(this), false);
    }

    private onWindowResize(): void {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    public update(world: World, deltaTime: number): void {
        const entities = world.componentManager.getEntitiesWithComponents([PositionComponent.name, RenderableComponent.name, RotationComponent.name]);

        for (const entityId of entities) {
            const positionComponent = world.componentManager.getComponent(entityId, PositionComponent.name) as PositionComponent;
            const renderableComponent = world.componentManager.getComponent(entityId, RenderableComponent.name) as RenderableComponent;
            const rotationComponent = world.componentManager.getComponent(entityId, RotationComponent.name) as RotationComponent;

            if (!positionComponent || !renderableComponent || !rotationComponent) {
                continue;
            }

            let mesh = this.meshes.get(entityId);

            if (!mesh) {
                // Create new mesh if it doesn't exist
                const geometry = this.createGeometry(renderableComponent);
                const material = new THREE.MeshStandardMaterial({ color: renderableComponent.color });
                mesh = new THREE.Mesh(geometry, material);
                this.scene.add(mesh);
                this.meshes.set(entityId, mesh);
            }

            // Update mesh properties
            mesh.position.set(positionComponent.x, positionComponent.y, positionComponent.z);
            mesh.quaternion.set(rotationComponent.x, rotationComponent.y, rotationComponent.z, rotationComponent.w);

            // TODO: Update geometry/material if renderableComponent properties change
        }

        // Remove meshes for entities that no longer have renderable components
        for (const [entityId, mesh] of this.meshes.entries()) {
            if (!world.componentManager.hasComponent(entityId, RenderableComponent.name)) {
                this.scene.remove(mesh);
                this.meshes.delete(entityId);
            }
        }

        this.renderer.render(this.scene, this.camera);
    }

    private createGeometry(renderable: RenderableComponent): THREE.BufferGeometry {
        switch (renderable.geometryType) {
            case 'box':
                return new THREE.BoxGeometry(renderable.width, renderable.height, renderable.depth);
            case 'sphere':
                return new THREE.SphereGeometry(renderable.radius, renderable.segments, renderable.segments);
            case 'plane':
                return new THREE.PlaneGeometry(renderable.width, renderable.height);
            default:
                console.warn(`Unknown geometry type: ${renderable.geometryType}. Using BoxGeometry.`);
                return new THREE.BoxGeometry(1, 1, 1);
        }
    }
}