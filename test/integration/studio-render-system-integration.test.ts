/**
 * Phase 2: TDD Test for Studio-RenderSystem Integration
 *
 * FAILING TEST FIRST: This test will fail until we fix Studio.update()
 * to call renderSystem.update() during the animation loop.
 *
 * ROOT CAUSE: Studio.update() missing renderSystem.update() call
 * EXPECTED FIX: Add renderSystem.update() to Studio.update() method
 */

import { World } from '../../src/core/ecs/World';
import { PluginManager } from '../../src/core/plugin/PluginManager';
import { IPluginContext } from '../../src/studio/IPluginContext';
import { createAdapterRenderSystem } from '../../src/studio/rendering/createAdapterRenderSystem';
import { StateManager } from '../../src/studio/state/StateManager';
import { Studio } from '../../src/studio/Studio';
import { MockThreeGraphicsManager } from '../mocks/MockThreeGraphicsManager';

// Mock DOM environment
const mockDocument = {
  getElementById: jest.fn((id: string) => {
    if (id === 'main-content') {
      return {
        appendChild: jest.fn(),
        innerHTML: '',
        style: {},
        offsetWidth: 800,
        offsetHeight: 600
      };
    }
    return null;
  }),
  createElement: jest.fn((tagName: string) => ({
    tagName: tagName.toUpperCase(),
    style: {},
    appendChild: jest.fn(),
    getAttribute: jest.fn(),
    setAttribute: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
    offsetWidth: 800,
    offsetHeight: 600,
    getContext: jest.fn(() => ({
      canvas: { width: 800, height: 600 },
      clearRect: jest.fn(),
      fillRect: jest.fn(),
      strokeRect: jest.fn(),
      beginPath: jest.fn(),
      closePath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn()
    }))
  })),
  querySelectorAll: jest.fn(() => [])
};

const mockBody = {
  appendChild: jest.fn(),
  style: {}
} as any;

if (!global.document) {
  Object.defineProperty(global, 'document', {
    value: { ...mockDocument, body: mockBody },
    writable: true,
    configurable: true
  });
} else {
  // Replace methods if document already exists, preserving body
  Object.assign(global.document, mockDocument);
  if (!global.document.body) {
    Object.defineProperty(global.document, 'body', {
      value: mockBody,
      configurable: true
    });
  }
}

const mockWindow = {
  dispatchEvent: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  requestAnimationFrame: jest.fn((cb) => setTimeout(cb, 16)),
  cancelAnimationFrame: jest.fn(),
  innerWidth: 800,
  innerHeight: 600
};

if (!global.window) {
  Object.defineProperty(global, 'window', {
    value: mockWindow,
    configurable: true
  });
} else {
  Object.assign(global.window, mockWindow);
}

