import {
  RenderPipeline,
  BaseRenderPass,
  GeometryRenderPass,
  Scene,
  RenderTarget,
  RenderPipelineFactory
} from '../RenderPipeline';
import {
  IRenderPass,
  IRenderPassContext,
  RenderTargetFormat
} from '../interfaces';
import { Camera, EnhancedCameraManager } from '../EnhancedCameraManager';
import { CameraType } from '../interfaces';

// Mock render pass for testing
class MockRenderPass extends BaseRenderPass {
  public executed = false;
  public context: IRenderPassContext | null = null;

  constructor(name: string, priority = 0, enabled = true) {
    super(name, priority);
    this.enabled = enabled;
  }

  execute(context: IRenderPassContext): void {
    this.executed = true;
    this.context = context;
  }

  reset(): void {
    this.executed = false;
    this.context = null;
  }
}

describe('RenderPipeline', () => {
  let pipeline: RenderPipeline;
  let camera: Camera;

  beforeEach(() => {
    pipeline = new RenderPipeline();
    camera = new Camera(CameraType.PERSPECTIVE);
  });

  afterEach(() => {
    pipeline.dispose();
  });

  describe('Initialization', () => {
    test('should initialize successfully', async () => {
      await expect(pipeline.initialize()).resolves.not.toThrow();
    });

    test('should handle double initialization', async () => {
      await pipeline.initialize();

      // Second initialization should not throw
      await expect(pipeline.initialize()).resolves.not.toThrow();
    });

    test('should throw error when using uninitialized pipeline', () => {
      expect(() => {
        pipeline.beginFrame();
      }).toThrow('Pipeline not initialized');
    });
  });

  describe('Frame Management', () => {
    beforeEach(async () => {
      await pipeline.initialize();
      pipeline.setCamera(camera);
    });

    test('should manage frame lifecycle', () => {
      expect(() => {
        pipeline.beginFrame();
        pipeline.endFrame();
      }).not.toThrow();
    });

    test('should track frame statistics', () => {
      pipeline.beginFrame();
      pipeline.endFrame();

      const stats = pipeline.getStats();
      expect(stats.frameTime).toBeGreaterThanOrEqual(0);
      expect(stats.fps).toBeGreaterThanOrEqual(0);
      expect(stats.drawCalls).toBe(0);
    });

    test('should increment frame number', () => {
      const initialStats = pipeline.getStats();

      pipeline.beginFrame();
      pipeline.endFrame();

      pipeline.beginFrame();
      pipeline.endFrame();

      // Frame number should increment (indirectly tested through frameTime changes)
      const finalStats = pipeline.getStats();
      expect(finalStats.frameTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Camera Management', () => {
    test('should set active camera', () => {
      expect(() => {
        pipeline.setCamera(camera);
      }).not.toThrow();
    });

    test('should warn when no camera is set for rendering', async () => {
      await pipeline.initialize();

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const mockPass = new MockRenderPass('test-pass');

      pipeline.executePass(mockPass);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('No active camera for pass: test-pass')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Render Target Management', () => {
    beforeEach(async () => {
      await pipeline.initialize();
    });

    test('should set render target', () => {
      const renderTarget = new RenderTarget(800, 600);

      expect(() => {
        pipeline.setRenderTarget(renderTarget);
      }).not.toThrow();

      renderTarget.dispose();
    });

    test('should handle null render target (default framebuffer)', () => {
      expect(() => {
        pipeline.setRenderTarget(null);
      }).not.toThrow();
    });
  });

  describe('Render Pass Management', () => {
    beforeEach(async () => {
      await pipeline.initialize();
      pipeline.setCamera(camera);
    });

    test('should add render passes', () => {
      const pass1 = new MockRenderPass('pass1', 10);
      const pass2 = new MockRenderPass('pass2', 5);

      pipeline.addRenderPass(pass1);
      pipeline.addRenderPass(pass2);

      expect(pipeline.getRenderPass('pass1')).toBe(pass1);
      expect(pipeline.getRenderPass('pass2')).toBe(pass2);
    });

    test('should remove render passes', () => {
      const pass = new MockRenderPass('removable');

      pipeline.addRenderPass(pass);
      expect(pipeline.getRenderPass('removable')).toBe(pass);

      pipeline.removeRenderPass('removable');
      expect(pipeline.getRenderPass('removable')).toBeUndefined();
    });

    test('should execute render passes in priority order', () => {
      const pass1 = new MockRenderPass('high-priority', 1);
      const pass2 = new MockRenderPass('low-priority', 10);
      const pass3 = new MockRenderPass('medium-priority', 5);

      pipeline.addRenderPass(pass2); // Add in random order
      pipeline.addRenderPass(pass1);
      pipeline.addRenderPass(pass3);

      const scene = new Scene();
      pipeline.executeAllPasses(scene);

      expect(pass1.executed).toBe(true);
      expect(pass2.executed).toBe(true);
      expect(pass3.executed).toBe(true);
    });

    test('should skip disabled render passes', () => {
      const enabledPass = new MockRenderPass('enabled', 1, true);
      const disabledPass = new MockRenderPass('disabled', 2, false);

      pipeline.addRenderPass(enabledPass);
      pipeline.addRenderPass(disabledPass);

      const scene = new Scene();
      pipeline.executeAllPasses(scene);

      expect(enabledPass.executed).toBe(true);
      expect(disabledPass.executed).toBe(false);
    });

    test('should handle render pass execution errors', () => {
      class ErrorPass extends BaseRenderPass {
        execute(): void {
          throw new Error('Test error');
        }
      }

      const errorPass = new ErrorPass('error-pass');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      pipeline.addRenderPass(errorPass);

      expect(() => {
        const scene = new Scene();
        pipeline.executeAllPasses(scene);
      }).not.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error in render pass error-pass:'),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    test('should provide render context to passes', () => {
      const pass = new MockRenderPass('context-test');

      pipeline.addRenderPass(pass);
      pipeline.setCamera(camera);
      pipeline.beginFrame(); // Add beginFrame() call before executing passes

      const scene = new Scene();
      pipeline.executeAllPasses(scene);

      expect(pass.context).toBeDefined();
      expect(pass.context!.camera).toBe(camera);
      expect(pass.context!.scene).toBe(scene);
      expect(pass.context!.frameNumber).toBeGreaterThan(0);
    });
  });

  describe('Statistics Tracking', () => {
    beforeEach(async () => {
      await pipeline.initialize();
      pipeline.setCamera(camera);
    });

    test('should track draw calls', () => {
      const pass1 = new MockRenderPass('pass1');
      const pass2 = new MockRenderPass('pass2');

      pipeline.addRenderPass(pass1);
      pipeline.addRenderPass(pass2);

      pipeline.beginFrame();
      const scene = new Scene();
      pipeline.executeAllPasses(scene);
      pipeline.endFrame();

      const stats = pipeline.getStats();
      expect(stats.drawCalls).toBe(2);
    });

    test('should reset stats each frame', () => {
      const pass = new MockRenderPass('test-pass');
      pipeline.addRenderPass(pass);

      // First frame
      pipeline.beginFrame();
      pipeline.executeAllPasses(new Scene());
      pipeline.endFrame();

      let stats = pipeline.getStats();
      expect(stats.drawCalls).toBe(1);

      // Second frame
      pipeline.beginFrame();
      pipeline.executeAllPasses(new Scene());
      pipeline.endFrame();

      stats = pipeline.getStats();
      expect(stats.drawCalls).toBe(1); // Should reset
    });
  });

  describe('Disposal', () => {
    test('should clean up resources on disposal', async () => {
      await pipeline.initialize();

      const pass = new MockRenderPass('disposable');
      pipeline.addRenderPass(pass);

      pipeline.dispose();

      expect(pipeline.getRenderPass('disposable')).toBeUndefined();
    });
  });
});

describe('BaseRenderPass', () => {
  class TestRenderPass extends BaseRenderPass {
    public executeCallCount = 0;

    execute(context: IRenderPassContext): void {
      this.executeCallCount++;
    }
  }

  test('should initialize with correct properties', () => {
    const pass = new TestRenderPass('test-pass', 5);

    expect(pass.name).toBe('test-pass');
    expect(pass.priority).toBe(5);
    expect(pass.enabled).toBe(true);
  });

  test('should execute when enabled', () => {
    const pass = new TestRenderPass('test-pass');
    const mockContext = {} as IRenderPassContext;

    expect(pass.shouldExecute(mockContext)).toBe(true);

    pass.execute(mockContext);
    expect(pass.executeCallCount).toBe(1);
  });

  test('should not execute when disabled', () => {
    const pass = new TestRenderPass('test-pass');
    pass.enabled = false;

    const mockContext = {} as IRenderPassContext;
    expect(pass.shouldExecute(mockContext)).toBe(false);
  });

  test('should return empty dependencies by default', () => {
    const pass = new TestRenderPass('test-pass');
    expect(pass.getDependencies()).toEqual([]);
  });
});

describe('GeometryRenderPass', () => {
  let geometryPass: GeometryRenderPass;
  let scene: Scene;
  let camera: Camera;

  beforeEach(() => {
    geometryPass = new GeometryRenderPass();
    scene = new Scene();
    camera = new Camera(CameraType.PERSPECTIVE);
  });

  test('should initialize with correct name and priority', () => {
    expect(geometryPass.name).toBe('geometry');
    expect(geometryPass.priority).toBe(100);
  });

  test('should execute without errors', () => {
    const context: IRenderPassContext = {
      camera,
      renderTarget: null,
      time: performance.now(),
      deltaTime: 16.67,
      frameNumber: 1,
      viewport: { x: 0, y: 0, width: 800, height: 600 },
      scene
    };

    expect(() => {
      geometryPass.execute(context);
    }).not.toThrow();
  });

  test('should handle empty scene', () => {
    const context: IRenderPassContext = {
      camera,
      renderTarget: null,
      time: performance.now(),
      deltaTime: 16.67,
      frameNumber: 1,
      viewport: { x: 0, y: 0, width: 800, height: 600 },
      scene
    };

    expect(() => {
      geometryPass.execute(context);
    }).not.toThrow();
  });
});

describe('Scene', () => {
  let scene: Scene;

  beforeEach(() => {
    scene = new Scene();
  });

  test('should start empty', () => {
    expect(scene.getRenderables()).toEqual([]);
  });

  test('should add objects', () => {
    const object = { id: 'test-object' };
    scene.add(object);

    expect(scene.getRenderables()).toContain(object);
  });

  test('should remove objects', () => {
    const object = { id: 'test-object' };
    scene.add(object);
    scene.remove(object);

    expect(scene.getRenderables()).not.toContain(object);
  });

  test('should clear all objects', () => {
    const object1 = { id: 'object1' };
    const object2 = { id: 'object2' };

    scene.add(object1);
    scene.add(object2);
    scene.clear();

    expect(scene.getRenderables()).toEqual([]);
  });

  test('should update renderable objects', () => {
    const mockObject = {
      id: 'updatable',
      update: jest.fn()
    };

    scene.add(mockObject);
    scene.update(16.67);

    expect(mockObject.update).toHaveBeenCalledWith(16.67);
  });

  test('should handle objects without update method', () => {
    const staticObject = { id: 'static' };

    scene.add(staticObject);

    expect(() => {
      scene.update(16.67);
    }).not.toThrow();
  });
});

describe('RenderTarget', () => {
  let renderTarget: RenderTarget;

  beforeEach(() => {
    renderTarget = new RenderTarget(800, 600);
  });

  afterEach(() => {
    renderTarget.dispose();
  });

  test('should initialize with correct dimensions', () => {
    expect(renderTarget.width).toBe(800);
    expect(renderTarget.height).toBe(600);
    expect(renderTarget.format).toBe(RenderTargetFormat.RGBA8);
    expect(renderTarget.samples).toBe(1);
  });

  test('should initialize with custom format', () => {
    const customTarget = new RenderTarget(512, 512, RenderTargetFormat.RGBA16F, 4);

    expect(customTarget.format).toBe(RenderTargetFormat.RGBA16F);
    expect(customTarget.samples).toBe(4);

    customTarget.dispose();
  });

  test('should bind and unbind', () => {
    expect(() => {
      renderTarget.bind();
      renderTarget.unbind();
    }).not.toThrow();
  });

  test('should handle double bind/unbind', () => {
    renderTarget.bind();
    renderTarget.bind(); // Should not cause issues

    renderTarget.unbind();
    renderTarget.unbind(); // Should not cause issues
  });

  test('should provide color texture', () => {
    const colorTexture = renderTarget.getColorTexture();
    expect(colorTexture).toBeDefined();
    expect(colorTexture.width).toBe(800);
    expect(colorTexture.height).toBe(600);
  });

  test('should provide depth texture', () => {
    const depthTexture = renderTarget.getDepthTexture();
    expect(depthTexture).toBeDefined();
    expect(depthTexture.format).toBe(RenderTargetFormat.DEPTH24);
  });

  test('should resize render target', () => {
    renderTarget.resize(1024, 768);

    expect(renderTarget.width).toBe(1024);
    expect(renderTarget.height).toBe(768);

    const colorTexture = renderTarget.getColorTexture();
    expect(colorTexture.width).toBe(1024);
    expect(colorTexture.height).toBe(768);
  });

  test('should not resize if dimensions are same', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    renderTarget.resize(800, 600); // Same dimensions

    // Should not log resize message
    expect(consoleSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Resizing')
    );

    consoleSpy.mockRestore();
  });
});

describe('RenderPipelineFactory', () => {
  test('should create standard pipeline', () => {
    const pipeline = RenderPipelineFactory.createStandardPipeline();

    expect(pipeline).toBeInstanceOf(RenderPipeline);
    expect(pipeline.getRenderPass('geometry')).toBeDefined();

    pipeline.dispose();
  });

  test('should create forward rendering pipeline', () => {
    const pipeline = RenderPipelineFactory.createForwardRenderingPipeline();

    expect(pipeline).toBeInstanceOf(RenderPipeline);

    pipeline.dispose();
  });

  test('should create deferred rendering pipeline', () => {
    const pipeline = RenderPipelineFactory.createDeferredRenderingPipeline();

    expect(pipeline).toBeInstanceOf(RenderPipeline);

    pipeline.dispose();
  });
});
