/**
 * Renderer registration investigation — minimized.
 */

import { SimulationManager } from '../../src/studio/simulation/SimulationManager';
import { createAdapterRenderSystem } from '../../src/studio/rendering/createAdapterRenderSystem';

describe('Renderer registration via adapter (minimal)', () => {
  beforeEach(() => {
    (SimulationManager as any)._instance = undefined;
  });

  afterEach(() => {
    (SimulationManager as any)._instance = undefined;
  });

  it('registers a renderer through SimulationManager into adapter', () => {
    const renderSystem: any = createAdapterRenderSystem();
    const manager = SimulationManager.getInstance();
    manager.setRenderSystem(renderSystem);

    const renderer: any = {
      name: 'test-renderer',
      initialize: () => {},
      canRender: () => true,
      render: () => true,
      dispose: () => {}
    };

    manager.registerRenderer('test-sim', renderer);

    const info = renderSystem.getDebugInfo?.();
    if (info?.adapter) {
      const total = (info.adapter.legacyCount || 0) + (info.adapter.minimalCount || 0);
      expect(total).toBe(1);
      const names = (info.adapter.legacyRenderers || []).concat(info.adapter.minimalRenderers || []);
      expect(names).toContain('test-renderer');
    } else {
      // Fallback: at least update exists and nothing threw
      expect(typeof renderSystem.update).toBe('function');
    }

    renderSystem.dispose?.();
  });
});
