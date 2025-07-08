/**
 * @jest-environment jsdom
 */

import { RenderSystem } from '../systems/RenderSystem';
import { World } from '@core/ecs';
import { PositionComponent, RotationComponent, RenderableComponent, SelectableComponent } from '@core/components';
import * as THREE from 'three';
import * as RAPIER from '@dimforge/rapier3d-compat';
import { RigidBodyComponent } from '@plugins/rigid-body/components';

// Mock Three.js components
jest.mock('three', () => ({
    Scene: jest.fn(() => ({
        add: jest.fn(),
        background: null,
        remove: jest.fn(),
        children: [], // Add children array for raycasting
    })),
    PerspectiveCamera: jest.fn(() => ({
        position: { z: 0, set: jest.fn() },
        aspect: 0,
        updateProjectionMatrix: jest.fn(),
        lookAt: jest.fn(),
    })),
    WebGLRenderer: jest.fn(() => ({
        setSize: jest.fn(),
        domElement: document.createElement('canvas'),
        render: jest.fn(),
        setClearColor: jest.fn(),
    })),
    BoxGeometry: jest.fn(),
    SphereGeometry: jest.fn(),
    PlaneGeometry: jest.fn(),
    MeshStandardMaterial: jest.fn(() => ({})),
    Mesh: jest.fn(() => {
        const mesh = {
            position: { set: jest.fn() },
            quaternion: { set: jest.fn() },
            rotation: { x: 0, y: 0, z: 0, set: jest.fn() },
        };
        return mesh;
    }),
    Color: jest.fn(),
    AmbientLight: jest.fn(() => ({})),
    DirectionalLight: jest.fn(() => ({
        position: {
            set: jest.fn().mockReturnThis(),
            normalize: jest.fn(),
        },
    })),
    Vector3: jest.fn(),
    Vector2: jest.fn(),
    Raycaster: jest.fn().mockImplementation(() => ({
        setFromCamera: jest.fn(),
        intersectObjects: jest.fn(() => []),
    })),
}));

// Mock Rapier.js components
jest.mock('@dimforge/rapier3d-compat', () => ({
    World: jest.fn(() => ({
        step: jest.fn(),
        createRigidBody: jest.fn(() => ({
            translation: jest.fn(() => ({ x: 0, y: 0, z: 0 })),
            rotation: jest.fn(() => ({ x: 0, y: 0, z: 0, w: 1 })),
        })),
        createCollider: jest.fn(),
    })),
    RigidBodyDesc: {
        dynamic: jest.fn(() => ({
            setTranslation: jest.fn().mockReturnThis(),
        })),
    },
    ColliderDesc: {
        cuboid: jest.fn(),
        ball: jest.fn(),
    },
    Vector3: jest.fn(),
    Quaternion: jest.fn(),
}));

describe('RenderSystem', () => {
    let world: World;
    let renderSystem: RenderSystem;
    let mockScene: any;
    let mockCamera: any;
    let mockRenderer: any;
    let mockPhysicsWorld: any;

    beforeEach(() => {
        // Clear mocks
        jest.clearAllMocks();

        world = new World();
        renderSystem = new RenderSystem();

        // Use the actual instances from renderSystem
        mockScene = renderSystem.scene;
        mockCamera = renderSystem.camera;
        mockRenderer = renderSystem.renderer;
        mockPhysicsWorld = renderSystem.physicsWorld;

        world.componentManager.registerComponent(PositionComponent.name);
        world.componentManager.registerComponent(RotationComponent.name);
        world.componentManager.registerComponent(RenderableComponent.name);
        world.componentManager.registerComponent(RigidBodyComponent.name);
        world.componentManager.registerComponent(SelectableComponent.name);
    });

    it('should initialize Three.js components and Rapier world', () => {
        expect(THREE.Scene).toHaveBeenCalledTimes(1);
        expect(THREE.PerspectiveCamera).toHaveBeenCalledTimes(1);
        expect(THREE.WebGLRenderer).toHaveBeenCalledTimes(1);
        expect(RAPIER.World).toHaveBeenCalledTimes(1);

        expect(mockRenderer.setSize).toHaveBeenCalledWith(window.innerWidth, window.innerHeight);
        expect(mockScene.add).toHaveBeenCalledTimes(3); // AmbientLight, DirectionalLight, Mesh
        (mockScene.add as jest.Mock).mock.calls.forEach((call: any[]) => {
            expect(typeof call[0]).toBe('object');
        });
        expect(mockPhysicsWorld.createCollider).toHaveBeenCalledTimes(1); // Ground collider
    });

    it('should add a mesh to the scene and entityMeshMap', () => {
        const entityId = 1;
        const mockMesh = new THREE.Mesh();
        renderSystem.addMesh(entityId, mockMesh);

        expect(mockScene.add).toHaveBeenCalledWith(mockMesh);
        expect(renderSystem.getEntityIdFromMesh(mockMesh)).toBe(entityId);
    });

    it('should synchronize rigid body position and rotation to renderable meshes', () => {
        const entity = world.entityManager.createEntity();
        const mockMesh = new THREE.Mesh();
        const mockRigidBody = {
            translation: jest.fn(() => ({ x: 10, y: 20, z: 30 })),
            rotation: jest.fn(() => ({ x: 0.1, y: 0.2, z: 0.3, w: 0.4 })),
        } as unknown as RAPIER.RigidBody;

        world.componentManager.addComponent(entity, PositionComponent.name, new PositionComponent(0, 0, 0));
        world.componentManager.addComponent(entity, RotationComponent.name, new RotationComponent(0, 0, 0, 1));
        world.componentManager.addComponent(entity, RenderableComponent.name, new RenderableComponent(mockMesh));
        world.componentManager.addComponent(entity, RigidBodyComponent.name, new RigidBodyComponent(mockRigidBody));

        renderSystem.addMesh(entity, mockMesh);

        renderSystem.update(world, 0.16);

        expect(mockPhysicsWorld.step).toHaveBeenCalledTimes(1);
        expect(mockRigidBody.translation).toHaveBeenCalledTimes(1);
        expect(mockRigidBody.rotation).toHaveBeenCalledTimes(1);
        expect(mockMesh.position.set).toHaveBeenCalledWith(10, 20, 30);
        expect(mockMesh.quaternion.set).toHaveBeenCalledWith(0.1, 0.2, 0.3, 0.4);
        expect(mockRenderer.render).toHaveBeenCalledWith(mockScene, mockCamera);
    });
});
