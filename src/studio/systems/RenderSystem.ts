import * as THREE from 'three';
import { System, World } from '@core/ecs';
import { PositionComponent, RenderableComponent, RotationComponent } from '@core/components';
import RAPIER from '@dimforge/rapier3d-compat';
import { RigidBodyComponent } from '@plugins/rigid-body/components';

export class RenderSystem extends System {
    public scene: THREE.Scene;
    public camera: THREE.PerspectiveCamera;
    public renderer: THREE.WebGLRenderer;
    public raycaster: THREE.Raycaster;
    private entityMeshMap: Map<number, THREE.Mesh>;
    public physicsWorld: RAPIER.World;

    constructor() {
        super();
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.raycaster = new THREE.Raycaster();
        this.entityMeshMap = new Map<number, THREE.Mesh>();

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x222222);

        this.camera.position.set(0, 10, 20);
        this.camera.lookAt(0, 0, 0);

        // Add some lighting
        const ambientLight = new THREE.AmbientLight(0x404040); // soft white light
        this.scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(1, 1, 1).normalize();
        this.scene.add(directionalLight);

        // Add a ground plane
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x808080, side: THREE.DoubleSide });
        const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
        groundMesh.rotation.x = Math.PI / 2;
        this.scene.add(groundMesh);

        // Initialize Rapier physics world
        const gravity = new RAPIER.Vector3(0.0, -9.81, 0.0);
        this.physicsWorld = new RAPIER.World(gravity);

        // Create a static ground collider in Rapier
        const groundColliderDesc = RAPIER.ColliderDesc.cuboid(50.0, 0.1, 50.0);
        this.physicsWorld.createCollider(groundColliderDesc);
    }

    update(world: World, deltaTime: number): void {
        // Step the physics world
        this.physicsWorld.step();

        // Synchronize physics bodies with renderable meshes
        const entities = world.componentManager.getEntitiesWithComponents(['PositionComponent', 'RenderableComponent', 'RigidBodyComponent']);

        for (const entityId of entities) {
            const positionComp = world.componentManager.getComponent<PositionComponent>(entityId, 'PositionComponent');
            const renderableComp = world.componentManager.getComponent<RenderableComponent>(entityId, 'RenderableComponent');
            const rigidBodyComp = world.componentManager.getComponent<RigidBodyComponent>(entityId, 'RigidBodyComponent');
            const rotationComp = world.componentManager.getComponent<RotationComponent>(entityId, 'RotationComponent');

            if (positionComp && renderableComp && rigidBodyComp) {
                const mesh = renderableComp.mesh;
                const rigidBody = rigidBodyComp.body;

                const newPosition = rigidBody.translation();
                mesh.position.set(newPosition.x, newPosition.y, newPosition.z);
                positionComp.x = newPosition.x;
                positionComp.y = newPosition.y;
                positionComp.z = newPosition.z;

                const newRotation = rigidBody.rotation();
                mesh.quaternion.set(newRotation.x, newRotation.y, newRotation.z, newRotation.w);
                if (rotationComp) {
                    rotationComp.x = newRotation.x;
                    rotationComp.y = newRotation.y;
                    rotationComp.z = newRotation.z;
                    rotationComp.w = newRotation.w;
                }
            }
        }

        this.renderer.render(this.scene, this.camera);
    }

    addMesh(entityId: number, mesh: THREE.Mesh): void {
        this.scene.add(mesh);
        this.entityMeshMap.set(entityId, mesh);
    }

    getEntityIdFromMesh(mesh: THREE.Object3D): number | undefined {
        for (const [entityId, storedMesh] of this.entityMeshMap.entries()) {
            if (storedMesh === mesh) {
                return entityId;
            }
        }
        return undefined;
    }
}
