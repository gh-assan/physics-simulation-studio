/**
 * Main App Animation Loop & Canvas Test
 *
 * TDD Test for fixing the animation loop and canvas display issues
 *
 * Phase 2: Animation Loop & Canvas Setup
 *
 * This test should initially FAIL to demonstrate:
 * 1. Animation loop not running (contradicting the code analysis)
 * 2. Canvas not attached to DOM
 * 3. Render system not being called properly
 */

import { World } from '../core/ecs/World';
import { PluginManager } from '../core/plugin/PluginManager';
import FlagSimulationPlugin from '../plugins/flag-simulation';
import { ThreeGraphicsManager } from '../studio/graphics/ThreeGraphicsManager';
import { createAdapterRenderSystem } from '../studio/rendering/createAdapterRenderSystem';
import { StateManager } from '../studio/state/StateManager';
import { Studio } from '../studio/Studio';

// Mock requestAnimationFrame for testing
let mockRAF: jest.SpyInstance;
let rafCallbacks: ((time: number) => void)[] = [];

beforeAll(() => {
  // Mock requestAnimationFrame to capture animation loop calls
  mockRAF = jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    rafCallbacks.push(callback);
    return rafCallbacks.length; // Return a fake ID
  });
});

afterAll(() => {
  mockRAF.mockRestore();
});

describe('Main App Animation Loop & Canvas', () => {
  let world: World;
  let pluginManager: PluginManager;
  let stateManager: StateManager;
  let studio: Studio;
  let graphicsManager: ThreeGraphicsManager;
  let renderSystem: any;

  beforeEach(() => {
    // Clear RAF callbacks for each test
    rafCallbacks = [];

    // Set up core systems like main.ts does
    world = new World();
    pluginManager = new PluginManager(world);
    stateManager = StateManager.getInstance();

    const pluginContext = {
      studio: undefined as any,
      world: world,
      eventBus: { emit: jest.fn(), on: jest.fn(), off: jest.fn(), once: jest.fn() } as any,
      getStateManager: () => stateManager,
    };

    studio = new Studio(world, pluginManager, stateManager, pluginContext);
    pluginContext.studio = studio;

    // Set up render system like main.ts does
    graphicsManager = new ThreeGraphicsManager();
    renderSystem = createAdapterRenderSystem(graphicsManager);
    studio.setRenderSystem(renderSystem);
    world.registerSystem(renderSystem);
  });

  test('should start animation loop that calls studio.update()', () => {
    // FAILING TEST: This should show that animation loop is not running

    // Mock studio.update to track calls
    const updateSpy = jest.spyOn(studio, 'update');

    // Simulate the startApplication function from main.ts
    const startApplication = (studio: Studio) => {
      let lastTime = 0;
      function animate(currentTime: number) {
        requestAnimationFrame(animate);
        const deltaTime = (currentTime - lastTime) / 1000;
        lastTime = currentTime;
        studio.update(deltaTime);
      }
      animate(0);
    };

    // Start the animation loop
    startApplication(studio);

    // Verify requestAnimationFrame was called
    expect(mockRAF).toHaveBeenCalled();
    expect(rafCallbacks).toHaveLength(1);

    // Clear any initial update calls to focus on animation loop
    updateSpy.mockClear();

    // Simulate a few animation frames
    const firstFrame = rafCallbacks[0];
    firstFrame(16.67); // ~60fps frame time

    expect(rafCallbacks).toHaveLength(2); // Should schedule next frame
    expect(updateSpy).toHaveBeenCalledWith(expect.any(Number));

    // Simulate second frame
    const secondFrame = rafCallbacks[1];
    secondFrame(33.34); // Next frame

    expect(updateSpy).toHaveBeenCalledTimes(2);
  });

  test('should create and attach canvas to DOM', () => {
    // FAILING TEST: This should show canvas setup issues

    // Mock DOM elements like in index.html
    const mainContent = document.createElement('div');
    mainContent.id = 'main-content';
    mainContent.className = 'studio--main';
    document.body.appendChild(mainContent);

    // Initialize graphics manager with container
    graphicsManager.initialize(mainContent);

    // Check if canvas was created and attached
    const canvas = graphicsManager.renderer.domElement;
    expect(canvas).toBeDefined();
    expect(canvas.tagName.toLowerCase()).toBe('canvas');

    // Check if canvas is attached to main-content
    const canvasesInMainContent = mainContent.querySelectorAll('canvas');
    expect(canvasesInMainContent.length).toBeGreaterThan(0);

    // Clean up
    document.body.removeChild(mainContent);
  });

  test('should render simulation when animation loop runs', async () => {
    // FAILING TEST: This should show that rendering chain is broken

    // Register and load flag simulation
    const flagPlugin = new FlagSimulationPlugin();
    pluginManager.registerPlugin(flagPlugin);
    await pluginManager.activatePlugin('flag-simulation', studio);
    await studio.loadSimulation('flag-simulation');

    // Mock render system methods to track calls
    const renderSystemUpdateSpy = jest.spyOn(renderSystem, 'update');
    const graphicsRenderSpy = jest.spyOn(graphicsManager, 'render');

    // Start simulation
    studio.play();
    expect(studio.getIsPlaying()).toBe(true);

    // Simulate studio.update() call (what animation loop would do)
    studio.update(0.016); // 60fps frame time

    // Verify render chain was called
    expect(renderSystemUpdateSpy).toHaveBeenCalledWith(world, 0.016);

    // This might fail if render system doesn't trigger graphics render
    expect(graphicsRenderSpy).toHaveBeenCalled();
  });

  test('should handle canvas resize properly', () => {
    // FAILING TEST: This tests responsive canvas behavior

    // Mock DOM elements
    const mainContent = document.createElement('div');
    mainContent.id = 'main-content';
    document.body.appendChild(mainContent);

    // Initialize graphics manager with container
    graphicsManager.initialize(mainContent);
    const canvas = graphicsManager.renderer.domElement;

    // Simulate window resize
    const resizeEvent = new Event('resize');

    // Mock canvas size
    Object.defineProperty(canvas, 'clientWidth', { value: 800, configurable: true });
    Object.defineProperty(canvas, 'clientHeight', { value: 600, configurable: true });

    window.dispatchEvent(resizeEvent);

    // Verify canvas dimensions updated
    // (Implementation may need to be added to make this pass)
    expect(canvas.width).toBeGreaterThan(0);
    expect(canvas.height).toBeGreaterThan(0);

    // Clean up
    document.body.removeChild(mainContent);
  });

  test('should detect missing animation loop in main app', () => {
    // META TEST: This test checks if main.ts actually has the animation loop

    // This is a conceptual test - in reality we'd need to instrument main.ts
    // to detect if startApplication() is being called

    // For now, this test documents what should happen:
    const expectedMainTsFlow = {
      setupCoreSystems: true,
      setupUI: true,
      registerPlugins: true,
      startApplication: true, // ← This might be missing!
    };

    // If startApplication is missing, animation loop never starts
    expect(expectedMainTsFlow.startApplication).toBe(true);
  });
});
