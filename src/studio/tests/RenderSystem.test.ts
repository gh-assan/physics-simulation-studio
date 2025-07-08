import { RenderSystem } from "../systems/RenderSystem";
import { World } from "@core/ecs";
import { PositionComponent, RenderableComponent, RotationComponent, SelectableComponent } from "@core/components";
import * as RAPIER from "@dimforge/rapier3d-compat";
import { RigidBodyComponent } from "@plugins/rigid-body/components";

// Mock THREE.js classes
const mockScene = { add: jest.fn() };
const mockCamera = { position: { set: jest.fn() }, lookAt: jest.fn() };
const mockRenderer = { setSize: jest.fn(), render: jest.fn(), setClearColor: jest.fn() };
const mockMesh = () => ({
    position: { set: jest.fn() },
    quaternion: { set: jest.fn() },
    rotation: { x: 0 },
});

jest.mock('three', () => ({
    Scene: jest.fn(() => mockScene),
    PerspectiveCamera: jest.fn(() => mockCamera),
    WebGLRenderer: jest.fn(() => mockRenderer),
    Mesh: jest.fn(() => mockMesh()),
    Raycaster: jest.fn(() => ({ intersectObject: jest.fn(), intersectObjects: jest.fn() })),
    AmbientLight: jest.fn(() => ({ })),
    DirectionalLight: jest.fn(() => ({ position: { set: jest.fn(() => ({ normalize: jest.fn() })) } })),
    PlaneGeometry: jest.fn(() => ({})),
    MeshStandardMaterial: jest.fn(() => ({})),
    DoubleSide: 2,
}));

jest.mock('@dimforge/rapier3d-compat', () => {
    const actual = jest.requireActual('@dimforge/rapier3d-compat');
    return {
        ...actual,
        World: jest.fn(() => ({
            step: jest.fn(),
            createCollider: jest.fn(),
        })),
    };
});

describe('RenderSystem', () => {
    let world: World;
    let renderSystem: RenderSystem;
    let physicsWorld: any;
    beforeEach(() => {
        jest.clearAllMocks();
        world = new World();
        renderSystem = new RenderSystem();
        physicsWorld = renderSystem.physicsWorld;
        world.componentManager.registerComponent(PositionComponent.name);
        world.componentManager.registerComponent(RotationComponent.name);
        world.componentManager.registerComponent(RenderableComponent.name);
        world.componentManager.registerComponent(RigidBodyComponent.name);
        world.componentManager.registerComponent(SelectableComponent.name);
    });
    it('should initialize Three.js components and Rapier world', () => {
        const THREE = require('three');
        expect(THREE.Scene).toHaveBeenCalledTimes(1);
        expect(THREE.PerspectiveCamera).toHaveBeenCalledTimes(1);
        expect(THREE.WebGLRenderer).toHaveBeenCalledTimes(1);
        expect(RAPIER.World).toHaveBeenCalledTimes(1);
        expect(mockRenderer.setSize).toHaveBeenCalledWith(window.innerWidth, window.innerHeight);
        expect(mockScene.add).toHaveBeenCalled();
        expect(physicsWorld.createCollider).toHaveBeenCalled();
    });
    it('should add a mesh to the scene and entityMeshMap', () => {
        const entityId = 1;
        const mesh = mockMesh() as unknown as import('three').Mesh;
        renderSystem.addMesh(entityId, mesh);
        expect(mockScene.add).toHaveBeenCalledWith(mesh);
        expect(renderSystem.getEntityIdFromMesh(mesh)).toBe(entityId);
    });
    it('should synchronize rigid body position and rotation to renderable meshes', () => {
        const entity = world.entityManager.createEntity();
        const mesh = mockMesh() as unknown as import('three').Mesh;
        const mockRigidBody = {
            translation: jest.fn(() => ({ x: 10, y: 20, z: 30 })),
            rotation: jest.fn(() => ({ x: 0.1, y: 0.2, z: 0.3, w: 0.4 })),
        } as unknown as RAPIER.RigidBody;
        world.componentManager.addComponent(entity, PositionComponent.name, new PositionComponent(0, 0, 0));
        world.componentManager.addComponent(entity, RotationComponent.name, new RotationComponent(0, 0, 0, 1));
        world.componentManager.addComponent(entity, RenderableComponent.name, new RenderableComponent(mesh));
        world.componentManager.addComponent(entity, RigidBodyComponent.name, new RigidBodyComponent(mockRigidBody));
        renderSystem.addMesh(entity, mesh);
        renderSystem.update(world, 0.16);
        expect(physicsWorld.step).toHaveBeenCalledTimes(1);
        expect(mockRigidBody.translation).toHaveBeenCalledTimes(1);
        expect(mockRigidBody.rotation).toHaveBeenCalledTimes(1);
        expect(mesh.position.set).toHaveBeenCalledWith(10, 20, 30);
        expect(mesh.quaternion.set).toHaveBeenCalledWith(0.1, 0.2, 0.3, 0.4);
        expect(mockRenderer.render).toHaveBeenCalledWith(mockScene, mockCamera);
    });
});
