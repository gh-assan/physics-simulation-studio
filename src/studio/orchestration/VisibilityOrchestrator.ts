import { VisibilityManager } from "../ui/VisibilityManager";
import { RenderOrchestrator } from "../rendering/RenderOrchestrator";
import { Logger } from "../../core/utils/Logger";

/**
 * Centralized visibility orchestrator that manages ALL visibility in the application
 * This includes UI panels, 3D scene rendering, and state coordination
 */
export class VisibilityOrchestrator {
  private visibilityManager: VisibilityManager;
  private renderOrchestrator: RenderOrchestrator;
  private initialized = false;

  constructor(visibilityManager: VisibilityManager, renderOrchestrator: RenderOrchestrator) {
    this.visibilityManager = visibilityManager;
    this.renderOrchestrator = renderOrchestrator;
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
    this.renderOrchestrator.requestRender();
  }

  /**
   * Hide all panels but keep core rendering active
   */
  public hideAllPanels(): void {
    Logger.getInstance().log("[VisibilityOrchestrator] Hiding all panels");
    this.visibilityManager.hideAllGlobalPanels();
    this.visibilityManager.hideAllPluginPanels();
    // Keep rendering active for 3D scene
    this.renderOrchestrator.requestRender();
  }

  /**
   * Clear all 3D content but keep UI panels
   */
  public clearScene(): void {
    Logger.getInstance().log("[VisibilityOrchestrator] Clearing 3D scene");
    this.renderOrchestrator.clearScene();
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
    this.renderOrchestrator.requestRender();
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
    this.renderOrchestrator.requestRender();
  }

  /**
   * Get current visibility state for debugging
   */
  public getVisibilityState(): VisibilityState {
    const panelStates = this.visibilityManager.getAllPanelStates();
    const sceneState = this.renderOrchestrator.getSceneState();

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
        entityCount: sceneState.entities.size,
        meshCount: sceneState.meshes.size,
        renderRequests: sceneState.renderRequests.size
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
   * Get the render orchestrator for direct access
   */
  public getRenderOrchestrator(): RenderOrchestrator {
    return this.renderOrchestrator;
  }

  /**
   * Set up event coordination between UI and rendering
   */
  private setupEventCoordination(): void {
    // When panels are shown/hidden, request a render to ensure consistency
    this.visibilityManager.on('visibilityChanged', ({ panelId, visible }) => {
      Logger.getInstance().log(`[VisibilityOrchestrator] Panel ${panelId} visibility changed to ${visible}`);
      this.renderOrchestrator.requestRender();
    });

    // Additional coordination can be added here as needed
  }

  /**
   * Dispose the orchestrator and clean up all resources
   */
  public dispose(): void {
    Logger.getInstance().log("[VisibilityOrchestrator] Disposing...");
    
    this.renderOrchestrator.dispose();
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
    entityCount: number;
    meshCount: number;
    renderRequests: number;
  };
  initialized: boolean;
}
