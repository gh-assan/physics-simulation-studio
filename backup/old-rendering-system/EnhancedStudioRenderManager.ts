import {
  IRenderPipeline,
  IEnhancedCameraManager,
  IEffectsManager,
  IRenderTarget,
  RenderTargetFormat
} from '../../core/rendering/interfaces';
import { RenderPipeline, RenderPipelineFactory, RenderTarget } from '../../core/rendering/RenderPipeline';
import { EnhancedCameraManager } from '../../core/rendering/EnhancedCameraManager';
import {
  IRenderManager,
  ISimulationRenderer,
  IRenderContext,
  EntityId,
  ISimulationState
} from '../../core/simulation/interfaces';

/**
 * Enhanced Studio Render Manager
 *
 * This class bridges the enhanced rendering system with the existing
 * simulation renderer interface, providing advanced rendering capabilities
 * while maintaining compatibility.
 */
export class EnhancedStudioRenderManager implements IRenderManager {
  private renderPipeline: IRenderPipeline;
  private cameraManager: IEnhancedCameraManager;
  private effectsManager: IEffectsManager | null = null;
  private renderers: Map<string, ISimulationRenderer> = new Map();
  private renderTargets: Map<string, IRenderTarget> = new Map();
  private lastRenderedState: ISimulationState | null = null;
  private isEnabled = true;
  private initialized = false;

  constructor(
    renderPipeline?: IRenderPipeline,
    cameraManager?: IEnhancedCameraManager
  ) {
    this.renderPipeline = renderPipeline || RenderPipelineFactory.createStandardPipeline();
    this.cameraManager = cameraManager || new EnhancedCameraManager();

    this.setupCameraIntegration();
  }

  /**
   * Initialize the enhanced render manager
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.warn('[EnhancedStudioRenderManager] Already initialized');
      return;
    }

    console.log('[EnhancedStudioRenderManager] Initializing enhanced render manager...');

    try {
      // Initialize render pipeline
      await this.renderPipeline.initialize();

      // Set initial camera
      const activeCamera = this.cameraManager.getActiveCamera();
      this.renderPipeline.setCamera(activeCamera);

      // Create default render targets
      this.createDefaultRenderTargets();

      this.initialized = true;
      console.log('[EnhancedStudioRenderManager] Enhanced render manager initialized successfully');

    } catch (error) {
      console.error('[EnhancedStudioRenderManager] Initialization failed:', error);
      throw new Error(`Failed to initialize enhanced render manager: ${error}`);
    }
  }

  /**
   * Register a simulation renderer
   */
  registerRenderer(renderer: ISimulationRenderer): void {
    this.validateRenderer(renderer);
    this.renderers.set(renderer.algorithmName, renderer);
    console.log(`✅ Enhanced renderer registered: ${renderer.algorithmName} (${renderer.rendererType})`);
  }

  /**
   * Unregister renderer for algorithm
   */
  unregisterRenderer(algorithmName: string): void {
    const renderer = this.renderers.get(algorithmName);
    if (!renderer) {
      console.warn(`⚠️ Renderer not found: ${algorithmName}`);
      return;
    }

    try {
      renderer.dispose(); // Use dispose instead of cleanup
    } catch (error) {
      console.error(`Error disposing renderer ${algorithmName}:`, error);
    }

    this.renderers.delete(algorithmName);
    console.log(`🗑️ Renderer unregistered: ${algorithmName}`);
  }

  /**
   * Main render method - integrates with enhanced pipeline
   */
  render(context: IRenderContext): void {
    if (!this.initialized) {
      console.warn('[EnhancedStudioRenderManager] Cannot render - not initialized');
      return;
    }

    if (!this.isEnabled) {
      return;
    }

    try {
      // Begin rendering frame
      this.renderPipeline.beginFrame();

      // Update camera if needed
      this.syncCameraWithPipeline();

      // Execute simulation renderers through pipeline
      this.executeSimulationRenderers(context);

      // End rendering frame
      this.renderPipeline.endFrame();

    } catch (error) {
      console.error('[EnhancedStudioRenderManager] Render error:', error);
    }
  }

  /**
   * Update renderer visual parameters (required by IRenderManager)
   */
  updateVisualParameters(algorithmName: string, parameters: Record<string, any>): void {
    this.updateRendererParameters(algorithmName, parameters);
  }

