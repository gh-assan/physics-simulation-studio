/**
 * 🎯 Flag Renderer Compatibility Test
 *
 * Verifies that SimplifiedFlagRenderer works with both old and new systems
 */

import { SimplifiedFlagRenderer } from '../../src/plugins/flag-simulation/SimplifiedFlagRenderer';

describe('🎯 Flag Renderer Compatibility', () => {

  test('SimplifiedFlagRenderer implements both interfaces', () => {
    console.log('✅ TESTING: SimplifiedFlagRenderer compatibility');

    const renderer = new SimplifiedFlagRenderer();

    // Test BaseRenderer interface (new system)
    expect(renderer.name).toBe('simplified-flag-renderer');
    expect(typeof renderer.priority).toBe('number');
    expect(typeof renderer.canRender).toBe('function');
    expect(typeof renderer.render).toBe('function');

    // Test ISimulationRenderer interface (old system)
    expect(typeof renderer.initialize).toBe('function');
    expect(typeof renderer.setScene).toBe('function');
    expect(typeof renderer.updateFromState).toBe('function');
    expect(typeof renderer.dispose).toBe('function');

    console.log('✅ SimplifiedFlagRenderer implements both interfaces correctly');
  });

  test('FlagSimulationPlugin returns compatible renderer', () => {
    // This import would fail if the types don't match
    const { FlagSimulationPlugin } = require('../../src/plugins/flag-simulation/FlagSimulationPlugin');

    const plugin = new FlagSimulationPlugin();
    const renderer = plugin.getRenderer();

    console.log('✅ Plugin renderer type:', renderer.constructor.name);
    expect(renderer.constructor.name).toBe('SimplifiedFlagRenderer');

    // Should work with SimulationManager (old system)
    expect(typeof renderer.initialize).toBe('function');

    // Should work with SimplifiedRenderSystem (new system)
    expect(typeof renderer.canRender).toBe('function');
    expect(typeof renderer.priority).toBe('number');

    console.log('✅ FlagSimulationPlugin returns compatible renderer');
  });

});
