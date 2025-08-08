/**
 * Unified Simulation Framework - Phase 5
 *
 * Central orchestration class that provides a clean, reusable API
 * for setting up and managing physics simulations with advanced features.
 */

import { TimeSteppingEngine, ITimeSteppingEngine } from './TimeSteppingEngine';
import { SimulationManager } from '../../studio/simulation/SimulationManager';
import { SimulationState } from './SimulationState';
import { ISimulationAlgorithm } from './interfaces';
import { SimulationProfiler } from './SimulationProfiler';
import { StateInspector } from './StateInspector';
import { WorkerManager } from './WorkerManager';
import { DebugConsole } from './DebugConsole';

export interface ISimulationFrameworkConfig {
  targetFPS?: number;
  enableMultiThreading?: boolean;
  enableDebugging?: boolean;
  enableProfiling?: boolean;
  maxWorkers?: number;
  debugLevel?: 'minimal' | 'normal' | 'verbose';
}

export interface ISimulationFrameworkState {
  isRunning: boolean;
  isPaused: boolean;
  currentTime: number;
  frameCount: number;
  algorithmCount: number;
  entityCount: number;
  performance: {
    averageFPS: number;
    frameTime: number;
    cpuUsage: number;
  };
}

/**
 * Unified Simulation Framework
 *
 * Provides a high-level API for creating and managing physics simulations
 * with built-in performance monitoring, debugging, and multi-threading support.
 */
export class SimulationFramework {
  private readonly config: Required<ISimulationFrameworkConfig>;
  private readonly timeEngine: ITimeSteppingEngine;
  private readonly simulationManager: SimulationManager;
  private readonly profiler: SimulationProfiler;
  private readonly stateInspector: StateInspector;
  private readonly workerManager: WorkerManager;
  private readonly debugConsole: DebugConsole;

  private lastFrameTime = 0;
  private frameCount = 0;
  private isInitialized = false;

  constructor(config: ISimulationFrameworkConfig = {}) {
    // Set default configuration
    this.config = {
      targetFPS: config.targetFPS ?? 60,
      enableMultiThreading: config.enableMultiThreading ?? false,
      enableDebugging: config.enableDebugging ?? false,
      enableProfiling: config.enableProfiling ?? true,
      maxWorkers: config.maxWorkers ?? 2,
      debugLevel: config.debugLevel ?? 'normal'
    };

    // Initialize core components
    this.timeEngine = new TimeSteppingEngine(1 / this.config.targetFPS);
    this.simulationManager = new SimulationManager();

    // Initialize advanced components if enabled
    this.profiler = new SimulationProfiler();
    this.stateInspector = new StateInspector();
    this.debugConsole = new DebugConsole({
      maxLogEntries: this.config.debugLevel === 'verbose' ? 2000 : 1000,
      enableCommandHistory: this.config.debugLevel !== 'minimal'
    });

    // Initialize multi-threading if enabled
    this.workerManager = new WorkerManager({
      maxWorkers: this.config.maxWorkers
    });

    console.log(`[SimulationFramework] Initialized with config:`, {
      targetFPS: this.config.targetFPS,
      multiThreading: this.config.enableMultiThreading,
      debugging: this.config.enableDebugging,
      profiling: this.config.enableProfiling
    });
  }

  /**
   * Initialize the simulation framework
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('[SimulationFramework] Already initialized');
      return;
    }

    try {
      console.log('[SimulationFramework] Initializing framework...');

      // Initialize multi-threading if enabled
      if (this.config.enableMultiThreading) {
        await this.workerManager.initialize();
        console.log('[SimulationFramework] Multi-threading enabled');
      }

      // Initialize profiling if enabled
      if (this.config.enableProfiling) {
        this.profiler.start();
        console.log('[SimulationFramework] Performance profiling enabled');
      }

      // Initialize debugging if enabled
      if (this.config.enableDebugging) {
        this.debugConsole.log('info', 'Framework', 'Debug console enabled and attached to simulation');
        console.log('[SimulationFramework] Debug console enabled');
      }

      this.isInitialized = true;
      console.log('[SimulationFramework] Framework initialized successfully');

    } catch (error) {
      const initError = new Error(`Failed to initialize simulation framework: ${error instanceof Error ? error.message : String(error)}`);
      console.error('[SimulationFramework] Initialization failed:', initError);
      throw initError;
    }
  }

  /**
   * Register a simulation algorithm
   */
  registerAlgorithm(algorithm: ISimulationAlgorithm): void {
    this.simulationManager.registerAlgorithm(algorithm);

    if (this.config.enableDebugging) {
      this.debugConsole.log('info', 'Framework', `Algorithm registered: ${algorithm.name}`);
    }
  }

