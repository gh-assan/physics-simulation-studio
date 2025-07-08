"use strict";
// jest.setup.ts
jest.mock('@dimforge/rapier3d-compat', () => ({
    World: jest.fn(() => ({
        timestep: 0,
        step: jest.fn(),
        gravity: { x: 0, y: -9.81, z: 0 },
        createRigidBody: jest.fn(() => ({
            translation: jest.fn(() => ({ x: 0, y: 0, z: 0 })),
            rotation: jest.fn(() => ({ x: 0, y: 0, z: 0, w: 1 })),
        })),
    })),
    Vector3: jest.fn((x, y, z) => ({ x, y, z })),
    Quaternion: jest.fn((x, y, z, w) => ({ x, y, z, w })),
}));
jest.mock('tweakpane', () => ({
    Pane: jest.fn(() => ({
        addFolder: jest.fn(() => ({
            addBinding: jest.fn(),
            dispose: jest.fn(),
        })),
        children: [], // Add children property for clearControls to iterate
        dispose: jest.fn(),
    })),
    FolderApi: jest.fn(), // Keep FolderApi mock if it's used for typing
}));
jest.mock('three', () => ({
    Scene: jest.fn(() => ({
        add: jest.fn(),
        background: null,
    })),
    PerspectiveCamera: jest.fn(() => ({
        position: { z: 0 },
        aspect: 0,
        updateProjectionMatrix: jest.fn(),
    })),
    WebGLRenderer: jest.fn(() => ({
        setSize: jest.fn(),
        domElement: document.createElement('canvas'),
        render: jest.fn(),
    })),
    BoxGeometry: jest.fn(),
    SphereGeometry: jest.fn(),
    PlaneGeometry: jest.fn(),
    MeshBasicMaterial: jest.fn(() => ({})),
    Mesh: jest.fn(() => ({
        position: { set: jest.fn() },
        quaternion: { set: jest.fn() },
    })),
    Color: jest.fn(),
}));
