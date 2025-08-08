/**
 * Worker Manager - Phase 5
 *
 * Web Worker pool management for multi-threading simulation support.
 * Handles worker lifecycle, task distribution, and result coordination.
 */

export interface IWorkerTask {
  id: string;
  type: string;
  data: any;
  priority?: number;
  timeout?: number;
}

export interface IWorkerResult {
  taskId: string;
  success: boolean;
  data?: any;
  error?: string;
  executionTime: number;
}

export interface IWorkerConfig {
  maxWorkers?: number;
  workerScript?: string;
  taskTimeout?: number;
  enableFallback?: boolean;
}

export interface IWorkerInfo {
  id: string;
  isAvailable: boolean;
  currentTask?: string;
  taskCount: number;
  averageExecutionTime: number;
  lastActivity: number;
}

/**
 * Web Worker Manager
 *
 * Provides multi-threading support through Web Worker pool management.
 * Automatically distributes tasks across available workers and handles fallbacks.
 */
export class WorkerManager {
  private readonly config: Required<IWorkerConfig>;
  private workers: Map<string, Worker> = new Map();
  private workerInfo: Map<string, IWorkerInfo> = new Map();
  private taskQueue: IWorkerTask[] = [];
  private pendingTasks: Map<string, IWorkerTask> = new Map();
  private taskCallbacks: Map<string, {
    resolve: (result: IWorkerResult) => void;
    reject: (error: Error) => void;
    timeout?: NodeJS.Timeout;
  }> = new Map();

  private isInitialized = false;
  private taskIdCounter = 0;

  constructor(config: IWorkerConfig = {}) {
    this.config = {
      maxWorkers: config.maxWorkers ?? Math.max(1, navigator.hardwareConcurrency - 1),
      workerScript: config.workerScript ?? '/src/core/simulation/SimulationWorker.js',
      taskTimeout: config.taskTimeout ?? 30000, // 30 seconds
      enableFallback: config.enableFallback ?? true
    };

    console.log('[WorkerManager] Manager initialized with config:', this.config);
  }

  /**
   * Initialize the worker pool
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('[WorkerManager] Already initialized');
      return;
    }

    try {
      // Check if Web Workers are supported
      if (typeof Worker === 'undefined') {
        if (this.config.enableFallback) {
          console.warn('[WorkerManager] Web Workers not supported, fallback enabled');
          this.isInitialized = true;
          return;
        } else {
          throw new Error('Web Workers not supported and fallback disabled');
        }
      }

      // Create worker pool
      const workerPromises: Promise<void>[] = [];
      for (let i = 0; i < this.config.maxWorkers; i++) {
        workerPromises.push(this.createWorker(`worker-${i}`));
      }

      await Promise.all(workerPromises);
      this.isInitialized = true;

      console.log(`[WorkerManager] Initialized with ${this.workers.size} workers`);
    } catch (error) {
      console.error('[WorkerManager] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Execute a task on a worker
   */
  async executeTask(task: Omit<IWorkerTask, 'id'>): Promise<IWorkerResult> {
    if (!this.isInitialized) {
      throw new Error('WorkerManager not initialized');
    }

    const fullTask: IWorkerTask = {
      ...task,
      id: this.generateTaskId(),
      priority: task.priority ?? 0
    };

    // If no workers available, use fallback if enabled
    if (this.workers.size === 0 && this.config.enableFallback) {
      return this.executeTaskFallback(fullTask);
    }

    return new Promise<IWorkerResult>((resolve, reject) => {
      // Set up timeout
      const timeout = setTimeout(() => {
        this.taskCallbacks.delete(fullTask.id);
        this.pendingTasks.delete(fullTask.id);
        reject(new Error(`Task ${fullTask.id} timed out`));
      }, fullTask.timeout ?? this.config.taskTimeout);

      // Store callback
      this.taskCallbacks.set(fullTask.id, {
        resolve,
        reject,
        timeout
      });

      // Add to queue or assign directly
      const availableWorker = this.getAvailableWorker();
      if (availableWorker) {
        this.assignTaskToWorker(fullTask, availableWorker);
      } else {
        this.addToQueue(fullTask);
      }
    });
  }