  /**
   * Update renderer visual parameters
   */
  updateRendererParameters(algorithmName: string, parameters: Record<string, any>): void {
    const renderer = this.renderers.get(algorithmName);
    if (!renderer) {
      console.warn(`⚠️ Renderer not found: ${algorithmName}`);
      return;
    }

    try {
      renderer.updateVisualParameters(parameters); // Use updateVisualParameters instead of updateParameters
      console.log(`🎨 Renderer parameters updated: ${algorithmName}`, parameters);
    } catch (error) {
      console.error(`Error updating visual parameters for ${algorithmName}:`, error);
    }
  }

  /**
   * Render specific simulation state (reactive rendering)
   */
  renderState(state: ISimulationState): void {
    if (!this.initialized || !this.isEnabled) {
      return;
    }

    // Only render if state has changed
    if (this.lastRenderedState === state) {
      return;
    }

    console.log('🎬 Rendering state change...');

    try {
      this.renderPipeline.beginFrame();

      // Render all registered renderers with current state entities
      const entities = Array.from(state.entities);
      for (const renderer of this.renderers.values()) {
        if (renderer.canRender(entities)) {
          this.renderAlgorithmEntities(renderer, entities);
        }
      }

      this.renderPipeline.endFrame();
      this.lastRenderedState = state;

    } catch (error) {
      console.error('[EnhancedStudioRenderManager] State render error:', error);
    }
  }

  /**
   * Get enhanced camera manager
   */
  getCameraManager(): IEnhancedCameraManager {
    return this.cameraManager;
  }

  /**
   * Get render pipeline
   */
  getRenderPipeline(): IRenderPipeline {
    return this.renderPipeline;
  }

  /**
   * Set effects manager
   */
  setEffectsManager(effectsManager: IEffectsManager): void {
    this.effectsManager = effectsManager;
    console.log('[EnhancedStudioRenderManager] Effects manager attached');
  }

  /**
   * Get effects manager
   */
  getEffectsManager(): IEffectsManager | null {
    return this.effectsManager;
  }

  /**
   * Create render target
   */
  createRenderTarget(name: string, width: number, height: number, format?: RenderTargetFormat): IRenderTarget {
    const renderTarget = new RenderTarget(width, height, format);
    this.renderTargets.set(name, renderTarget);

    console.log(`🎯 Render target created: ${name} (${width}x${height})`);
    return renderTarget;
  }

  /**
   * Get render target
   */
  getRenderTarget(name: string): IRenderTarget | undefined {
    return this.renderTargets.get(name);
  }

  /**
   * Set active render target
   */
  setActiveRenderTarget(name: string | null): void {
    const renderTarget = name ? this.renderTargets.get(name) : null;
    this.renderPipeline.setRenderTarget(renderTarget || null);
  }

  /**
   * Get rendering statistics
   */
  getStats() {
    return {
      pipeline: this.renderPipeline.getStats(),
      renderers: this.renderers.size,
      renderTargets: this.renderTargets.size,
      camera: {
        position: this.cameraManager.getPosition(),
        target: this.cameraManager.getTarget(),
        zoom: this.cameraManager.getZoom()
      }
    };
  }

  /**
   * Enable/disable rendering
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    console.log(`🎮 Rendering ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if rendering is enabled
   */
  isRenderingEnabled(): boolean {
    return this.isEnabled && this.initialized;
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    console.log('[EnhancedStudioRenderManager] Disposing enhanced render manager...');

    // Dispose all renderers
    for (const [algorithmName, renderer] of this.renderers) {
      try {
        renderer.dispose(); // Use dispose instead of cleanup
      } catch (error) {
        console.error(`Error disposing renderer ${algorithmName}:`, error);
      }
    }
    this.renderers.clear();

    // Dispose render targets
    for (const [name, renderTarget] of this.renderTargets) {
      try {
        renderTarget.dispose();
      } catch (error) {
        console.error(`Error disposing render target ${name}:`, error);
      }
    }
    this.renderTargets.clear();

    // Dispose effects manager
    if (this.effectsManager) {
      this.effectsManager.dispose();
      this.effectsManager = null;
    }

    // Dispose pipeline
    this.renderPipeline.dispose();

    this.initialized = false;
    console.log('[EnhancedStudioRenderManager] Enhanced render manager disposed');
  }

