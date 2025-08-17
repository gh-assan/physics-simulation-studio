import {
  ISimulationRenderer,
  IRenderManager,
  IRenderContext,
  EntityId,
  ISimulationState
} from '../../core/simulation/interfaces';

/**
 * State-Driven Render Manager
 *
 * This manager handles all visualization by reacting to state changes only.
 * No polling, no frame-based updates - pure reactive rendering.
 */
export class SimulationRenderManager implements IRenderManager {
  private renderers: Map<string, ISimulationRenderer> = new Map();
  private renderContext: IRenderContext | null = null;
  private lastRenderedState: ISimulationState | null = null;
  private isEnabled = true;

  constructor(renderContext?: IRenderContext) {
    this.renderContext = renderContext || null;
  }

  /**
   * Set the rendering context (scene, camera, etc.)
   */
  setRenderContext(context: IRenderContext): void {
    this.renderContext = context;
    console.log('🎨 Render context updated');
  }

  /**
   * Register a renderer for a specific algorithm
   */
  registerRenderer(renderer: ISimulationRenderer): void {
    this.validateRenderer(renderer);

    this.renderers.set(renderer.algorithmName, renderer);
    console.log(`✅ Renderer registered: ${renderer.algorithmName} (${renderer.rendererType})`);
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

    this.cleanupRenderer(renderer);
    this.renderers.delete(algorithmName);

    console.log(`🗑️ Renderer unregistered: ${algorithmName}`);
  }

  /**
   * Render current simulation state
   * Only renders if state actually changed
   */
  render(context?: IRenderContext): void {
    if (!this.isEnabled) {
      return;
    }

    const activeContext = context || this.renderContext;

    if (!activeContext) {
      console.warn('⚠️ No render context available');
      return;
    }

    // Only render active renderers
    const activeRenderers = this.getActiveRenderers();

    if (activeRenderers.length === 0) {
      return;
    }

    this.executeRendering(activeRenderers, activeContext);
  }

  /**
   * React to simulation state changes
   */
  onStateChanged(newState: ISimulationState): void {
    if (!this.hasStateChanged(newState)) {
      return;
    }

    this.lastRenderedState = newState;
    this.render();
  }

  /**
   * Update visual parameters only (no simulation impact)
   */
  updateVisualParameters(algorithmName: string, parameters: Record<string, any>): void {
    const renderer = this.renderers.get(algorithmName);

    if (!renderer) {
      console.warn(`⚠️ Renderer not found for visual update: ${algorithmName}`);
      return;
    }

    this.updateRendererVisuals(renderer, parameters);
    this.render(); // Re-render with new visuals
  }

  /**
   * Clear all rendered objects
   */
  clearAll(): void {
    for (const renderer of this.renderers.values()) {
      this.safelyClearRenderer(renderer);
    }

    console.log('🧹 All renderers cleared');
  }

  /**
   * Enable/disable rendering
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;

    if (!enabled) {
      this.clearAll();
    }

    console.log(`🎨 Rendering ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get rendering statistics
   */
  getStats(): {
    rendererCount: number;
    activeRenderers: number;
    isEnabled: boolean;
    hasContext: boolean;
  } {
    return {
      rendererCount: this.renderers.size,
      activeRenderers: this.getActiveRenderers().length,
      isEnabled: this.isEnabled,
      hasContext: this.renderContext !== null
    };
  }

  // Private methods - clean, single-responsibility implementations

  private validateRenderer(renderer: ISimulationRenderer): void {
    if (!renderer.algorithmName?.trim()) {
      throw new Error('Renderer must have a valid algorithm name');
    }

    if (!renderer.rendererType?.trim()) {
      throw new Error('Renderer must have a valid renderer type');
    }

    if (this.renderers.has(renderer.algorithmName)) {
      console.warn(`⚠️ Replacing existing renderer for: ${renderer.algorithmName}`);
      this.unregisterRenderer(renderer.algorithmName);
    }
  }

  private cleanupRenderer(renderer: ISimulationRenderer): void {
    try {
      renderer.clear();
      renderer.dispose();
    } catch (error) {
      console.error(`Error cleaning up renderer ${renderer.algorithmName}:`, error);
    }
  }

  private getActiveRenderers(): ISimulationRenderer[] {
    if (!this.lastRenderedState) {
      return [];
    }

    const entities = Array.from(this.lastRenderedState.entities);

    return Array.from(this.renderers.values()).filter(renderer =>
      this.canRendererHandle(renderer, entities)
    );
  }

  private canRendererHandle(renderer: ISimulationRenderer, entities: EntityId[]): boolean {
    try {
      return renderer.canRender(entities);
    } catch (error) {
      console.error(`Error checking renderer capability ${renderer.algorithmName}:`, error);
      return false;
    }
  }

  private executeRendering(renderers: ISimulationRenderer[], context: IRenderContext): void {
    if (!this.lastRenderedState) {
      return;
    }

    const entities = Array.from(this.lastRenderedState.entities);

    for (const renderer of renderers) {
      this.safelyRenderWithRenderer(renderer, entities, context);
    }
  }

  private safelyRenderWithRenderer(
    renderer: ISimulationRenderer,
    entities: EntityId[],
    context: IRenderContext
  ): void {
    try {
      renderer.render(entities, context);
    } catch (error) {
      console.error(`Error rendering with ${renderer.algorithmName}:`, error);
    }
  }

  private hasStateChanged(newState: ISimulationState): boolean {
    if (!this.lastRenderedState) {
      return true;
    }

    // Check if entities changed
    if (this.hasEntitiesChanged(newState)) {
      return true;
    }

    // Check if time changed (simulation step occurred)
    if (newState.time !== this.lastRenderedState.time) {
      return true;
    }

    // Check if metadata changed
    if (this.hasMetadataChanged(newState)) {
      return true;
    }

    return false;
  }

  private hasEntitiesChanged(newState: ISimulationState): boolean {
    const oldEntities = this.lastRenderedState?.entities;
    const newEntities = newState.entities;

    if (!oldEntities) return true;
    if (oldEntities.size !== newEntities.size) return true;

    for (const entityId of newEntities) {
      if (!oldEntities.has(entityId)) return true;
    }

    return false;
  }

  private hasMetadataChanged(newState: ISimulationState): boolean {
    const oldMetadata = this.lastRenderedState?.metadata;
    const newMetadata = newState.metadata;

    if (!oldMetadata) return true;
    if (oldMetadata.size !== newMetadata.size) return true;

    for (const [key, value] of newMetadata) {
      if (oldMetadata.get(key) !== value) return true;
    }

    return false;
  }

  private updateRendererVisuals(renderer: ISimulationRenderer, parameters: Record<string, any>): void {
    try {
      renderer.updateVisualParameters(parameters);
      console.log(`🎨 Visual parameters updated for ${renderer.algorithmName}`);
    } catch (error) {
      console.error(`Error updating visual parameters for ${renderer.algorithmName}:`, error);
    }
  }

  private safelyClearRenderer(renderer: ISimulationRenderer): void {
    try {
      renderer.clear();
    } catch (error) {
      console.error(`Error clearing renderer ${renderer.algorithmName}:`, error);
    }
  }
}
