import * as THREE from 'three';
import { IRenderer } from './IRenderer';

/**
 * Simple render system that manages renderers
 */
export class RenderSystem {
  private renderers: IRenderer[] = [];

  constructor(private scene: THREE.Scene) {}

  registerRenderer(renderer: IRenderer): void {
    this.renderers.push(renderer);
    this.renderers.sort((a, b) => a.priority - b.priority);
  }

  unregisterRenderer(rendererOrName: IRenderer | string): void {
    if (typeof rendererOrName === 'string') {
      const idx = this.renderers.findIndex(r => r.name === rendererOrName);
      if (idx !== -1) this.renderers.splice(idx, 1);
      return;
    }
    const index = this.renderers.indexOf(rendererOrName);
    if (index !== -1) this.renderers.splice(index, 1);
  }

  update(): void {
    // Minimal update to satisfy TDD tests; no scene plumbing yet
    this.renderers.forEach(renderer => {
      renderer.update();
    });
  }

  getDebugInfo() {
    return {
      rendererCount: this.renderers.length,
      renderers: this.renderers.map(r => ({
        name: r.name,
        priority: r.priority
      }))
    };
  }

  dispose(): void {
    this.renderers.forEach(renderer => renderer.dispose());
    this.renderers = [];
  }
}