  /**
   * Setup camera integration with pipeline
   */
  private setupCameraIntegration(): void {
    this.cameraManager.onCameraChanged(() => {
      if (this.initialized) {
        this.syncCameraWithPipeline();
      }
    });
  }

  /**
   * Sync camera with pipeline
   */
  private syncCameraWithPipeline(): void {
    const activeCamera = this.cameraManager.getActiveCamera();
    this.renderPipeline.setCamera(activeCamera);
  }

  /**
   * Execute simulation renderers through the pipeline
   */
  private executeSimulationRenderers(context: IRenderContext): void {
    // This would integrate simulation renderers with the pipeline
    // For now, we'll use the traditional approach but within pipeline framework

    for (const [algorithmName, renderer] of this.renderers) {
      try {
        // Create enhanced context with pipeline information
        const enhancedContext = this.createEnhancedContext(context);

        if (renderer.render) {
          // Get entities from the last rendered state or empty array
          const entities = this.lastRenderedState ? Array.from(this.lastRenderedState.entities) : [];
          renderer.render(entities, enhancedContext); // Pass entities as first argument
        }

      } catch (error) {
        console.error(`Error rendering algorithm ${algorithmName}:`, error);
      }
    }
  }

  /**
   * Create enhanced render context
   */
  private createEnhancedContext(baseContext: IRenderContext): IRenderContext {
    const pipelineStats = this.renderPipeline.getStats();

    return {
      ...baseContext,
      time: performance.now(),
      deltaTime: pipelineStats.frameTime
    };
  }

  /**
   * Render entities for a specific algorithm
   */
  private renderAlgorithmEntities(renderer: ISimulationRenderer, entities: EntityId[]): void {
    try {
      // This would render specific entities through the pipeline
      // Implementation would depend on how entities are structured
      console.log(`🎨 Rendering ${entities.length} entities for ${renderer.algorithmName}`);

      // For now, just log - actual implementation would render entities

    } catch (error) {
      console.error(`Error rendering entities for ${renderer.algorithmName}:`, error);
    }
  }

  /**
   * Create default render targets
   */
  private createDefaultRenderTargets(): void {
    // Create main render target
    this.createRenderTarget('main', 1920, 1080, RenderTargetFormat.RGBA8);

    // Create shadow map render target
    this.createRenderTarget('shadowMap', 2048, 2048, RenderTargetFormat.DEPTH24);

    // Create post-processing render target
    this.createRenderTarget('postProcess', 1920, 1080, RenderTargetFormat.RGBA16F);
  }

  /**
   * Validate renderer before registration
   */
  private validateRenderer(renderer: ISimulationRenderer): void {
    if (!renderer.algorithmName) {
      throw new Error('Renderer must have algorithmName');
    }

    if (!renderer.rendererType) {
      throw new Error('Renderer must have rendererType');
    }

    if (this.renderers.has(renderer.algorithmName)) {
      console.warn(`⚠️ Replacing existing renderer for algorithm: ${renderer.algorithmName}`);
    }
  }
}

/**
 * Factory for creating enhanced studio render managers
 */
export class EnhancedStudioRenderManagerFactory {
  /**
   * Create standard enhanced render manager
   */
  static createStandard(): EnhancedStudioRenderManager {
    return new EnhancedStudioRenderManager();
  }

  /**
   * Create enhanced render manager with forward rendering
   */
  static createForwardRendering(): EnhancedStudioRenderManager {
    const pipeline = RenderPipelineFactory.createForwardRenderingPipeline();
    return new EnhancedStudioRenderManager(pipeline);
  }

  /**
   * Create enhanced render manager with deferred rendering
   */
  static createDeferredRendering(): EnhancedStudioRenderManager {
    const pipeline = RenderPipelineFactory.createDeferredRenderingPipeline();
    return new EnhancedStudioRenderManager(pipeline);
  }

  /**
   * Create custom enhanced render manager
   */
  static createCustom(
    pipeline: IRenderPipeline,
    cameraManager?: IEnhancedCameraManager
  ): EnhancedStudioRenderManager {
    return new EnhancedStudioRenderManager(pipeline, cameraManager);
  }
}
