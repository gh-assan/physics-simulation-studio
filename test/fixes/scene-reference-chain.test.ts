/**
 * Scene Reference Chain Diagnostic Test
 *
 * This test specifically validates that the scene reference is properly
 * passed from ThreeGraphicsManager -> SimplifiedRenderSystem -> SimplifiedRenderManager -> Renderers
 */

import { World } from '../../src/core/ecs/World';
import { PluginManager } from '../../src/core/plugin/PluginManager';
import { FlagSimulationPlugin } from '../../src/plugins/flag-simulation/FlagSimulationPlugin';
import { ThreeGraphicsManager } from '../../src/studio/graphics/ThreeGraphicsManager';
import { SimplifiedRenderSystem } from '../../src/studio/rendering/simplified/SimplifiedRenderSystem';
import { StateManager } from '../../src/studio/state/StateManager';
import { Studio } from '../../src/studio/Studio';

describe('🔗 Scene Reference Chain Diagnostic', () => {
  let container: HTMLElement;
  let studio: Studio;
  let graphicsManager: ThreeGraphicsManager;
  let world: World;
  let pluginManager: PluginManager;
  let stateManager: StateManager;

  beforeEach(() => {
    // Create DOM container
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);

    // Set up core systems
    world = new World();
    pluginManager = new PluginManager(world);
    stateManager = StateManager.getInstance();

    const pluginContext = {
      studio: undefined as any,
      world: world,
      eventBus: {
        emit: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
        once: jest.fn(),
      } as any,
      getStateManager: () => stateManager,
    };

    studio = new Studio(world, pluginManager, stateManager, pluginContext);
    pluginContext.studio = studio;

    // Initialize graphics manager
    graphicsManager = new ThreeGraphicsManager();
    graphicsManager.initialize(container);
  });

  afterEach(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    if (graphicsManager) {
      graphicsManager.dispose();
    }
  });

  test('🔍 Scene Reference Chain Validation', async () => {
    console.log('🔗 TRACING SCENE REFERENCE CHAIN...');
    console.log('=====================================');

    // 1. Get the original scene from ThreeGraphicsManager
    const originalScene = graphicsManager.getScene();
    console.log('1️⃣ Original scene from ThreeGraphicsManager:', {
      exists: !!originalScene,
      type: typeof originalScene,
      id: originalScene?.id,
      constructor: originalScene?.constructor?.name
    });

    // 2. Create SimplifiedRenderSystem and check its scene
    const renderSystem = new SimplifiedRenderSystem(graphicsManager);
    studio.setOrchestratorRenderSystem(renderSystem);

    const renderSystemScene = renderSystem.getScene();
    console.log('2️⃣ Scene from SimplifiedRenderSystem:', {
      exists: !!renderSystemScene,
      type: typeof renderSystemScene,
      id: renderSystemScene?.id,
      constructor: renderSystemScene?.constructor?.name
    });

    // 3. Check if they're the same reference
    const sceneReferencesMatch = originalScene === renderSystemScene;
    console.log('3️⃣ Scene references match:', sceneReferencesMatch);

    if (!sceneReferencesMatch) {
      console.error('❌ SCENE REFERENCE MISMATCH!');
      console.error('This means renderSystem has different scene than graphicsManager');
    }

    // 4. Access the internal RenderManager scene (using reflection)
    const renderManager = (renderSystem as any).renderManager;
    const renderManagerScene = renderManager?.scene;
    console.log('4️⃣ Scene from RenderManager:', {
      exists: !!renderManagerScene,
      type: typeof renderManagerScene,
      id: renderManagerScene?.id,
      constructor: renderManagerScene?.constructor?.name
    });

    const renderManagerSceneMatches = originalScene === renderManagerScene;
    console.log('5️⃣ RenderManager scene matches original:', renderManagerSceneMatches);

    // 5. Now test with a real renderer
    const flagPlugin = new FlagSimulationPlugin();
    pluginManager.registerPlugin(flagPlugin);
    await studio.loadSimulation('flag-simulation');

    // Trigger render to capture the scene passed to renderers
    let capturedScene: any = null;

    // Monkey patch the SimplifiedFlagRenderer to capture the scene
    const renderer = (flagPlugin as any).renderer;
    if (renderer) {
      const originalRender = renderer.render.bind(renderer);
      renderer.render = function (contextOrState: any) {
        if ('scene' in contextOrState) {
          capturedScene = contextOrState.scene;
          console.log('6️⃣ Scene captured from renderer context:', {
            exists: !!capturedScene,
            type: typeof capturedScene,
            id: capturedScene?.id,
            constructor: capturedScene?.constructor?.name
          });
        }
        return originalRender(contextOrState);
      };
    }

    // Trigger render cycle
    studio.update(16.67);

    // 6. Verify the captured scene matches original
    if (capturedScene) {
      const rendererSceneMatches = originalScene === capturedScene;
      console.log('7️⃣ Renderer received scene matches original:', rendererSceneMatches);

      if (!rendererSceneMatches) {
        console.error('❌ RENDERER SCENE MISMATCH!');
        console.error('Renderer received different scene than graphics manager');
      }

      expect(rendererSceneMatches).toBe(true);
    }

    // 7. Final verification - check if objects added to captured scene appear in original scene
    if (capturedScene && originalScene) {
      const originalChildCount = originalScene.children.length;

      // Add a test object to the captured scene
      const testMesh = new (require('three')).Mesh();
      capturedScene.add(testMesh);

      const newChildCount = originalScene.children.length;
      const objectAppearsInOriginal = newChildCount > originalChildCount;

      console.log('8️⃣ Test object added to renderer scene appears in original:', objectAppearsInOriginal);
      console.log(`   Original scene children: ${originalChildCount} -> ${newChildCount}`);

      if (!objectAppearsInOriginal) {
        console.error('❌ SCENE ISOLATION PROBLEM!');
        console.error('Objects added to renderer scene don\'t appear in rendered scene');
      }

      expect(objectAppearsInOriginal).toBe(true);
    }

    console.log('=====================================');
    console.log('🔗 SCENE REFERENCE CHAIN TEST COMPLETE');
  });
});