  /**
   * Execute multiple tasks in parallel
   */
  async executeTasks(tasks: Omit<IWorkerTask, 'id'>[]): Promise<IWorkerResult[]> {
    const taskPromises = tasks.map(task => this.executeTask(task));
    return Promise.all(taskPromises);
  }

  /**
   * Get worker pool status
   */
  getStatus(): {
    workersTotal: number;
    workersAvailable: number;
    tasksQueued: number;
    tasksPending: number;
    averageExecutionTime: number;
  } {
    const availableWorkers = Array.from(this.workerInfo.values())
      .filter(info => info.isAvailable).length;

    const totalExecutionTime = Array.from(this.workerInfo.values())
      .reduce((sum, info) => sum + info.averageExecutionTime, 0);

    const averageExecutionTime = this.workerInfo.size > 0
      ? totalExecutionTime / this.workerInfo.size
      : 0;

    return {
      workersTotal: this.workers.size,
      workersAvailable: availableWorkers,
      tasksQueued: this.taskQueue.length,
      tasksPending: this.pendingTasks.size,
      averageExecutionTime
    };
  }

  /**
   * Get detailed worker information
   */
  getWorkerInfo(): readonly IWorkerInfo[] {
    return Array.from(this.workerInfo.values());
  }

  /**
   * Terminate all workers and clean up
   */
  terminate(): void {
    // Clear timeouts
    for (const callback of this.taskCallbacks.values()) {
      if (callback.timeout) {
        clearTimeout(callback.timeout);
      }
    }

    // Terminate workers
    for (const worker of this.workers.values()) {
      worker.terminate();
    }

    // Clear all state
    this.workers.clear();
    this.workerInfo.clear();
    this.taskQueue = [];
    this.pendingTasks.clear();
    this.taskCallbacks.clear();
    this.isInitialized = false;

    console.log('[WorkerManager] All workers terminated');
  }

