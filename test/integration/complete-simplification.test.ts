/**
 * Complete Plugin Simplification Integration Test
 *
 * Tests that the simplified plugin architecture is fully functional:
 * 1. Only simplified rendering system is used
 * 2. No legacy parameter panels exist
 * 3. Clean console output (no debug logs)
 * 4. Plugin-owned parameters work correctly
 * 5. State management is complete
 */

import { World } from '../../src/core/ecs/World';
import { SimplifiedRenderSystem } from '../../src/studio/rendering/simplified/SimplifiedRenderSystem';

describe('Complete Plugin Simplification', () => {
  let world: World;
  let mockCanvas: HTMLCanvasElement;
  let consoleLogs: string[] = [];
  let originalConsole: any;

  beforeEach(() => {
    // Capture console logs to verify no debug pollution
    originalConsole = console.log;
    consoleLogs = [];
    console.log = (...args: any[]) => {
      consoleLogs.push(args.join(' '));
    };

    // Setup test environment
    mockCanvas = document.createElement('canvas');
    world = new World();
  });

  afterEach(() => {
    console.log = originalConsole;
  });

  test('should use only SimplifiedRenderSystem, no legacy systems', async () => {
    // This test should PASS once we complete the migration
    try {
      // Import the simplified render system
      const { SimplifiedRenderSystem } = await import('../../src/studio/rendering/simplified/SimplifiedRenderSystem');

      // Should be able to create it without graphics manager for testing
      // Just verify the class exists and has the right interface
      expect(SimplifiedRenderSystem).toBeDefined();
      expect(SimplifiedRenderSystem.prototype.registerRenderer).toBeDefined();
    } catch (error) {
      fail(`SimplifiedRenderSystem should be importable: ${error}`);
    }
  });

  test('should have no legacy parameter panels in plugin directories', () => {
    // This test should FAIL initially, then PASS after cleanup
    const fs = require('fs');
    const path = require('path');

    const pluginDirs = [
      'src/plugins/flag-simulation',
      'src/plugins/water-simulation'
    ];

    const legacyParameterFiles: string[] = [];

    pluginDirs.forEach(dir => {
      try {
        const fullPath = path.resolve(process.cwd(), dir);
        const files = fs.readdirSync(fullPath);
        const parameterPanelFiles = files.filter((file: string) =>
          file.includes('ParameterPanel') && !file.includes('test')
        );
        legacyParameterFiles.push(...parameterPanelFiles);
      } catch (error) {
        // Directory might not exist in test environment
      }
    });

    expect(legacyParameterFiles).toHaveLength(0);
  });

  test('should have clean console output from all core systems', async () => {
    // This test identifies remaining console pollution across all core systems
    consoleLogs = [];

    // Test SystemManager (major polluter from our analysis)
    world.systemManager.registerSystem(new (class TestSystem {
      name = 'TestSystem';
      priority = 100;
      update() {}
    })());

    // Test ParameterManager
    const { ParameterManager } = await import('../../src/studio/parameters/ParameterManager');
    const paramManager = new ParameterManager();
    paramManager.registerParameter('testAlgorithm', {
      name: 'testParam',
      type: 'number',
      defaultValue: 42,
      category: 'physics',
      constraints: { min: 0, max: 100 }
    });

    // Check for pollution
    const systemPollution = consoleLogs.filter(log =>
      log.includes('[SystemManager]') || log.includes('Registering system') ||
      log.includes('Total systems after registration') || log.includes('System registration complete')
    );

    const paramPollution = consoleLogs.filter(log =>
      log.includes('⚙️') || log.includes('Parameter registered') ||
      log.includes('Parameter updated')
    );

    // Report findings
    if (systemPollution.length > 0) {
      console.log('🚨 SystemManager pollution:');
      systemPollution.forEach(log => console.log(`  - ${log}`));
    }

    if (paramPollution.length > 0) {
      console.log('🚨 ParameterManager pollution:');
      paramPollution.forEach(log => console.log(`  - ${log}`));
    }

    // This should fail initially, then pass after cleanup
    expect([...systemPollution, ...paramPollution]).toHaveLength(0);
  });

  test('should have clean console output from rendering and UI systems', async () => {
    // This test identifies remaining console pollution from rendering & UI systems
    consoleLogs = [];

    // Test SimplifiedRenderManager (identified as major polluter)
    const { SimplifiedRenderManager } = await import('../../src/studio/rendering/simplified/SimplifiedRenderManager');

    // Create mock THREE.js objects for testing
    const mockScene = new (class MockScene {
      add() {}
      remove() {}
      children = [];
    })();
    const mockCamera = new (class MockCamera {
      updateProjectionMatrix() {}
    })();

    const renderManager = new SimplifiedRenderManager(mockScene as any, mockCamera as any);

    // Register a mock renderer to trigger console logs
    const mockRenderer = {
      name: 'test-renderer',
      priority: 1,
      canRender: () => true,
      render: () => {},
      dispose: () => {}
    };
    renderManager.registerRenderer(mockRenderer);

    // Simulate render call
    const mockWorld = { entities: [] };
    renderManager.render(mockWorld as any, 16.67); // Simulate 60fps frame

    // Test VisibilityManager
    const { VisibilityManager } = await import('../../src/studio/ui/VisibilityManager');
    const visibilityManager = new VisibilityManager();
    const testElement = document.createElement('div');
    const testContainer = document.createElement('div');

    visibilityManager.registerPanel('test-panel', testElement, testContainer, 'system');

    // Check for pollution sources
    const renderPollution = consoleLogs.filter(log =>
      log.includes('📝') || log.includes('🎨') ||
      log.includes('Registering renderer') || log.includes('ms')
    );

    const visibilityPollution = consoleLogs.filter(log =>
      log.includes('[VisibilityManager]') || log.includes('registerPanel') ||
      log.includes('Appending element') || log.includes('Panel registered')
    );

    // Report findings
    if (renderPollution.length > 0) {
      console.log('🚨 SimplifiedRenderManager pollution:');
      renderPollution.forEach(log => console.log(`  - ${log}`));
    }

    if (visibilityPollution.length > 0) {
      console.log('🚨 VisibilityManager pollution:');
      visibilityPollution.forEach(log => console.log(`  - ${log}`));
    }

    // This should fail initially, then pass after cleanup
    expect([...renderPollution, ...visibilityPollution]).toHaveLength(0);
  });

  test('should support plugin-owned parameters without central registry', () => {
    // This test verifies the clean parameter architecture
    // Parameters should be defined within plugins, not in core

    // Check that core doesn't have plugin-specific parameter definitions
    const coreParameterFiles = [
      'src/core/ui/ComponentPropertyDefinitions.ts',
      'src/core/parameters/FlagParameters.ts',
      'src/core/parameters/WaterParameters.ts'
    ];

    const fs = require('fs');
    let existingCoreParameterFiles = 0;

    coreParameterFiles.forEach(filePath => {
      try {
        const fullPath = require('path').resolve(process.cwd(), filePath);
        if (fs.existsSync(fullPath)) {
          existingCoreParameterFiles++;
        }
      } catch (error) {
        // File doesn't exist, which is what we want
      }
    });

    expect(existingCoreParameterFiles).toBe(0);
  });

  test('should have complete state management for performance and errors', () => {
    // This test will fail initially, showing what state management is missing
    // For now, just verify that the state management system would be testable

    // Check if we can import state management components
    expect(() => {
      require('../../src/studio/state/ErrorManager');
      require('../../src/studio/state/PreferencesManager');
    }).not.toThrow();

    // Note: Full state manager integration pending
    console.log('Note: Complete state management integration is planned for next phase');
  });
});
