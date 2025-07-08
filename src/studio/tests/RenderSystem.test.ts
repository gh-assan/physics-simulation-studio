/**
 * @jest-environment jsdom
 */

import { RenderSystem } from '../systems/RenderSystem';
import { World } from '@core/ecs';
import { PositionComponent, RotationComponent, RenderableComponent } from '@core/components';
import * as THREE from 'three';

// Mock Three.js components
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

describe('RenderSystem', () => {
    let world: World;
    let renderSystem: RenderSystem;
    let mockScene: any;
    let mockCamera: any;
    let mockRenderer: any;

    beforeEach(() => {
        // Clear mocks
        (THREE.Scene as any).mockClear();
        (THREE.PerspectiveCamera as any).mockClear();
        (THREE.WebGLRenderer as any).mockClear();
        (THREE.BoxGeometry as any).mockClear();
        (THREE.SphereGeometry as any).mockClear();
        (THREE.PlaneGeometry as any).mockClear();
        (THREE.MeshBasicMaterial as any).mockClear();
        (THREE.Mesh as any).mockClear();
        (THREE.Color as any).mockClear();

        // Mock the container element
        document.body.innerHTML = '<div id="viewport-container"></div>';

        world = new World();
        renderSystem = new RenderSystem();

        mockScene = (THREE.Scene as any).mock.results[0]?.value;
        mockCamera = (THREE.PerspectiveCamera as any).mock.results[0]?.value;
        mockRenderer = (THREE.WebGLRenderer as jest.Mock).mock.results[0]?.value;

        world.componentManager.registerComponent('PositionComponent');
        world.componentManager.registerComponent('RotationComponent');
        world.componentManager.registerComponent('RenderableComponent');
    });

    it('should initialize Three.js components', () => {
        expect(THREE.Scene).toHaveBeenCalledTimes(1);
        expect(THREE.PerspectiveCamera).toHaveBeenCalledTimes(1);
        expect(THREE.WebGLRenderer).toHaveBeenCalledTimes(1);
        expect(mockRenderer.setSize).toHaveBeenCalledWith(window.innerWidth, window.innerHeight);
        expect(document.getElementById('viewport-container')?.contains(mockRenderer.domElement)).toBe(true);
    });

    it('should create and update meshes for renderable entities', () => {
        const entity = world.entityManager.createEntity();
        const position = new PositionComponent(1, 2, 3);
        const rotation = new RotationComponent(0, 0, 0, 1);
        const renderable = new RenderableComponent('box', 0xff0000, 1, 1, 1);

        world.componentManager.addComponent(entity, 'PositionComponent', position);
        world.componentManager.addComponent(entity, 'RotationComponent', rotation);
        world.componentManager.addComponent(entity, 'RenderableComponent', renderable);

        renderSystem.update(world, 0.16);

        expect(THREE.BoxGeometry).toHaveBeenCalledWith(1, 1, 1);
        expect(THREE.MeshBasicMaterial).toHaveBeenCalledWith({ color: 0xff0000 });
        expect(THREE.Mesh).toHaveBeenCalledTimes(1);
        expect(mockScene.add).toHaveBeenCalledTimes(1);

        const meshInstance = (THREE.Mesh as any).mock.results[0]?.value;
        expect(meshInstance.position.set).toHaveBeenCalledWith(1, 2, 3);
        expect(meshInstance.quaternion.set).toHaveBeenCalledWith(0, 0, 0, 1);
        expect(mockRenderer.render).toHaveBeenCalledWith(mockScene, mockCamera);

        // Test update path
        position.x = 10;
        renderSystem.update(world, 0.16);
        expect(meshInstance.position.set).toHaveBeenCalledWith(10, 2, 3);
    });

    it('should handle window resize', () => {
        const initialWidth = window.innerWidth;
        const initialHeight = window.innerHeight;

        // Simulate resize
        Object.defineProperty(window, 'innerWidth', { writable: true, value: 800 });
        Object.defineProperty(window, 'innerHeight', { writable: true, value: 600 });
        window.dispatchEvent(new Event('resize'));

        expect(mockCamera.aspect).toBe(800 / 600);
        expect(mockCamera.updateProjectionMatrix).toHaveBeenCalledTimes(1);
        expect(mockRenderer.setSize).toHaveBeenCalledWith(800, 600);

        // Restore original values
        Object.defineProperty(window, 'innerWidth', { writable: true, value: initialWidth });
        Object.defineProperty(window, 'innerHeight', { writable: true, value: initialHeight });
    });
});
