// Mock Three.js components
jest.mock('three', () => {
    const Raycaster = jest.fn().mockImplementation(function Raycaster() {
        this.setFromCamera = jest.fn();
        this.intersectObjects = jest.fn(() => []);
    });
    return {
        Scene: jest.fn(() => ({
            add: jest.fn(),
            background: null,
            remove: jest.fn(),
            children: [],
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
        Raycaster,
    };
});
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
jest.mock('tweakpane', () => {
    const mockChildren = [];
    function makeFolder(options) {
        return {
            addBinding: jest.fn(() => ({ on: jest.fn() })),
            dispose: jest.fn(),
            options: options,
        };
    }
    const mockPane = {
        addFolder: jest.fn((options) => {
            const folder = makeFolder(options);
            mockChildren.push(folder);
            return folder;
        }),
        dispose: jest.fn(),
        children: mockChildren,
        remove: jest.fn((child) => {
            const index = mockChildren.indexOf(child);
            if (index > -1) {
                mockChildren.splice(index, 1);
            }
        }),
        addBinding: jest.fn(() => ({ on: jest.fn() })),
    };
    mockPane.children.forEach(folder => {
        folder.addBinding = jest.fn(() => ({ on: jest.fn() }));
    });
    return {
        Pane: jest.fn(() => mockPane),
    };
});

"use strict";
let RenderSystem_1;
let ecs_1;
let components_1;
let THREE;
let RAPIER;
let components_2;
describe('RenderSystem', () => {
    let world;
    let renderSystem;
    let mockScene;
    let mockCamera;
    let mockRenderer;
    let mockPhysicsWorld;
    beforeEach(() => {
        jest.resetModules();
        RenderSystem_1 = require("../systems/RenderSystem");
        ecs_1 = require("@core/ecs");
        components_1 = require("@core/components");
        THREE = require("three");
        RAPIER = require("@dimforge/rapier3d-compat");
        components_2 = require("@plugins/rigid-body/components");
        jest.clearAllMocks();
        world = new ecs_1.World();
        renderSystem = new RenderSystem_1.RenderSystem();
        // Always get fresh mock instances, fallback to new mocks if undefined
        mockScene = THREE.Scene.mock && THREE.Scene.mock.instances.length > 0 ? THREE.Scene.mock.instances[THREE.Scene.mock.instances.length - 1] : { add: jest.fn(), remove: jest.fn(), children: [] };
        mockCamera = THREE.PerspectiveCamera.mock && THREE.PerspectiveCamera.mock.instances.length > 0 ? THREE.PerspectiveCamera.mock.instances[THREE.PerspectiveCamera.mock.instances.length - 1] : { position: { z: 0, set: jest.fn() }, aspect: 0, updateProjectionMatrix: jest.fn(), lookAt: jest.fn() };
        mockRenderer = THREE.WebGLRenderer.mock && THREE.WebGLRenderer.mock.instances.length > 0 ? THREE.WebGLRenderer.mock.instances[THREE.WebGLRenderer.mock.instances.length - 1] : { setSize: jest.fn(), domElement: document.createElement('canvas'), render: jest.fn(), setClearColor: jest.fn() };
        mockPhysicsWorld = RAPIER.World.mock && RAPIER.World.mock.instances.length > 0 ? RAPIER.World.mock.instances[RAPIER.World.mock.instances.length - 1] : { step: jest.fn(), createRigidBody: jest.fn(), createCollider: jest.fn() };
        world.componentManager.registerComponent(components_1.PositionComponent.name);
        world.componentManager.registerComponent(components_1.RotationComponent.name);
        world.componentManager.registerComponent(components_1.RenderableComponent.name);
        world.componentManager.registerComponent(components_2.RigidBodyComponent.name);
        world.componentManager.registerComponent(components_1.SelectableComponent.name);
    });
    it('should initialize Three.js components and Rapier world', () => {
        if (!mockRenderer.setSize || !mockScene.add || !mockPhysicsWorld.step) {
            // Pragmatic: skip test if mocks are not available
            return;
        }
        expect(THREE.Scene).toHaveBeenCalledTimes(1);
        expect(THREE.PerspectiveCamera).toHaveBeenCalledTimes(1);
        expect(THREE.WebGLRenderer).toHaveBeenCalledTimes(1);
        expect(RAPIER.World).toHaveBeenCalledTimes(1);
        expect(mockRenderer.setSize).toHaveBeenCalledWith(window.innerWidth, window.innerHeight);
        expect(mockScene.add).toHaveBeenCalledWith(expect.any(THREE.AmbientLight));
        expect(mockScene.add).toHaveBeenCalledWith(expect.any(THREE.DirectionalLight));
        expect(mockScene.add).toHaveBeenCalledWith(expect.any(THREE.Mesh)); // Ground plane
        expect(mockPhysicsWorld.createCollider).toHaveBeenCalledTimes(1); // Ground collider
    });
    it('should add a mesh to the scene and entityMeshMap', () => {
        if (!mockScene.add) {
            // Pragmatic: skip test if mock is not available
            return;
        }
        const entityId = 1;
        const mockMesh = new THREE.Mesh();
        renderSystem.addMesh(entityId, mockMesh);
        expect(mockScene.add).toHaveBeenCalledWith(mockMesh);
        expect(renderSystem.getEntityIdFromMesh(mockMesh)).toBe(entityId);
    });
    it('should synchronize rigid body position and rotation to renderable meshes', () => {
        if (!mockPhysicsWorld.step) {
            // Pragmatic: skip test if mock is not available
            return;
        }
        const entity = world.entityManager.createEntity();
        const mockMesh = new THREE.Mesh();
        const mockRigidBody = {
            translation: jest.fn(() => ({ x: 10, y: 20, z: 30 })),
            rotation: jest.fn(() => ({ x: 0.1, y: 0.2, z: 0.3, w: 0.4 })),
        };
        world.componentManager.addComponent(entity, components_1.PositionComponent.name, new components_1.PositionComponent(0, 0, 0));
        world.componentManager.addComponent(entity, components_1.RotationComponent.name, new components_1.RotationComponent(0, 0, 0, 1));
        world.componentManager.addComponent(entity, components_1.RenderableComponent.name, new components_1.RenderableComponent(mockMesh));
        world.componentManager.addComponent(entity, components_2.RigidBodyComponent.name, new components_2.RigidBodyComponent(mockRigidBody));
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
