import { VisibilityManager } from "../ui/VisibilityManager";
import { RenderSystemAdapter } from "../rendering/RenderSystemAdapter";
import { Logger } from "../../core/utils/Logger";

/**
 * Centralized visibility orchestrator that manages ALL visibility in the application
 * This includes UI panels, 3D scene rendering, and state coordination
 */
export class VisibilityOrchestrator {
  private visibilityManager: VisibilityManager;
  private renderSystem: RenderSystemAdapter;
  private initialized = false;

  constructor(visibilityManager: VisibilityManager, renderSystem: RenderSystemAdapter) {
    this.visibilityManager = visibilityManager;
    this.renderSystem = renderSystem;
  }

  /**
   * Initialize the visibility orchestrator
   */
  public initialize(): void {
    if (this.initialized) return;

    // Initialize UI visibility
    this.visibilityManager.initializeCoreUI();

    // Set up event coordination between UI and 3D rendering
    this.setupEventCoordination();

    this.initialized = true;
  }

  /**
   * Show all panels and enable all rendering
   */
  public showAll(): void {
    this.visibilityManager.showAllGlobalPanels();
    this.visibilityManager.showAllPluginPanels();
  // Adapter-backed system ticks with studio.update -> orchestrator; no explicit render needed here
  }

  /**
   * Hide all panels but keep core rendering active
   */
  public hideAllPanels(): void {
    Logger.getInstance().log("[VisibilityOrchestrator] Hiding all panels");
    this.visibilityManager.hideAllGlobalPanels();
    this.visibilityManager.hideAllPluginPanels();
  // Keep rendering active for 3D scene via adapter path
  }

  /**
   * Clear all 3D content but keep UI panels
   */
  public clearScene(): void {
    Logger.getInstance().log("[VisibilityOrchestrator] Clearing 3D scene");
    // Clear all renderers to effectively clear the scene
    this.renderSystem.dispose();
  }

  /**
   * Complete reset - clear everything and start fresh
   */
  public reset(): void {
    Logger.getInstance().log("[VisibilityOrchestrator] Complete reset");
    this.clearScene();
    this.hideAllPanels();
    this.showAll();
  }

  /**
   * Show specific panel by ID
   */
  public showPanel(panelId: string): void {
    this.visibilityManager.showPanel(panelId);
    // Note: SimplifiedRenderSystem renders automatically when needed
  }

  /**
   * Hide specific panel by ID
   */
  public hidePanel(panelId: string): void {
    this.visibilityManager.hidePanel(panelId);
  }

  /**
   * Toggle specific panel visibility
   */
  public togglePanel(panelId: string): void {
    this.visibilityManager.togglePanel(panelId);
    // Note: SimplifiedRenderSystem renders automatically when needed
  }

  /**
   * Get current visibility state for debugging
   */
  public getVisibilityState(): VisibilityState {
    const panelStates = this.visibilityManager.getAllPanelStates();
  const sceneDebugInfo: any = this.renderSystem.getDebugInfo();

    // Convert panel states to array format
    const panelEntries = Object.entries(panelStates);
    const globalPanels = this.visibilityManager.getPanelsByType('global');
    const pluginPanels = this.visibilityManager.getPanelsByType('plugin');

    return {
      ui: {
        panelCount: panelEntries.length,
        visiblePanels: panelEntries.filter(([_, visible]) => visible).length,
        globalPanels: globalPanels.size,
        pluginPanels: pluginPanels.size,
        panels: panelEntries.map(([id, visible]) => {
          const type = globalPanels.has(id) ? 'global' as const : 'plugin' as const;
          return { id, visible, type };
        })
      },
      scene: {
        rendererCount: sceneDebugInfo.rendererCount || 0,
  lastRenderTime: sceneDebugInfo?.lastRenderTime ?? 0,
  renderingEnabled: true // Adapter is always ready to render
      },
      initialized: this.initialized
    };
  }

  /**
   * Log current state for debugging
   */
  public logState(): void {
    const state = this.getVisibilityState();
    Logger.getInstance().log("[VisibilityOrchestrator] Current state:", state);
  }

  /**
   * Check if the system is properly initialized
   */
  public isHealthy(): boolean {
    const state = this.getVisibilityState();

    // System is healthy if:
    // 1. It's initialized
    // 2. Has some panels registered
    // 3. Scene is accessible
    return state.initialized &&
           state.ui.panelCount > 0 &&
           state.scene !== null;
  }

  /**
   * Get the visibility manager for direct access
   */
  public getVisibilityManager(): VisibilityManager {
    return this.visibilityManager;
  }

  /**
   * Get the render system for direct access
   */
  public getRenderSystem(): RenderSystemAdapter {
    return this.renderSystem;
  }

  /**
   * Set up event coordination between UI and rendering
   */
  private setupEventCoordination(): void {
    // When panels are shown/hidden, mark renderers as dirty for next update
    this.visibilityManager.on('visibilityChanged', ({ panelId, visible }) => {
      Logger.getInstance().log(`[VisibilityOrchestrator] Panel ${panelId} visibility changed to ${visible}`);
      // Mark all renderers as dirty to ensure they re-render on next update
  // Mark all known renderers as dirty if inner system supports it
  const inner: any = (this.renderSystem as any).inner;
  if (inner?.markAllDirty) inner.markAllDirty();
    });

    // Additional coordination can be added here as needed
  }

  /**
   * Dispose the orchestrator and clean up all resources
   */
  public dispose(): void {
    Logger.getInstance().log("[VisibilityOrchestrator] Disposing...");

    this.renderSystem.dispose();
    this.visibilityManager.destroy();
    this.initialized = false;

    Logger.getInstance().log("[VisibilityOrchestrator] Disposed");
  }
}

/**
 * Complete visibility state of the application
 */
export interface VisibilityState {
  ui: {
    panelCount: number;
    visiblePanels: number;
    globalPanels: number;
    pluginPanels: number;
    panels: Array<{
      id: string;
      visible: boolean;
      type: 'global' | 'plugin';
    }>;
  };
  scene: {
    rendererCount: number;
    lastRenderTime: number;
    renderingEnabled: boolean;
  };
  initialized: boolean;
}
