import { ThreeGraphicsManager } from '../graphics/ThreeGraphicsManager';
import { RenderSystemAdapter } from './RenderSystemAdapter';
import { createAdapterRenderSystem } from './createAdapterRenderSystem';

export type RenderSystemMode = 'adapter';

/**
 * Build a render system instance based on the selected mode.
 * - legacy: returns the SimplifiedRenderSystem
 * - adapter: returns the adapter-backed minimal RenderSystem
 */
export function buildRenderSystem(_mode: RenderSystemMode = 'adapter', gfx?: ThreeGraphicsManager): RenderSystemAdapter {
  return createAdapterRenderSystem(gfx);
}