describe('🎯 Phase 2: Studio-RenderSystem Integration Fix', () => {
  let world: World;
  let studio: Studio;
  let renderSystem: any;
  let pluginManager: PluginManager;
  let stateManager: StateManager;
  let mockContext: IPluginContext;
  let renderSystemUpdateSpy: jest.SpyInstance;

  beforeEach(async () => {
    console.log('🧪 PHASE 2 TDD TEST - Studio.update() → RenderSystem.update() integration');
    console.log('');
    console.log('This test SHOULD FAIL initially until we fix Studio.update()');
    console.log('Expected fix: Add renderSystem.update() call to Studio.update() method');
    console.log('');

    // Create core components
    world = new World();
    pluginManager = new PluginManager(world);
    stateManager = StateManager.getInstance();

    mockContext = {
      world: world,
      pluginManager: pluginManager,
      stateManager: stateManager,
      getRenderer: jest.fn()
    } as any;

    // Create render system with mocked graphics manager
  const mockGraphicsManager = new MockThreeGraphicsManager();
  renderSystem = createAdapterRenderSystem(mockGraphicsManager as any);

    // Create spy BEFORE registering with world
  renderSystemUpdateSpy = jest.spyOn(renderSystem, 'update');

    // Register render system with world
    world.registerSystem(renderSystem);

    // Create studio
    studio = new Studio(world, pluginManager, stateManager, mockContext);
    studio.setRenderSystem(renderSystem);

    console.log('🔧 Test setup complete - render system spy installed');
    console.log('');
  });

  afterEach(() => {
    renderSystemUpdateSpy?.mockRestore();
  });

  it('🚨 FAILING TEST: Studio.update() should call renderSystem.update() when playing', () => {
    console.log('🎯 TEST GOAL: Verify Studio.update() calls renderSystem.update()');
    console.log('');

    // Ensure studio is playing
    studio.play();
    expect(studio.getIsPlaying()).toBe(true);
    console.log('✅ Studio is playing');

    // Clear any previous calls from setup
    renderSystemUpdateSpy.mockClear();
    console.log('🧹 Cleared render system spy');

    // Call Studio.update() - this should trigger renderSystem.update()
    const deltaTime = 16.67; // ~60 FPS
    studio.update(deltaTime);
    console.log('📞 Called studio.update() with deltaTime:', deltaTime);

    // Check if renderSystem.update() was called
    const updateCallCount = renderSystemUpdateSpy.mock.calls.length;
    console.log('🔍 RenderSystem.update() call count:', updateCallCount);

    if (updateCallCount === 0) {
      console.log('❌ EXPECTED FAILURE: Studio.update() is NOT calling renderSystem.update()');
      console.log('🎯 ROOT CAUSE CONFIRMED: Missing renderSystem.update() call in Studio.update()');
      console.log('');
      console.log('🔧 REQUIRED FIX: Add to Studio.update():');
      console.log('   if (this.renderSystem) {');
      console.log('     this.renderSystem.update(this.world, deltaTime);');
      console.log('   }');
      console.log('');
    }

    // This assertion WILL FAIL initially - that's expected!
    expect(renderSystemUpdateSpy).toHaveBeenCalledWith(world, deltaTime);

    console.log('✅ TEST PASSED: Studio.update() successfully calls renderSystem.update()');
    console.log('🎉 PHASE 2 FIX SUCCESSFUL!');
  });

  it('🔍 Verify Studio.update() flow when not playing', () => {
    console.log('🔍 Testing Studio.update() when paused/stopped');

    // Ensure studio is NOT playing
    studio.pause();
    expect(studio.getIsPlaying()).toBe(false);
    console.log('⏸️ Studio is paused');

    // Clear any previous calls
    renderSystemUpdateSpy.mockClear();

    // Call Studio.update() - should NOT trigger renderSystem.update() when paused
    const deltaTime = 16.67;
    studio.update(deltaTime);
    console.log('📞 Called studio.update() while paused');

    // Should NOT call renderSystem.update() when not playing
    expect(renderSystemUpdateSpy).not.toHaveBeenCalled();
    console.log('✅ Correctly skipped renderSystem.update() when not playing');
  });

  it('🎯 Integration test: Full play → update → render chain', () => {
    console.log('🎯 Full integration test: play → update → render chain');

    // Start from stopped state
    studio.pause();
    renderSystemUpdateSpy.mockClear();

    // Start playing
    studio.play();
    console.log('▶️ Started playing');

    // Simulate multiple update calls (like animation loop would do)
    const frameCount = 5;
    for (let i = 0; i < frameCount; i++) {
      studio.update(16.67);
    }
    console.log(`🔄 Simulated ${frameCount} animation frames`);

    // Verify renderSystem.update() was called for each frame
    expect(renderSystemUpdateSpy).toHaveBeenCalledTimes(frameCount);
    console.log(`✅ RenderSystem.update() called ${frameCount} times as expected`);

    // Verify parameters
    expect(renderSystemUpdateSpy).toHaveBeenCalledWith(world, 16.67);
    console.log('✅ RenderSystem.update() called with correct parameters');
  });
});
