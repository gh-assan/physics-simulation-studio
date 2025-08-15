import { ThreeGraphicsManager } from '../graphics/ThreeGraphicsManager';
import { RenderSystem } from './RenderSystem';
import { RenderSystemAdapter } from './RenderSystemAdapter';

/**
 * Factory: create an adapter-backed minimal RenderSystem.
 * If a ThreeGraphicsManager is provided, it will be used; otherwise a new one is created.
 */
export function createAdapterRenderSystem(gfx?: ThreeGraphicsManager): RenderSystemAdapter {
  const graphics = gfx ?? new ThreeGraphicsManager();
  const inner = new RenderSystem(graphics.getScene());
  return new RenderSystemAdapter(graphics, inner);
}
