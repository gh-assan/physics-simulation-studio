import { RenderSystem } from './RenderSystem';
import { IWorld } from '../../core/ecs/IWorld';
import { ThreeGraphicsManager } from '../graphics/ThreeGraphicsManager';
import * as THREE from 'three';

type LegacyRenderer = {
  name?: string;
  canRender?: Function;
  render?: Function;
  needsRender?: () => boolean;
  markDirty?: () => void;
  dispose?: (scene?: THREE.Scene) => void;
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
  private legacyRenderersByName: Map<string, LegacyRenderer> = new Map();
  private frameNumber = 0;

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
    // Support legacy-like renderers by calling their render(context) during update
    if (renderer && typeof (renderer as LegacyRenderer).render === 'function') {
      const name = (renderer as LegacyRenderer).name ?? `legacy-${this.legacyRenderersByName.size + 1}`;
      this.legacyRenderersByName.set(name, renderer as LegacyRenderer);
      return;
    }
    this.unsupportedRegistrations++;
    console.warn('RenderSystemAdapter: legacy renderer types are not supported yet');
  }

  unregisterRenderer(nameOrRenderer: string | MinimalRenderer | LegacyRenderer): void {
    // Unregister minimal by name or instance
    if (typeof nameOrRenderer === 'string') {
      const ref = this.minimalRenderersByName.get(nameOrRenderer);
      if (ref) {
        this.inner.unregisterRenderer(ref);
        this.minimalRenderersByName.delete(nameOrRenderer);
      }
      if (this.legacyRenderersByName.has(nameOrRenderer)) {
        // Dispose legacy renderer if it supports it
        const legacy = this.legacyRenderersByName.get(nameOrRenderer)!;
        try { legacy.dispose?.(this.getScene()); } catch (e) {
          // ignore dispose error for legacy renderer
        }
        this.legacyRenderersByName.delete(nameOrRenderer);
      }
      return;
    }
    // Instance based
    if (this.isMinimalRenderer(nameOrRenderer)) {
      this.inner.unregisterRenderer(nameOrRenderer);
      if (nameOrRenderer.name) this.minimalRenderersByName.delete(nameOrRenderer.name);
      return;
    }
    // Legacy instance: find by value
    for (const [key, val] of this.legacyRenderersByName) {
      if (val === nameOrRenderer) {
        try { val.dispose?.(this.getScene()); } catch (e) {
          // ignore dispose error for legacy renderer
        }
        this.legacyRenderersByName.delete(key);
        break;
      }
    }
  }

  getGraphicsManager(): ThreeGraphicsManager {
    return this.graphicsManager;
  }

  getScene() {
    return this.graphicsManager.getScene();
  }

  update(world: IWorld, deltaTime: number): void {
    // Tick minimal renderers via inner system
    this.inner.update();

    // Then tick legacy-style renderers with a constructed context
    if (this.legacyRenderersByName.size > 0) {
      const scene = this.graphicsManager.getScene();
      const camera = this.graphicsManager.getCamera();
      this.frameNumber++;
      const context = {
        scene,
        camera,
        world,
        deltaTime,
        frameNumber: this.frameNumber
      };
      let didRender = false;
      for (const renderer of this.legacyRenderersByName.values()) {
        try {
          // Optional needsRender gate
          if (renderer.needsRender && renderer.needsRender() === false) continue;
          renderer.render!(context);
          didRender = true;
        } catch (e) {
          console.error('RenderSystemAdapter: legacy renderer failed during render()', e);
        }
      }
      // If any legacy renderer ran, present the frame via Three.js
      if (didRender) {
        try {
          this.graphicsManager.render();
        } catch (_e) {
          // Swallow render exceptions to avoid breaking simulation loop
        }
      }
    }
  }

  getDebugInfo() {
    const info = this.inner.getDebugInfo();
    return {
      ...info,
      adapter: {
        unsupportedRegistrations: this.unsupportedRegistrations,
        legacyCount: this.legacyRenderersByName.size,
        legacyRenderers: Array.from(this.legacyRenderersByName.keys()),
        minimalCount: this.minimalRenderersByName.size,
        minimalRenderers: Array.from(this.minimalRenderersByName.keys()),
      }
    };
  }

  dispose(): void {
    this.inner.dispose();
    // Dispose legacy renderers if they support it
    const scene = this.getScene();
    for (const r of this.legacyRenderersByName.values()) {
      try { r.dispose?.(scene); } catch (e) {
        // ignore dispose error for legacy renderer
      }
    }
    this.legacyRenderersByName.clear();
    this.minimalRenderersByName.clear();
  }

  private isMinimalRenderer(r: any): r is MinimalRenderer {
    return r && typeof r.name === 'string' && typeof r.update === 'function';
  }
}
