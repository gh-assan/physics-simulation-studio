/**
 * Cross-Component Compatibility Test Suite - Phase 7 Integration Testing
 *
 * Tests that validate the interaction and compatibility between different
 * components and systems across all phases of the project.
 */

import {
  IIntegrationTestSuite,
  IIntegrationTest,
  IIntegrationTestConfig,
  ITestResult,
  ITestContext
} from './IntegrationTestFramework';

/**
 * ECS Component Compatibility Tests
 *
 * Tests interactions between Entity-Component-System components
 */
const ecsCompatibilityTests: IIntegrationTest[] = [
  {
    config: {
      name: 'entity_component_lifecycle_test',
      description: 'Test entity creation, component attachment, and cleanup lifecycle',
      phases: ['Phase 1'],
      timeout: 5000,
      cleanup: true,
      enableProfiling: true
    },
    execute: async (context: ITestContext): Promise<ITestResult> => {
      const errors: string[] = [];
      const warnings: string[] = [];

      try {
        // Create multiple entities
        const entities: number[] = [];
        for (let i = 0; i < 5; i++) {
          const entity = context.entityManager.createEntity();
          entities.push(entity);
        }

        // Verify entities were created
        for (const entity of entities) {
          if (!context.entityManager.hasEntity(entity)) {
            errors.push(`Entity ${entity} not found after creation`);
          }
        }

        // Test entity enumeration
        const allEntities = context.entityManager.getAllEntities();
        if (allEntities.size < entities.length) {
          errors.push(`Expected at least ${entities.length} entities, found ${allEntities.size}`);
        }

        // Cleanup test - clear world
        context.world.clear(false);

        // Verify cleanup
        const entitiesAfterClear = context.entityManager.getAllEntities();
        if (entitiesAfterClear.size > 0) {
          warnings.push(`${entitiesAfterClear.size} entities remaining after clear`);
        }

        return {
          testName: 'entity_component_lifecycle_test',
          passed: errors.length === 0,
          duration: 0,
          errors,
          warnings,
          metadata: {
            entitiesCreated: entities.length,
            entitiesAfterClear: entitiesAfterClear.size,
            allEntitiesCount: allEntities.size
          }
        };

      } catch (error) {
        errors.push(`ECS lifecycle test failed: ${error}`);
        return {
          testName: 'entity_component_lifecycle_test',
          passed: false,
          duration: 0,
          errors,
          warnings
        };
      }
    }
  },

  {
    config: {
      name: 'system_manager_integration_test',
      description: 'Test system manager integration with world updates',
      phases: ['Phase 1'],
      timeout: 5000,
      cleanup: true
    },
    execute: async (context: ITestContext): Promise<ITestResult> => {
      const errors: string[] = [];
      const warnings: string[] = [];

      try {
        // Create entities for system processing
        const entities: number[] = [];
        for (let i = 0; i < 3; i++) {
          entities.push(context.entityManager.createEntity());
        }

        // Perform multiple world updates
        const updateCount = 5;
        const updateTimes: number[] = [];

        for (let i = 0; i < updateCount; i++) {
          const startTime = performance.now();
          context.world.update(16.67); // 60 FPS
          const endTime = performance.now();
          updateTimes.push(endTime - startTime);
        }

        // Check update performance
        const avgUpdateTime = updateTimes.reduce((a, b) => a + b, 0) / updateTimes.length;
        if (avgUpdateTime > 50) {
          warnings.push(`Average update time high: ${avgUpdateTime.toFixed(1)}ms`);
        }

        // Verify entities still exist
        let entitiesStillExist = 0;
        for (const entity of entities) {
          if (context.entityManager.hasEntity(entity)) {
            entitiesStillExist++;
          }
        }

        return {
          testName: 'system_manager_integration_test',
          passed: errors.length === 0,
          duration: 0,
          errors,
          warnings,
          metadata: {
            updateCount,
            avgUpdateTimeMs: avgUpdateTime,
            entitiesCreated: entities.length,
            entitiesRemaining: entitiesStillExist,
            updateTimes
          }
        };

      } catch (error) {
        errors.push(`System manager integration failed: ${error}`);
        return {
          testName: 'system_manager_integration_test',
          passed: false,
          duration: 0,
          errors,
          warnings
        };
      }
    }
  }
];

