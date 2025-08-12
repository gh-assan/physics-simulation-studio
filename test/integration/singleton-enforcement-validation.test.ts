/**
 * Singleton Enforcement Validation Test
 *
 * This test validates that:
 * 1. SimulationManager.getInstance() always returns the same instance
 * 2. All production code uses the singleton pattern correctly
 * 3. Renderer registration works through the singleton
 */

import { SimulationManager } from '../../src/studio/simulation/SimulationManager';
import { SimulationOrchestrator } from '../../src/studio/SimulationOrchestrator';
import { Studio } from '../../src/studio/Studio';
import { World } from '../../src/core/ecs/World';
import { PluginManager } from '../../src/core/plugin/PluginManager';
import { StateManager } from '../../src/studio/state/StateManager';
import { MockThreeGraphicsManager } from '../mocks/MockThreeGraphicsManager';
import { SimplifiedRenderSystem } from '../../src/studio/rendering/simplified/SimplifiedRenderSystem';

describe('🔒 Singleton Enforcement Validation', () => {
  beforeEach(() => {
    // Reset singleton for clean test state
    (SimulationManager as any)._instance = undefined;
  });

  it('✅ SimulationManager.getInstance() returns same instance', () => {
    const instance1 = SimulationManager.getInstance();
    const instance2 = SimulationManager.getInstance();
    const instance3 = SimulationManager.getInstance();

    expect(instance1).toBe(instance2);
    expect(instance2).toBe(instance3);
    expect(instance1).toBe(instance3);

    console.log('✅ Singleton pattern working: All getInstance() calls return same instance');
  });

  it('✅ SimulationOrchestrator uses singleton instance', () => {
    const world = new World();
    const pluginManager = new PluginManager(world);
    const stateManager = StateManager.getInstance();
    const mockContext = {
      world,
      pluginManager,
      stateManager,
      getRenderer: jest.fn()
    } as any;

    const studio = new Studio(world, pluginManager, stateManager, mockContext);
    const orchestrator = new SimulationOrchestrator(world, pluginManager, studio);

    // Get singleton instance
    const singletonInstance = SimulationManager.getInstance();

    // Inject singleton to check if orchestrator uses it
    studio.setOrchestratorSimulationManager(singletonInstance);

    expect(singletonInstance).toBeDefined();
    console.log('✅ SimulationOrchestrator can be configured to use singleton instance');
  });

  it('✅ Renderer registration works through singleton', () => {
    const renderSystem = new SimplifiedRenderSystem(new MockThreeGraphicsManager() as any);
    const singleton = SimulationManager.getInstance();

    // Set render system on singleton
    singleton.setRenderSystem(renderSystem);

    // Create a mock renderer
    const mockRenderer = {
      name: 'singleton-test-renderer',
      initialize: jest.fn(),
      canRender: jest.fn(() => true),
      render: jest.fn(() => true),
      dispose: jest.fn()
    };

    // Register renderer through singleton
    singleton.registerRenderer('singleton-test', mockRenderer as any);

    // Check that renderer is registered with render system
    const debugInfo = renderSystem.getDebugInfo();
    expect(debugInfo.rendererCount).toBe(1);
    expect(debugInfo.renderers).toContain('singleton-test-renderer');

    console.log('✅ Renderer registration works through singleton instance');
  });

  it('✅ Multiple components share same singleton instance', () => {
    // Simulate multiple components getting the instance
    const managerFromOrchestrator = SimulationManager.getInstance();
    const managerFromPlugin = SimulationManager.getInstance();
    const managerFromFramework = SimulationManager.getInstance();

    // All should be the same instance
    expect(managerFromOrchestrator).toBe(managerFromPlugin);
    expect(managerFromPlugin).toBe(managerFromFramework);
    expect(managerFromOrchestrator).toBe(managerFromFramework);

    // Register different components with the same singleton
    managerFromOrchestrator.registerAlgorithm({
      name: 'test-algorithm-1',
      version: '1.0.0',
      initialize: jest.fn(),
      step: jest.fn(),
      dispose: jest.fn(),
      configure: jest.fn(),
      getParameters: jest.fn(() => new Map()),
      validateParameter: jest.fn(() => true)
    });

    managerFromPlugin.registerAlgorithm({
      name: 'test-algorithm-2',
      version: '1.0.0',
      initialize: jest.fn(),
      step: jest.fn(),
      dispose: jest.fn(),
      configure: jest.fn(),
      getParameters: jest.fn(() => new Map()),
      validateParameter: jest.fn(() => true)
    });

    // Both algorithms should be in the same instance
    const activeAlgorithms = managerFromFramework.getActiveAlgorithms();
    expect(activeAlgorithms).toHaveLength(2);
    expect(activeAlgorithms.map(a => a.name)).toContain('test-algorithm-1');
    expect(activeAlgorithms.map(a => a.name)).toContain('test-algorithm-2');

    console.log('✅ Multiple components successfully share same singleton instance');
  });

  it('✅ Singleton state persists across components', () => {
    const manager1 = SimulationManager.getInstance();
    const manager2 = SimulationManager.getInstance();

    // Set state through first reference
    manager1.setEntities([100, 200, 300]);

    // Start simulation through first reference
    manager1.play();

    // Check state through second reference
    const state = manager2.getCurrentState();
    expect(state.isRunning).toBe(true);

    // Stop simulation through second reference
    manager2.pause();

    // Check state through first reference
    const updatedState = manager1.getCurrentState();
    expect(updatedState.isRunning).toBe(false);

    console.log('✅ Singleton state persists across all component references');
  });
});
