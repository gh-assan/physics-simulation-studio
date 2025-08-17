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

  test('should expose adapter-based render system API', async () => {
    const { createAdapterRenderSystem } = await import('../../src/studio/rendering/createAdapterRenderSystem');
    expect(createAdapterRenderSystem).toBeDefined();
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
      update() { }
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

    // Use adapter-based render system (should be silent)
    const { createAdapterRenderSystem } = await import('../../src/studio/rendering/createAdapterRenderSystem');
    const mockGraphicsManager = {
      getScene: () => ({ add() { }, remove() { }, children: [] }),
      getCamera: () => ({}),
      render: () => { },
      initialize: () => { }
    };
    const renderSystem = createAdapterRenderSystem(mockGraphicsManager as any);

    // Register a mock renderer (legacy-style) to ensure no logs
    const mockRenderer = {
      name: 'test-renderer',
      initialize: () => { },
      canRender: () => true,
      render: () => { },
      dispose: () => { }
    };
    renderSystem.registerRenderer(mockRenderer as any);

    // Simulate one frame
    const mockWorld = { componentManager: { getEntitiesWithComponentTypes: () => [] } };
    renderSystem.update(mockWorld as any, 16.67);

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
    // This test verifies the complete state management implementation
    // This should FAIL initially, then PASS after implementation

    try {
      // Test ErrorManager functionality
      const { ErrorManager } = require('../../src/studio/state/ErrorManager');
      const errorManager = ErrorManager.getInstance();

      // Should handle error reporting without console pollution
      errorManager.reportError('Test error', 'warning', { source: 'TestPlugin' });
      expect(errorManager.getErrorCount()).toBeGreaterThan(0);

      // Test PreferencesManager functionality
      const { PreferencesManager } = require('../../src/studio/state/PreferencesManager');
      const prefsManager = PreferencesManager.getInstance();

      // Should handle preferences without console pollution
      prefsManager.setPreference('test.setting', 'testValue');
      expect(prefsManager.getPreference('test.setting')).toBe('testValue');

      // Test performance monitoring state
      const { PerformanceMonitor } = require('../../src/studio/state/PerformanceMonitor');
      const perfMonitor = new PerformanceMonitor();

      // Should track performance without console pollution
      perfMonitor.recordFrameTime(16.67); // 60fps
      expect(perfMonitor.getAverageFPS()).toBeGreaterThan(0);

      console.log('✅ All state management systems functional');
    } catch (error) {
      // This will initially fail - showing what needs to be implemented
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log('❌ State management incomplete:', errorMessage);
      throw new Error(`State management systems not fully implemented: ${errorMessage}`);
    }
  });
});