  /**
   * Create a new worker
   */
  private async createWorker(workerId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const worker = new Worker(this.config.workerScript);

        worker.onmessage = (event) => {
          this.handleWorkerMessage(workerId, event.data);
        };

        worker.onerror = (error) => {
          console.error(`[WorkerManager] Worker ${workerId} error:`, error);
          this.handleWorkerError(workerId, error);
        };

        worker.onmessageerror = (error) => {
          console.error(`[WorkerManager] Worker ${workerId} message error:`, error);
          this.handleWorkerError(workerId, error);
        };

        this.workers.set(workerId, worker);
        this.workerInfo.set(workerId, {
          id: workerId,
          isAvailable: true,
          taskCount: 0,
          averageExecutionTime: 0,
          lastActivity: performance.now()
        });

        // Test worker with ping
        this.sendToWorker(workerId, {
          type: 'ping',
          id: 'init-ping'
        }).then(() => {
          resolve();
        }).catch(reject);

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Handle worker message
   */
  private handleWorkerMessage(workerId: string, message: any): void {
    const workerInfo = this.workerInfo.get(workerId);
    if (!workerInfo) return;

    // Update activity
    workerInfo.lastActivity = performance.now();

    if (message.type === 'pong') {
      // Ping response - worker is ready
      return;
    }

    if (message.type === 'task-result') {
      const { taskId, success, data, error, executionTime } = message;

      // Update worker info
      workerInfo.isAvailable = true;
      workerInfo.currentTask = undefined;
      workerInfo.taskCount++;

      // Update average execution time
      const alpha = 0.1; // Exponential moving average factor
      workerInfo.averageExecutionTime =
        workerInfo.averageExecutionTime * (1 - alpha) + executionTime * alpha;

      // Complete task
      const callback = this.taskCallbacks.get(taskId);
      if (callback) {
        if (callback.timeout) {
          clearTimeout(callback.timeout);
        }

        this.taskCallbacks.delete(taskId);
        this.pendingTasks.delete(taskId);

        const result: IWorkerResult = {
          taskId,
          success,
          data,
          error,
          executionTime
        };

        if (success) {
          callback.resolve(result);
        } else {
          callback.reject(new Error(error || 'Task failed'));
        }
      }

      // Process next task in queue
      this.processNextTask();
    }
  }

  /**
   * Handle worker error
   */
  private handleWorkerError(workerId: string, error: any): void {
    const workerInfo = this.workerInfo.get(workerId);
    if (workerInfo && workerInfo.currentTask) {
      const callback = this.taskCallbacks.get(workerInfo.currentTask);
      if (callback) {
        if (callback.timeout) {
          clearTimeout(callback.timeout);
        }

        this.taskCallbacks.delete(workerInfo.currentTask);
        this.pendingTasks.delete(workerInfo.currentTask);

        callback.reject(new Error(`Worker error: ${error.message || error}`));
      }

      workerInfo.isAvailable = true;
      workerInfo.currentTask = undefined;
    }
  }

  /**
   * Get an available worker
   */
  private getAvailableWorker(): string | null {
    for (const [workerId, info] of this.workerInfo) {
      if (info.isAvailable) {
        return workerId;
      }
    }
    return null;
  }

  /**
   * Assign task to worker
   */
  private assignTaskToWorker(task: IWorkerTask, workerId: string): void {
    const workerInfo = this.workerInfo.get(workerId);
    if (!workerInfo) return;

    workerInfo.isAvailable = false;
    workerInfo.currentTask = task.id;
    this.pendingTasks.set(task.id, task);

    void this.sendToWorker(workerId, {
      type: 'execute-task',
      taskId: task.id,
      taskType: task.type,
      taskData: task.data
    });
  }

  /**
   * Add task to queue
   */
  private addToQueue(task: IWorkerTask): void {
    // Insert task based on priority (higher priority first)
    let insertIndex = this.taskQueue.length;
    for (let i = 0; i < this.taskQueue.length; i++) {
      if ((task.priority ?? 0) > (this.taskQueue[i].priority ?? 0)) {
        insertIndex = i;
        break;
      }
    }

    this.taskQueue.splice(insertIndex, 0, task);
  }

  /**
   * Process next task in queue
   */
  private processNextTask(): void {
    if (this.taskQueue.length === 0) return;

    const availableWorker = this.getAvailableWorker();
    if (availableWorker) {
      const nextTask = this.taskQueue.shift()!;
      this.assignTaskToWorker(nextTask, availableWorker);
    }
  }

  /**
   * Send message to worker
   */
  private async sendToWorker(workerId: string, message: any): Promise<void> {
    const worker = this.workers.get(workerId);
    if (!worker) {
      throw new Error(`Worker ${workerId} not found`);
    }

    worker.postMessage(message);
  }

  /**
   * Execute task without workers (fallback)
   */
  private async executeTaskFallback(task: IWorkerTask): Promise<IWorkerResult> {
    console.warn(`[WorkerManager] Executing task ${task.id} in main thread (fallback)`);

    const startTime = performance.now();

    try {
      // Simple fallback execution
      // In a real implementation, this would call the actual task logic
      const data = await this.executeFallbackTask(task);

      const executionTime = performance.now() - startTime;

      return {
        taskId: task.id,
        success: true,
        data,
        executionTime
      };
    } catch (error) {
      const executionTime = performance.now() - startTime;

      return {
        taskId: task.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime
      };
    }
  }

  /**
   * Execute task in main thread (fallback implementation)
   */
  private async executeFallbackTask(task: IWorkerTask): Promise<any> {
    // This is a placeholder - in a real implementation, this would contain
    // the actual task execution logic for when workers are not available

    switch (task.type) {
      case 'physics-step':
        // Simulate physics calculation
        await this.delay(Math.random() * 10);
        return { step: 'completed', entities: task.data.entities };

      case 'rendering-prep':
        // Simulate rendering preparation
        await this.delay(Math.random() * 5);
        return { meshes: task.data.meshes, updated: true };

      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }

  /**
   * Generate unique task ID
   */
  private generateTaskId(): string {
    return `task-${++this.taskIdCounter}-${performance.now()}`;
  }

  /**
   * Delay utility for fallback simulation
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