/**
 * Simulation-Plugin Compatibility Tests
 *
 * Tests compatibility between simulation framework and plugin system
 */
const simulationPluginCompatibilityTests: IIntegrationTest[] = [
  {
    config: {
      name: 'simulation_plugin_state_sync_test',
      description: 'Test state synchronization between simulation and plugin systems',
      phases: ['Phase 2', 'Phase 5'],
      timeout: 8000,
      cleanup: true,
      enableProfiling: true
    },
    execute: async (context: ITestContext): Promise<ITestResult> => {
      const errors: string[] = [];
      const warnings: string[] = [];

      try {
        // Test plugin manager state
        const availablePlugins = context.pluginManager.getAvailablePluginNames();
        const activePlugins = context.pluginManager.getActivePluginNames();

        // Test simulation framework state
        const simState = context.simulationFramework.getState();

        // Basic compatibility check - both systems should be in sync
        if (simState.isRunning && activePlugins.length === 0) {
          warnings.push('Simulation running but no active plugins');
        }

        // Test state changes coordination
        context.simulationFramework.play();
        const playingState = context.simulationFramework.getState();

        context.simulationFramework.pause();
        const pausedState = context.simulationFramework.getState();

        context.simulationFramework.reset();
        const resetState = context.simulationFramework.getState();

        // Verify state transitions
        if (!playingState.isRunning) {
          errors.push('Simulation failed to enter running state');
        }

        if (!pausedState.isPaused) {
          errors.push('Simulation failed to enter paused state');
        }

        return {
          testName: 'simulation_plugin_state_sync_test',
          passed: errors.length === 0,
          duration: 0,
          errors,
          warnings,
          metadata: {
            availablePluginsCount: availablePlugins.length,
            activePluginsCount: activePlugins.length,
            finalSimState: {
              isRunning: resetState.isRunning,
              isPaused: resetState.isPaused,
              frameCount: resetState.frameCount
            }
          }
        };

      } catch (error) {
        errors.push(`Simulation-plugin compatibility test failed: ${error}`);
        return {
          testName: 'simulation_plugin_state_sync_test',
          passed: false,
          duration: 0,
          errors,
          warnings
        };
      }
    }
  }
];

/**
 * Visualization Integration Tests
 *
 * Tests integration between visualization system and other components
 */
const visualizationIntegrationTests: IIntegrationTest[] = [
  {
    config: {
      name: 'visualization_system_integration_test',
      description: 'Test visualization system integration with simulation state',
      phases: ['Phase 5', 'Phase 6'],
      timeout: 6000,
      cleanup: true
    },
    execute: async (context: ITestContext): Promise<ITestResult> => {
      const errors: string[] = [];
      const warnings: string[] = [];

      try {
        const { graphManager, graphRegistry, simulationFramework } = context;

        // Test manager availability
        if (!graphManager || !graphRegistry) {
          errors.push('Visualization managers not available');
        }

        // Test simulation-visualization coordination
        const simState = simulationFramework.getState();

        // Start simulation to generate data
        simulationFramework.play();

        // Let simulation run briefly
        await new Promise(resolve => setTimeout(resolve, 100));

        const runningState = simulationFramework.getState();

        // Stop simulation
        simulationFramework.pause();
        simulationFramework.reset();

        const resetState = simulationFramework.getState();

        // Verify state progression
        if (runningState.frameCount <= simState.frameCount) {
          warnings.push('Simulation frame count did not increase during run');
        }

        if (resetState.frameCount !== 0) {
          warnings.push('Simulation frame count not reset properly');
        }

        return {
          testName: 'visualization_system_integration_test',
          passed: errors.length === 0,
          duration: 0,
          errors,
          warnings,
          metadata: {
            initialFrameCount: simState.frameCount,
            runningFrameCount: runningState.frameCount,
            resetFrameCount: resetState.frameCount,
            visualizationAvailable: !!(graphManager && graphRegistry)
          }
        };

      } catch (error) {
        errors.push(`Visualization integration test failed: ${error}`);
        return {
          testName: 'visualization_system_integration_test',
          passed: false,
          duration: 0,
          errors,
          warnings
        };
      }
    }
  }
];

