import { SimplifiedRenderSystem } from './simplified/SimplifiedRenderSystem';
import { RenderSystemAdapter } from './RenderSystemAdapter';
import { createAdapterRenderSystem } from './createAdapterRenderSystem';
import { ThreeGraphicsManager } from '../graphics/ThreeGraphicsManager';

export type RenderSystemMode = 'legacy' | 'adapter';

/**
 * Build a render system instance based on the selected mode.
 * - legacy: returns the SimplifiedRenderSystem
 * - adapter: returns the adapter-backed minimal RenderSystem
 */
export function buildRenderSystem(mode: RenderSystemMode, gfx?: ThreeGraphicsManager): SimplifiedRenderSystem | RenderSystemAdapter {
  if (mode === 'adapter') {
    return createAdapterRenderSystem(gfx);
  }
  // Default to legacy simplified render system
  const graphics = gfx ?? new ThreeGraphicsManager();
  return new SimplifiedRenderSystem(graphics);
}
