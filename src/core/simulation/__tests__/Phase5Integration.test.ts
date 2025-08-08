/**
 * Phase 5 Unified Simulation Framework Integration Tests
 *
 * Tests the integration and basic functionality of all Phase 5 components:
 * - SimulationFramework
 * - SimulationProfiler
 * - StateInspector
 * - WorkerManager
 * - DebugConsole
 */

import { SimulationFramework } from '../SimulationFramework';
import { SimulationProfiler } from '../SimulationProfiler';
import { StateInspector } from '../StateInspector';
import { WorkerManager } from '../WorkerManager';
import { DebugConsole } from '../DebugConsole';
import { SimulationState } from '../SimulationState';

describe('Phase 5 Unified Simulation Framework Integration', () => {
  describe('SimulationFramework', () => {
    let framework: SimulationFramework;

    beforeEach(() => {
      framework = new SimulationFramework({
        targetFPS: 60,
        enableMultiThreading: false, // Disable for testing
        enableDebugging: true,
        enableProfiling: true
      });
    });

    afterEach(async () => {
      if (framework) {
        await framework.dispose();
      }
    });

    it('should initialize successfully with default config', () => {
      expect(framework).toBeDefined();
    });

    it('should initialize and configure all subsystems', async () => {
      await framework.initialize();

      const state = framework.getState();
      expect(state).toBeDefined();
      expect(state.isRunning).toBe(false);
      expect(state.frameCount).toBe(0);
    });

    it('should provide profiling capabilities when enabled', async () => {
      await framework.initialize();

      const profiler = framework.getProfiler();
      expect(profiler).toBeDefined();

      if (profiler) {
        const report = profiler.generateReport();
        expect(report).toContain('Performance Report');
      }
    });

    it('should provide state inspection capabilities', async () => {
      await framework.initialize();

      const inspector = framework.getStateInspector();
      expect(inspector).toBeDefined();

      if (inspector) {
        const report = inspector.generateReport();
        expect(report).toContain('State Inspector Report');
      }
    });

    it('should provide debug console capabilities', async () => {
      await framework.initialize();

      const debugConsole = framework.getDebugConsole();
      expect(debugConsole).toBeDefined();

      const result = await debugConsole!.executeCommand('help');
      expect(result).toContain('Available commands');
    });
  });

  describe('SimulationProfiler', () => {
    let profiler: SimulationProfiler;

    beforeEach(() => {
      profiler = new SimulationProfiler();
    });

    afterEach(() => {
      profiler.stop();
    });

    it('should start and stop profiling', () => {
      profiler.start();
      profiler.stop();
      // Just verify it doesn't throw
      expect(profiler).toBeDefined();
    });

    it('should track frame timing', () => {
      profiler.start();

      // Record a frame with timing data
      profiler.recordFrame(16.67, 0.01667); // 60 FPS frame

      const report = profiler.generateReport();
      expect(report).toContain('Frame Time');
    });

    it('should generate performance reports', () => {
      profiler.start();
      profiler.recordFrame(16.67, 0.01667);

      const report = profiler.generateReport();
      expect(report).toContain('Performance Report');
      expect(report).toContain('Frame Time');
      expect(report).toContain('FPS');
    });
  });

  describe('StateInspector', () => {
    let inspector: StateInspector;
    let testState: SimulationState;

    beforeEach(() => {
      inspector = new StateInspector();
      testState = new SimulationState(
        new Set([1, 2, 3]),
        0,
        1/60,
        false,
        new Map([['test', 'value']])
      );
    });

    it('should track state changes', () => {
      inspector.start();
      inspector.update(testState);

      const summary = inspector.getCurrentStateSummary();
      expect(summary).toBeDefined();
      expect(summary!.entityCount).toBe(3);
      expect(summary!.time).toBe(0);
    });

    it('should create state snapshots', () => {
      inspector.start();
      inspector.update(testState);

      // Force a snapshot
      const newState = new SimulationState(
        new Set([1, 2, 3, 4]),
        1/60,
        1/60,
        true,
        new Map([['test', 'value2']])
      );
      inspector.update(newState);

      const snapshots = inspector.getSnapshots();
      expect(snapshots.length).toBeGreaterThan(0);
    });

    it('should generate inspection reports', () => {
      inspector.start();
      inspector.update(testState);

      const report = inspector.generateReport();
      expect(report).toContain('State Inspector Report');
      expect(report).toContain('Entity Count: 3');
    });
  });

  describe('WorkerManager', () => {
    let workerManager: WorkerManager;

    beforeEach(() => {
      // Initialize with fallback enabled since Web Workers might not be available in test environment
      workerManager = new WorkerManager({
        maxWorkers: 2,
        enableFallback: true
      });
    });

    afterEach(() => {
      workerManager.terminate();
    });

    it('should initialize successfully', async () => {
      await workerManager.initialize();

      const status = workerManager.getStatus();
      expect(status).toBeDefined();
      expect(status.workersTotal).toBeGreaterThanOrEqual(0);
    });

    it('should execute tasks in fallback mode', async () => {
      await workerManager.initialize();

      const result = await workerManager.executeTask({
        type: 'physics-step',
        data: { entities: [1, 2, 3] }
      });

      expect(result.success).toBe(true);
      expect(result.executionTime).toBeGreaterThan(0);
      expect(result.data).toBeDefined();
    });

    it('should provide worker pool status', async () => {
      await workerManager.initialize();

      const status = workerManager.getStatus();
      expect(status.workersTotal).toBeGreaterThanOrEqual(0);
      expect(status.workersAvailable).toBeGreaterThanOrEqual(0);
      expect(status.tasksQueued).toBe(0);
      expect(status.tasksPending).toBe(0);
    });
  });

  describe('DebugConsole', () => {
    let debugConsole: DebugConsole;
    let testState: SimulationState;

    beforeEach(() => {
      debugConsole = new DebugConsole();
      testState = new SimulationState(
        new Set([1, 2, 3]),
        0,
        1/60,
        false,
        new Map([['test', 'value']])
      );
    });

    it('should execute built-in commands', async () => {
      const helpResult = await debugConsole.executeCommand('help');
      expect(helpResult).toContain('Available commands');

      const clearResult = await debugConsole.executeCommand('clear logs');
      expect(clearResult).toContain('Logs cleared');
    });

    it('should show state information', async () => {
      debugConsole.updateContext(testState);

      const stateResult = await debugConsole.executeCommand('state');
      expect(stateResult).toContain('State Summary');
      expect(stateResult).toContain('Entities: 3');
    });

    it('should track command history', async () => {
      await debugConsole.executeCommand('help');
      await debugConsole.executeCommand('state');

      const history = debugConsole.getCommandHistory();
      expect(history).toContain('help');
      expect(history).toContain('state');
    });

    it('should log messages with different levels', () => {
      // Clear any existing logs first
      debugConsole.clearLogs();

      debugConsole.log('info', 'Test', 'Info message');
      debugConsole.log('warn', 'Test', 'Warning message');
      debugConsole.log('error', 'Test', 'Error message');

      const logs = debugConsole.getLogs();
      expect(logs.length).toBe(4); // 3 test messages + 1 clear log message
      expect(logs.some(log => log.level === 'info')).toBe(true);
      expect(logs.some(log => log.level === 'warn')).toBe(true);
      expect(logs.some(log => log.level === 'error')).toBe(true);
    });

    it('should generate debug reports', () => {
      debugConsole.log('info', 'Test', 'Test message');

      const report = debugConsole.generateReport();
      expect(report).toContain('Debug Console Report');
      expect(report).toContain('Total Log Entries');
    });
  });

  describe('Framework Integration', () => {
    let framework: SimulationFramework;

    beforeEach(() => {
      framework = new SimulationFramework({
        enableProfiling: true,
        enableDebugging: true,
        enableMultiThreading: false
      });
    });

    afterEach(async () => {
      if (framework) {
        await framework.dispose();
      }
    });

    it('should coordinate all subsystems together', async () => {
      await framework.initialize();

      // Get all components
      const profiler = framework.getProfiler();
      const inspector = framework.getStateInspector();
      const debugConsole = framework.getDebugConsole();

      // Start profiling
      if (profiler) profiler.start();
      if (inspector) inspector.start();

      // Create test state
      const testState = new SimulationState(
        new Set([1, 2, 3]),
        0,
        1/60,
        true,
        new Map([['phase', '5']])
      );

      // Update components
      if (inspector) inspector.update(testState);
      if (debugConsole) debugConsole.updateContext(testState);

      // Record some activity
      if (profiler) profiler.recordFrame(16.67, 0.01667);

      // Verify all components are working
      const profilerReport = profiler?.generateReport();
      const inspectorReport = inspector?.generateReport();
      const debugReport = debugConsole?.generateReport();

      if (profilerReport) expect(profilerReport).toContain('Performance Report');
      if (inspectorReport) expect(inspectorReport).toContain('Entity Count: 3');
      if (debugReport) expect(debugReport).toContain('Debug Console Report');

      // Test debug console with state context
      if (debugConsole) {
        const stateResult = await debugConsole.executeCommand('state entities');
        expect(stateResult).toContain('1, 2, 3');
      }
    });
  });
});
