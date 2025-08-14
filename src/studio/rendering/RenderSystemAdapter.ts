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

  constructor(
    private graphicsManager: ThreeGraphicsManager,
    private inner: RenderSystem
  ) {}

  // Accept both minimal and legacy-like renderers; forward minimal, warn for legacy for now
  registerRenderer(renderer: LegacyRenderer | MinimalRenderer): void {
    if (this.isMinimalRenderer(renderer)) {
      this.inner.registerRenderer(renderer);
      return;
    }
    this.unsupportedRegistrations++;
    console.warn('RenderSystemAdapter: legacy renderer types are not supported yet');
  }

  unregisterRenderer(_name: string): void {
    // Not supported by minimal RenderSystem without reference; no-op
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
  }

  private isMinimalRenderer(r: any): r is MinimalRenderer {
    return r && typeof r.name === 'string' && typeof r.update === 'function';
  }
}
