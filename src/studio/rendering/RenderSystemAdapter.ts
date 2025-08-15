import { RenderSystem } from './RenderSystem';
import { IWorld } from '../../core/ecs/IWorld';
import { ThreeGraphicsManager } from '../graphics/ThreeGraphicsManager';

type LegacyRenderer = {
  name?: string;
  canRender?: Function;
  render?: Function;
};

type MinimalRenderer = {
  name: string;
  priority: number;
  update: () => void;
  dispose: () => void;
};

export class RenderSystemAdapter {
  private unsupportedRegistrations = 0;
  private minimalRenderersByName: Map<string, MinimalRenderer> = new Map();

  constructor(
    private graphicsManager: ThreeGraphicsManager,
    private inner: RenderSystem
  ) {}

  // Accept both minimal and legacy-like renderers; forward minimal, warn for legacy for now
  registerRenderer(renderer: LegacyRenderer | MinimalRenderer): void {
    if (this.isMinimalRenderer(renderer)) {
      // Track by name to allow unregister via name later
      if (renderer.name) {
        this.minimalRenderersByName.set(renderer.name, renderer);
      }
      this.inner.registerRenderer(renderer);
      return;
    }
    this.unsupportedRegistrations++;
    console.warn('RenderSystemAdapter: legacy renderer types are not supported yet');
  }

  unregisterRenderer(name: string): void {
    const ref = this.minimalRenderersByName.get(name);
    if (ref) {
      this.inner.unregisterRenderer(ref);
      this.minimalRenderersByName.delete(name);
    }
  }

  getGraphicsManager(): ThreeGraphicsManager {
    return this.graphicsManager;
  }

  getScene() {
    return this.graphicsManager.getScene();
  }

  update(_world: IWorld, _deltaTime: number): void {
    // Adapter ignores world/delta for now and just ticks the inner system
    this.inner.update();
  }

  getDebugInfo() {
    const info = this.inner.getDebugInfo();
    return {
      ...info,
      adapter: {
        unsupportedRegistrations: this.unsupportedRegistrations,
      }
    };
  }

  dispose(): void {
    this.inner.dispose();
  this.minimalRenderersByName.clear();
  }

  private isMinimalRenderer(r: any): r is MinimalRenderer {
    return r && typeof r.name === 'string' && typeof r.update === 'function';
  }
}
