import {RenderSystem} from '../systems/RenderSystem';
import {World} from '@core/ecs';
import {
  PositionComponent,
  RenderableComponent,
  RotationComponent,
} from '@core/components';
import * as THREE from 'three';

// Mock THREE.js classes
const mockScene = {add: jest.fn()};
const mockCamera = {
  position: {set: jest.fn()},
  lookAt: jest.fn(),
  updateProjectionMatrix: jest.fn(),
};
const mockRenderer = {
  setSize: jest.fn(),
  render: jest.fn(),
  domElement: document.createElement('canvas'),
};

jest.mock('three', () => {
  const actual = jest.requireActual('three');
  return {
    ...actual,
    Scene: jest.fn(() => mockScene),
    PerspectiveCamera: jest.fn(() => mockCamera),
    WebGLRenderer: jest.fn(() => mockRenderer),
    Mesh: jest.fn(() => ({
      position: {set: jest.fn()},
      rotation: {setFromQuaternion: jest.fn()},
    })),
    BoxGeometry: jest.fn(),
    SphereGeometry: jest.fn(),
    CylinderGeometry: jest.fn(),
    ConeGeometry: jest.fn(),
    PlaneGeometry: jest.fn(),
    MeshBasicMaterial: jest.fn(() => ({})),
    Quaternion: jest.fn((x, y, z, w) => ({x, y, z, w, set: jest.fn()})),
  };
});

describe('RenderSystem', () => {
  let world: World;
    let renderSystem: RenderSystem;
  let mockStudio: any;

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window dimensions for consistent testing
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    });
    // Mock appendChild
    jest
      .spyOn(document.body, 'appendChild')
      .mockImplementation((node: Node) => node);
    world = new World();
    world.componentManager.registerComponent(
      PositionComponent.name,
      PositionComponent,
    );
    world.componentManager.registerComponent(
      RotationComponent.name,
      RotationComponent,
    );
    world.componentManager.registerComponent(
      RenderableComponent.name,
      RenderableComponent,
    );
        mockStudio = {
      _world: world,
      world: world,
      pluginManager: {},
      renderSystem: null,
      isPlaying: false,
      activeSimulationName: null,
      getRenderer: jest.fn(() => null), // Add getRenderer method returning null
      setRenderSystem: jest.fn(),
      play: jest.fn(),
      pause: jest.fn(),
      reset: jest.fn(),
      loadSimulation: jest.fn(),
      update: jest.fn(),
      getIsPlaying: jest.fn(() => false),
      getActiveSimulationName: jest.fn(() => null),
      getAvailableSimulationNames: jest.fn(() => []),
    };
    renderSystem = new RenderSystem(mockStudio);
  });

  it('should initialize Three.js components', () => {
    expect(THREE.Scene).toHaveBeenCalledTimes(1);
    expect(THREE.PerspectiveCamera).toHaveBeenCalledTimes(1);
    expect(THREE.WebGLRenderer).toHaveBeenCalledTimes(1);
    expect(mockRenderer.setSize).toHaveBeenCalledWith(
      window.innerWidth,
      window.innerHeight,
    );
    expect(document.body.appendChild).toHaveBeenCalledWith(
      mockRenderer.domElement,
    );
  });

  it('should create and update meshes for entities with renderable components', () => {
    const entity = world.entityManager.createEntity();
    const position = new PositionComponent(1, 2, 3);
    const rotation = new RotationComponent(0, 0, 0, 1);
    const renderable = new RenderableComponent('box', '#ff0000');

    world.componentManager.addComponent(
      entity,
      PositionComponent.name,
      position,
    );
    world.componentManager.addComponent(
      entity,
      RotationComponent.name,
      rotation,
    );
    world.componentManager.addComponent(
      entity,
      RenderableComponent.name,
      renderable,
    );

    renderSystem.update(world, 0.16);

    // Expect a new mesh to be created and added to the scene
    expect(THREE.Mesh).toHaveBeenCalledTimes(1);
    expect(mockScene.add).toHaveBeenCalledTimes(3);

    // Expect mesh position and rotation to be updated
            const meshInstance = (THREE.Mesh as unknown as jest.Mock).mock.results[0].value;
    expect(meshInstance.position.set).toHaveBeenCalledWith(
      position.x,
      position.y,
      position.z,
    );
    expect(meshInstance.rotation.setFromQuaternion).toHaveBeenCalledWith(
      expect.objectContaining({
        x: rotation.x,
        y: rotation.y,
        z: rotation.z,
        w: rotation.w,
      }),
    );

    // Expect renderer to render the scene
    expect(mockRenderer.render).toHaveBeenCalledWith(mockScene, mockCamera);

    // Update again to ensure mesh is updated, not recreated
    position.x = 10;
    renderSystem.update(world, 0.16);
    expect(THREE.Mesh).toHaveBeenCalledTimes(1); // Should not create a new mesh
    expect(meshInstance.position.set).toHaveBeenCalledWith(
      position.x,
      position.y,
      position.z,
    );
  });

  it('should not create meshes for entities without renderable components', () => {
    const entity = world.entityManager.createEntity();
    world.componentManager.addComponent(
      entity,
      PositionComponent.name,
      new PositionComponent(1, 2, 3),
    );

    renderSystem.update(world, 0.16);

    expect(THREE.Mesh).not.toHaveBeenCalled();
    expect(mockScene.add).toHaveBeenCalledTimes(2);
  });
});
