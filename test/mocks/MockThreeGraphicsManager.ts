/**
 * Mock ThreeGraphicsManager for testing
 *
 * This mock avoids Three.js import issues in Jest tests while providing
 * the same interface as the real ThreeGraphicsManager.
 */

import {IGraphicsManager} from '../../src/studio/graphics/IGraphicsManager';

export class MockThreeGraphicsManager implements IGraphicsManager {
  public scene = {
    add: jest.fn(),
    remove: jest.fn(),
    children: [],
    background: null
  };

  public camera = {
    position: {x: 0, y: 0, z: 10},
    lookAt: jest.fn(),
    updateProjectionMatrix: jest.fn()
  };

  public renderer = {
    setSize: jest.fn(),
    render: jest.fn(),
    dispose: jest.fn(),
    domElement: {
      width: 800,
      height: 600,
      style: {},
      getContext: jest.fn(() => ({
        canvas: {width: 800, height: 600},
        viewport: jest.fn(),
        clear: jest.fn()
      }))
    }
  };

  // Mock additional properties that might be expected
  public controlsManager = {
    dispose: jest.fn(),
    update: jest.fn()
  };

  initialize = jest.fn((container: HTMLElement) => {
    console.log('🎨 Mock ThreeGraphicsManager initialized');
    if (container && container.appendChild) {
      container.appendChild(this.renderer.domElement as any);
    }
  });

  getScene = jest.fn(() => this.scene);

  getCamera = jest.fn(() => this.camera);

  getRenderer = jest.fn(() => this.renderer);

  render = jest.fn(() => {
    console.log('🎨 Mock render called');
  });

  add = jest.fn((object: any) => {
    this.scene.add(object);
  });

  remove = jest.fn((object: any) => {
    this.scene.remove(object);
  });

  dispose = jest.fn(() => {
    console.log('🗑️ Mock ThreeGraphicsManager disposed');
  });

  setSize = jest.fn((width: number, height: number) => {
    console.log(`📐 Mock size set to ${width}x${height}`);
  });

  clearScene = jest.fn(() => {
    this.scene.children = [];
  });

  // Additional methods that might be expected from IGraphicsManager
  enableCameraControls = jest.fn();
  disableCameraControls = jest.fn();
  onWindowResize = jest.fn();
}
