/**
 * Simplified Renderer Registration Test
 *
 * Tests the core functionality that matters:
 * 1. Singleton SimulationManager works correctly
 * 2. Renderer registration bridges to render system
 * 3. Plugin integration uses singleton correctly
 */

import { SimulationManager } from '../../src/studio/simulation/SimulationManager';
import { MockThreeGraphicsManager } from '../mocks/MockThreeGraphicsManager';
import { SimplifiedRenderSystem } from '../../src/studio/rendering/simplified/SimplifiedRenderSystem';

describe('🎯 Simplified Renderer Registration Test', () => {
  let renderSystem: SimplifiedRenderSystem;

  beforeEach(() => {
    // Reset singleton for clean test state
    (SimulationManager as any)._instance = undefined;

    // Create render system with mock graphics manager
    const mockGraphicsManager = new MockThreeGraphicsManager();
    renderSystem = new SimplifiedRenderSystem(mockGraphicsManager as any);
  });

  afterEach(() => {
    renderSystem?.dispose();
  });

  it('✅ Core functionality: Singleton + Renderer registration + Bridging', () => {
    // 1. Test singleton pattern
    const manager1 = SimulationManager.getInstance();
    const manager2 = SimulationManager.getInstance();
    expect(manager1).toBe(manager2);
    console.log('✅ Singleton pattern working');

    // 2. Test render system bridging
    manager1.setRenderSystem(renderSystem);

    // 3. Test renderer registration and bridging
    const mockRenderer = {
      name: 'test-renderer',
      initialize: jest.fn(),
      canRender: jest.fn(() => true),
      render: jest.fn(() => true),
      dispose: jest.fn()
    };

    manager1.registerRenderer('test', mockRenderer as any);

    // 4. Verify renderer is registered with render system
    const debugInfo = renderSystem.getDebugInfo();
    expect(debugInfo.rendererCount).toBe(1);
    expect(debugInfo.renderers).toContain('test-renderer');

    console.log('✅ Core renderer registration functionality works');
  });

  it('✅ Plugin simulation: Renderer registration through plugin flow', () => {
    const manager = SimulationManager.getInstance();
    manager.setRenderSystem(renderSystem);

    // Simulate what a plugin does
    const pluginRenderer = {
      name: 'plugin-renderer',
      initialize: jest.fn(),
      canRender: jest.fn(() => true),
      render: jest.fn(() => true),
      dispose: jest.fn()
    };

    // Plugin calls registerRenderer (like FlagSimulationPlugin does)
    manager.registerRenderer('plugin-simulation', pluginRenderer as any);

    // Verify it works
    const debugInfo = renderSystem.getDebugInfo();
    expect(debugInfo.rendererCount).toBe(1);
    expect(debugInfo.renderers).toContain('plugin-renderer');

    console.log('✅ Plugin-style renderer registration works');
  });
});
