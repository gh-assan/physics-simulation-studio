/**
 * 🧪 Simplified Rendering System Tests
 * 
 * Shows how much easier testing becomes with the simplified design.
 * No complex mocking, clear test cases, predictable behavior.
 */

import { SimplifiedRenderManager } from '../SimplifiedRenderManager';
import { BaseRenderer, RenderContext } from '../SimplifiedInterfaces';
import { IWorld } from '../../../../core/ecs/IWorld';
import * as THREE from 'three';

// Mock renderer for testing
class MockRenderer extends BaseRenderer {
  readonly name: string;
  readonly priority: number;
  
  public renderCalled = false;
  public canRenderResult = true;
  public entities: number[] = [];
  public initializeCalled = false;
  public disposeCalled = false;

  constructor(name = 'mock-renderer', priority = 0) {
    super();
    this.name = name;
    this.priority = priority;
  }

  canRender(entityId: number, world: IWorld): boolean {
    return this.canRenderResult;
  }

  render(context: RenderContext): void {
    this.renderCalled = true;
    this.entities = this.getEntities(context.world);
    this.markClean();
  }

  initialize(): void {
    this.initializeCalled = true;
  }

  dispose(): void {
    this.disposeCalled = true;
    super.dispose();
  }

  reset(): void {
    this.renderCalled = false;
    this.entities = [];
    this.markDirty();
  }

  // Expose protected method for testing
  public testMarkClean(): void {
    this.markClean();
  }
}

describe('SimplifiedRenderManager', () => {
  let manager: SimplifiedRenderManager;
  let scene: THREE.Scene;
  let camera: THREE.Camera;
  let mockWorld: IWorld;

  beforeEach(() => {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera();
    manager = new SimplifiedRenderManager(scene, camera);
    
    // Mock world
    mockWorld = {
      componentManager: {
        getEntitiesWithComponentTypes: jest.fn().mockReturnValue([1, 2, 3]),
        hasComponent: jest.fn().mockReturnValue(true)
      }
    } as any;
  });

  describe('Renderer Registration', () => {
    it('should register and initialize renderer', () => {
      const renderer = new MockRenderer();
      const initializeSpy = jest.fn();
      renderer.initialize = initializeSpy;

      manager.registerRenderer(renderer);

      expect(initializeSpy).toHaveBeenCalled();
      expect(manager.getDebugInfo().rendererCount).toBe(1);
      expect(manager.getDebugInfo().renderers).toContain('mock-renderer');
    });

    it('should unregister and dispose renderer', () => {
      const renderer = new MockRenderer();
      const disposeSpy = jest.fn();
      renderer.dispose = disposeSpy;

      manager.registerRenderer(renderer);
      manager.unregisterRenderer('mock-renderer');

      expect(disposeSpy).toHaveBeenCalled();
      expect(manager.getDebugInfo().rendererCount).toBe(0);
    });
  });

  describe('Rendering Logic', () => {
    it('should render dirty renderers', () => {
      const renderer = new MockRenderer();
      manager.registerRenderer(renderer);

      const didRender = manager.render(mockWorld, 16);

      expect(didRender).toBe(true);
      expect(renderer.renderCalled).toBe(true);
    });

    it('should not render clean renderers', () => {
      const renderer = new MockRenderer();
      manager.registerRenderer(renderer);
      
      // First render
      manager.render(mockWorld, 16);
      renderer.reset();
      renderer.testMarkClean(); // Mark as clean using public method
      
      // Second render should skip
      const didRender = manager.render(mockWorld, 16);

      expect(didRender).toBe(false);
      expect(renderer.renderCalled).toBe(false);
    });

    it('should respect renderer priority', () => {
      const renderer1 = new MockRenderer('high-priority', 10);
      const renderer2 = new MockRenderer('low-priority', 1);

      const renderOrder: string[] = [];
      renderer1.render = (context) => {
        renderOrder.push('high-priority');
        renderer1.testMarkClean();
      };
      renderer2.render = (context) => {
        renderOrder.push('low-priority');  
        renderer2.testMarkClean();
      };

      manager.registerRenderer(renderer1);
      manager.registerRenderer(renderer2);
      manager.render(mockWorld, 16);

      expect(renderOrder).toEqual(['low-priority', 'high-priority']);
    });
  });

  describe('Dirty Flag Management', () => {
    it('should mark specific renderer as dirty', () => {
      const renderer = new MockRenderer();
      manager.registerRenderer(renderer);
      
      // Render once to clean
      manager.render(mockWorld, 16);
      renderer.reset();
      
      // Mark specific renderer dirty
      manager.markDirty('mock-renderer');
      const didRender = manager.render(mockWorld, 16);

      expect(didRender).toBe(true);
      expect(renderer.renderCalled).toBe(true);
    });

    it('should mark all renderers as dirty', () => {
      const renderer1 = new MockRenderer();
      const renderer2 = new MockRenderer();
      (renderer2 as any).name = 'mock-renderer-2';

      manager.registerRenderer(renderer1);
      manager.registerRenderer(renderer2);
      
      // Render once to clean
      manager.render(mockWorld, 16);
      renderer1.reset();
      renderer2.reset();
      
      // Mark all dirty
      manager.markAllDirty();
      const didRender = manager.render(mockWorld, 16);

      expect(didRender).toBe(true);
      expect(renderer1.renderCalled).toBe(true);
      expect(renderer2.renderCalled).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle renderer errors gracefully', () => {
      const renderer = new MockRenderer();
      renderer.render = () => {
        throw new Error('Test error');
      };

      manager.registerRenderer(renderer);
      
      // Should not throw
      expect(() => {
        const didRender = manager.render(mockWorld, 16);
        expect(didRender).toBe(false); // Error prevented render completion
      }).not.toThrow();
    });
  });

  describe('Debug Information', () => {
    it('should provide useful debug info', () => {
      const renderer = new MockRenderer();
      manager.registerRenderer(renderer);
      manager.markDirty('mock-renderer');

      const info = manager.getDebugInfo();

      expect(info.rendererCount).toBe(1);
      expect(info.dirtyCount).toBe(1);
      expect(info.frameNumber).toBe(0);
      expect(info.renderers).toEqual(['mock-renderer']);

      manager.render(mockWorld, 16);

      const updatedInfo = manager.getDebugInfo();
      expect(updatedInfo.frameNumber).toBe(1);
      expect(updatedInfo.dirtyCount).toBe(0); // Cleaned after render
    });
  });
});