/**
 * Memory and Resource Compatibility Tests
 *
 * Tests resource management across different components
 */
const resourceCompatibilityTests: IIntegrationTest[] = [
  {
    config: {
      name: 'cross_component_memory_test',
      description: 'Test memory management across all components during operations',
      phases: ['Phase 7'],
      timeout: 12000,
      cleanup: true,
      enableProfiling: true,
      memoryTracking: true
    },
    execute: async (context: ITestContext): Promise<ITestResult> => {
      const errors: string[] = [];
      const warnings: string[] = [];

      try {
        const initialMemory = context.memoryBaseline;

        // Test cross-component operations
        const operations = [];

        // ECS operations
        operations.push(() => {
          const entities = [];
          for (let i = 0; i < 20; i++) {
            entities.push(context.entityManager.createEntity());
          }
          return entities.length;
        });

        // Simulation operations
        operations.push(() => {
          context.simulationFramework.play();
          for (let i = 0; i < 5; i++) {
            context.world.update(16.67);
          }
          context.simulationFramework.pause();
          return context.simulationFramework.getState().frameCount;
        });

        // Visualization operations (basic)
        operations.push(() => {
          // Just verify managers exist and are functional
          return context.graphManager && context.graphRegistry ? 1 : 0;
        });

        // Execute all operations
        const results = [];
        for (const operation of operations) {
          const result = operation();
          results.push(result);
        }

        // Clean up
        context.world.clear(true);
        context.simulationFramework.reset();

        // Memory check
        let memoryGrowth = 0;
        if (typeof (performance as any).memory !== 'undefined') {
          const currentMemory = (performance as any).memory.usedJSHeapSize;
          memoryGrowth = currentMemory - initialMemory;

          if (memoryGrowth > 10 * 1024 * 1024) { // 10MB threshold
            warnings.push(`High memory usage: ${(memoryGrowth / 1024 / 1024).toFixed(1)}MB`);
          }
        }

        return {
          testName: 'cross_component_memory_test',
          passed: errors.length === 0,
          duration: 0,
          errors,
          warnings,
          metadata: {
            operationsCompleted: operations.length,
            results,
            memoryGrowthBytes: memoryGrowth,
            memoryGrowthMB: memoryGrowth / 1024 / 1024
          }
        };

      } catch (error) {
        errors.push(`Cross-component memory test failed: ${error}`);
        return {
          testName: 'cross_component_memory_test',
          passed: false,
          duration: 0,
          errors,
          warnings
        };
      }
    }
  }
];

/**
 * Cross-Component Compatibility Test Suite
 */
export const CrossComponentCompatibilityTestSuite: IIntegrationTestSuite = {
  name: 'cross_component_compatibility',
  tests: [
    ...ecsCompatibilityTests,
    ...simulationPluginCompatibilityTests,
    ...visualizationIntegrationTests,
    ...resourceCompatibilityTests
  ],

  setup: async (): Promise<void> => {
    console.log('[CrossComponentCompatibilityTestSuite] Setting up cross-component compatibility tests...');
    // Setup for component interaction testing
    console.log('[CrossComponentCompatibilityTestSuite] Setup complete');
  },

  teardown: async (): Promise<void> => {
    console.log('[CrossComponentCompatibilityTestSuite] Tearing down cross-component compatibility tests...');
    // Cleanup after component interaction testing
    console.log('[CrossComponentCompatibilityTestSuite] Teardown complete');
  }
};