  /**
   * Set simulation entities
   */
  setEntities(entities: any[]): void {
    this.simulationManager.setEntities(entities);

    if (this.config.enableDebugging) {
      this.debugConsole.log('info', 'Framework', `Entities set: ${entities.length} entities`);
    }
  }

  /**
   * Start the simulation
   */
  play(): void {
    this.simulationManager.play();

    if (this.config.enableProfiling) {
      this.profiler.markEvent('simulation_started');
    }

    console.log('[SimulationFramework] Simulation started');
  }

  /**
   * Pause the simulation
   */
  pause(): void {
    this.simulationManager.pause();

    if (this.config.enableProfiling) {
      this.profiler.markEvent('simulation_paused');
    }

    console.log('[SimulationFramework] Simulation paused');
  }

  /**
   * Reset the simulation
   */
  reset(): void {
    this.simulationManager.reset();
    this.timeEngine.reset();
    this.frameCount = 0;

    if (this.config.enableProfiling) {
      this.profiler.markEvent('simulation_reset');
    }

    console.log('[SimulationFramework] Simulation reset');
  }

  /**
   * Step the simulation forward
   */
  step(deltaTime: number): void {
    const startTime = performance.now();

    // Update frame timing
    this.frameCount++;
    this.lastFrameTime = deltaTime;

    // Execute simulation step
    this.simulationManager.step(deltaTime);

    // Profile performance if enabled
    if (this.config.enableProfiling) {
      const frameTime = performance.now() - startTime;
      this.profiler.recordFrame(frameTime, deltaTime);
    }

    // Update state inspector if enabled
    if (this.config.enableDebugging) {
      this.stateInspector.update(this.simulationManager.getCurrentState());
    }
  }

  /**
   * Get current framework state
   */
  getState(): ISimulationFrameworkState {
    const simulationState = this.simulationManager.getCurrentState();
    const debugInfo = this.simulationManager.getDebugInfo();
    const performance = this.config.enableProfiling ? this.profiler.getMetrics() : {
      averageFPS: 60,
      frameTime: 16.67,
      cpuUsage: 0
    };

    return {
      isRunning: debugInfo.isPlaying,
      isPaused: !debugInfo.isPlaying,
      currentTime: debugInfo.currentTime,
      frameCount: this.frameCount,
      algorithmCount: debugInfo.algorithmsCount,
      entityCount: debugInfo.entityCount,
      performance: {
        averageFPS: performance.averageFPS,
        frameTime: performance.frameTime,
        cpuUsage: performance.cpuUsage
      }
    };
  }

  /**
   * Get simulation profiler (if enabled)
   */
  getProfiler(): SimulationProfiler | null {
    return this.config.enableProfiling ? this.profiler : null;
  }

  /**
   * Get state inspector (if enabled)
   */
  getStateInspector(): StateInspector | null {
    return this.config.enableDebugging ? this.stateInspector : null;
  }

  /**
   * Get debug console (if enabled)
   */
  getDebugConsole(): DebugConsole | null {
    return this.config.enableDebugging ? this.debugConsole : null;
  }

  /**
   * Dispose of the framework and cleanup resources
   */
  async dispose(): Promise<void> {
    console.log('[SimulationFramework] Disposing framework...');

    // Stop simulation
    this.pause();

    // Dispose components
    if (this.config.enableProfiling) {
      this.profiler.stop();
    }

    if (this.config.enableDebugging) {
      this.debugConsole.log('info', 'Framework', 'Debug console detaching from simulation');
    }

    if (this.config.enableMultiThreading) {
      this.workerManager.terminate();
    }

    this.isInitialized = false;
    console.log('[SimulationFramework] Framework disposed');
  }
}
