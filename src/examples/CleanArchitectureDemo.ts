/**
 * Clean Architecture Integration Example
 *
 * This demonstrates how to integrate the new clean architecture
 * with the existing system, following the comprehensive design.
 */

import { SimulationManager } from '../studio/simulation/SimulationManager';
import { SimulationRenderManager } from '../studio/rendering/SimulationRenderManager';
import { ParameterManager } from '../studio/parameters/ParameterManager';
import { SimplePhysicsPlugin } from '../plugins/simple-physics/SimplePhysicsPlugin';
import {
  IPluginContext,
  ILogger,
  IEventBus,
  ICameraManager,
  IGraphManager,
  IUIManager
} from '../core/simulation/interfaces';

/**
 * Simple Logger Implementation
 */
class SimpleLogger implements ILogger {
  log(message: string, ...args: any[]): void {
    console.log(`[LOG] ${message}`, ...args);
  }

  warn(message: string, ...args: any[]): void {
    console.warn(`[WARN] ${message}`, ...args);
  }

  error(message: string, ...args: any[]): void {
    console.error(`[ERROR] ${message}`, ...args);
  }
}

/**
 * Simple Event Bus Implementation
 */
class SimpleEventBus implements IEventBus {
  private listeners = new Map<string, ((data?: any) => void)[]>();

  emit(event: string, data?: any): void {
    const handlers = this.listeners.get(event) || [];
    for (const handler of handlers) {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    }
  }

  on(event: string, handler: (data?: any) => void): void {
    const handlers = this.listeners.get(event) || [];
    handlers.push(handler);
    this.listeners.set(event, handlers);
  }

  off(event: string, handler: (data?: any) => void): void {
    const handlers = this.listeners.get(event) || [];
    const index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);
    }
  }
}

/**
 * Placeholder managers for complete context
 */
class PlaceholderCameraManager implements ICameraManager {
  setPosition(position: { x: number; y: number; z: number }): void {
    console.log('Camera position set:', position);
  }

  setTarget(target: { x: number; y: number; z: number }): void {
    console.log('Camera target set:', target);
  }

  setFOV(fov: number): void {
    console.log('Camera FOV set:', fov);
  }

  getCamera(): any {
    return null; // Placeholder
  }
}

class PlaceholderGraphManager implements IGraphManager {
  registerGraph(algorithmName: string, config: any): void {
    console.log(`Graph registered: ${config.title} for ${algorithmName}`);
  }

  unregisterGraphs(algorithmName: string): void {
    console.log(`Graphs unregistered for: ${algorithmName}`);
  }

  updateGraph(graphId: string, data: any[]): void {
    // Placeholder
  }

  clearGraphs(): void {
    console.log('All graphs cleared');
  }
}

class PlaceholderUIManager implements IUIManager {
  registerUI(ui: any): void {
    console.log(`UI registered: ${ui.title}`);
  }

  unregisterUI(ui: any): void {
    console.log(`UI unregistered: ${ui.title}`);
  }

  updateUI(algorithmName: string, values: Record<string, any>): void {
    console.log(`UI updated for ${algorithmName}:`, values);
  }
}

/**
 * Clean Architecture Demo
 */
export class CleanArchitectureDemo {
  private simulationManager: SimulationManager;
  private renderManager: SimulationRenderManager;
  private parameterManager: ParameterManager;
  private logger: ILogger;
  private eventBus: IEventBus;
  private pluginContext: IPluginContext;

  constructor() {
    // Initialize core managers
    this.logger = new SimpleLogger();
    this.eventBus = new SimpleEventBus();
    this.simulationManager = new SimulationManager();
    this.renderManager = new SimulationRenderManager();
    this.parameterManager = new ParameterManager();

    // Create plugin context
    this.pluginContext = {
      world: null as any, // Would be real ECS world
      simulationManager: this.simulationManager,
      renderManager: this.renderManager,
      parameterManager: this.parameterManager,
      cameraManager: new PlaceholderCameraManager(),
      graphManager: new PlaceholderGraphManager(),
      uiManager: new PlaceholderUIManager(),
      globalStore: null as any, // Would be real global store
      logger: this.logger,
      eventBus: this.eventBus
    };

    this.setupSystemIntegration();
  }

  /**
   * Initialize the demo with clean architecture
   */
  async initialize(): Promise<void> {
    this.logger.log('🚀 Initializing Clean Architecture Demo');

    // Register sample plugin
    await this.registerSimplePhysicsPlugin();

    // Set up some sample entities
    this.simulationManager.setEntities([1, 2, 3]);

    // Connect state changes to rendering
    this.simulationManager.addStateChangeListener((state) => {
      this.renderManager.onStateChanged(state);
    });

    this.logger.log('✅ Clean Architecture Demo initialized');
  }

  /**
   * Register the simple physics plugin
   */
  private async registerSimplePhysicsPlugin(): Promise<void> {
    const plugin = new SimplePhysicsPlugin();

    try {
      plugin.register(this.pluginContext);

      // Test parameter changes
      this.parameterManager.setParameter('simple-physics', 'gravity', -12.0);
      this.parameterManager.setParameter('simple-physics', 'damping', 0.95);

      this.logger.log('✅ Simple Physics Plugin registered successfully');
    } catch (error) {
      this.logger.error('❌ Failed to register Simple Physics Plugin:', error);
    }
  }

  /**
   * Start the simulation loop
   */
  startSimulation(): void {
    this.logger.log('▶️ Starting simulation');
    this.simulationManager.play();

    // Start animation loop
    this.startAnimationLoop();
  }

  /**
   * Stop the simulation
   */
  stopSimulation(): void {
    this.logger.log('⏸️ Stopping simulation');
    this.simulationManager.pause();
  }

  /**
   * Reset the simulation
   */
  resetSimulation(): void {
    this.logger.log('🔄 Resetting simulation');
    this.simulationManager.reset();
  }

  /**
   * Get system statistics
   */
  getStats(): {
    simulation: any;
    parameters: any;
    rendering: any;
  } {
    return {
      simulation: this.simulationManager.getDebugInfo(),
      parameters: this.parameterManager.getStats(),
      rendering: this.renderManager.getStats()
    };
  }

  // Private implementation methods

  private setupSystemIntegration(): void {
    // Set up event listeners for system coordination
    this.eventBus.on('parameter-changed', (data) => {
      const { algorithmName, paramName, value } = data;
      this.simulationManager.configureAlgorithm(algorithmName, { [paramName]: value });
    });

    this.eventBus.on('simulation-reset', () => {
      this.renderManager.clearAll();
    });
  }

  private startAnimationLoop(): void {
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
      lastTime = currentTime;

      // Fixed timestep simulation
      this.simulationManager.step(deltaTime);

      // Continue loop
      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }
}

/**
 * Usage Example
 */
export function runCleanArchitectureExample(): void {
  const demo = new CleanArchitectureDemo();

  void demo.initialize().then(() => {
    // Start simulation after initialization
    demo.startSimulation();

    // Log stats periodically
    setInterval(() => {
      const stats = demo.getStats();
      console.log('📊 System Stats:', stats);
    }, 5000);

    // Expose demo globally for debugging
    (window as any).cleanArchitectureDemo = demo;
  });
}

// Auto-run if this file is imported
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runCleanArchitectureExample);
  } else {
    runCleanArchitectureExample();
  }
}
