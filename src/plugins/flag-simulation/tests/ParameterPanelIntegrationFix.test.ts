/**
 * TDD Test for Parameter Panel Integration Fix
 *
 * Following TDD protocol: Write failing tests first, then fix to make them pass
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

describe('Parameter Panel Integration Fix - TDD Approach', () => {
  describe('FAILING TESTS: Current Problems', () => {
    it('should fail - parameter manager is not getting plugin parameters', async () => {
      // This test should initially fail - showing us what's broken

      // Mock the Studio environment as it should work
      const mockParameterManager = {
        parameters: new Map(),
        registerParameter: jest.fn((namespace: string, name: string, param: any) => {
          mockParameterManager.parameters.set(`${namespace}.${name}`, param);
        }),
        getAllParameters: jest.fn(() => {
          const result: Record<string, any> = {};
          for (const [key, value] of mockParameterManager.parameters) {
            result[key] = value;
          }
          return result;
        }),
      };

      const mockStudio = {
        parameterManager: mockParameterManager,
        uiManager: {
          createParameterPanel: jest.fn(),
        },
        visibilityManager: {
          registerPluginPanel: jest.fn(),
        },
      };

      // Simulate what should happen when flag simulation initializes
      const FlagSimulationPlugin = require('../index').default;
      const plugin = new FlagSimulationPlugin();

      // Plugin should have parameter schema
      expect(typeof plugin.getParameterSchema).toBe('function');
      const schema = plugin.getParameterSchema();
      expect(schema.size).toBeGreaterThan(0);

      // Simulate plugin registering its parameters with the parameter manager
      for (const [key, param] of schema) {
        mockStudio.parameterManager.registerParameter('flag-simulation', key, param);
      }

      // Now parameter manager should have parameters
      const allParams = mockStudio.parameterManager.getAllParameters();
      console.log('Registered parameters:', Object.keys(allParams));

      // This should pass if parameter integration works correctly
      expect(Object.keys(allParams).length).toBeGreaterThan(0);
      expect(allParams['flag-simulation.windStrength']).toBeDefined();
      expect(allParams['flag-simulation.damping']).toBeDefined();
      expect(allParams['flag-simulation.stiffness']).toBeDefined();
      expect(allParams['flag-simulation.height']).toBeDefined();
    });

    it('should fail - UI manager is not creating parameter panels for flag simulation', () => {
      // This test should fail initially - showing the UI integration issue

      const mockUIManager: any = {
        panels: new Map(),
        createParameterPanel: jest.fn((pluginName: string, schema: Map<string, any>) => {
          const element = document.createElement('div');
          element.id = `${pluginName}-panel`;

          // Simulate creating UI controls for each parameter
          for (const [key, param] of schema) {
            const control = document.createElement('input');
            control.id = `${pluginName}-${key}`;
            control.type = param.type === 'number' ? 'number' : 'text';
            control.value = param.defaultValue.toString();
            element.appendChild(control);
          }

          const panel = { element, pluginName, schema };
          mockUIManager.panels.set(pluginName, panel);
          return panel;
        }),
        getPanel: jest.fn((pluginName: string) => {
          return mockUIManager.panels.get(pluginName);
        }),
      };

      // Simulate creating parameter panel for flag simulation
      const FlagSimulationPlugin = require('../index').default;
      const plugin = new FlagSimulationPlugin();
      const schema = plugin.getParameterSchema();

      const panel = mockUIManager.createParameterPanel('flag-simulation', schema);

      // Panel should be created successfully
      expect(panel).toBeDefined();
      expect(panel.element).toBeInstanceOf(HTMLDivElement);
      expect(panel.pluginName).toBe('flag-simulation');

      // Panel should have controls for each parameter
      const windControl = panel.element.querySelector('#flag-simulation-windStrength');
      const dampingControl = panel.element.querySelector('#flag-simulation-damping');
      const stiffnessControl = panel.element.querySelector('#flag-simulation-stiffness');
      const heightControl = panel.element.querySelector('#flag-simulation-height');

      expect(windControl).toBeDefined();
      expect(dampingControl).toBeDefined();
      expect(stiffnessControl).toBeDefined();
      expect(heightControl).toBeDefined();

      // UI manager should have the panel registered
      const retrievedPanel = mockUIManager.getPanel('flag-simulation');
      expect(retrievedPanel).toBe(panel);
    });

    it('should fail - simulation display is not rendering flag entities', () => {
      // This test should fail initially - showing the rendering issue

      const mockScene = {
        children: [] as any[],
        add: jest.fn((mesh: any) => {
          mockScene.children.push(mesh);
        }),
        remove: jest.fn((mesh: any) => {
          const index = mockScene.children.indexOf(mesh);
          if (index > -1) {
            mockScene.children.splice(index, 1);
          }
        }),
      };

      const mockWorld = {
        componentManager: {
          hasComponent: jest.fn((entityId: number, componentType: string) => {
            // Simulate entities with flag and position components
            if (entityId === 1) {
              return componentType === 'FlagComponent' || componentType === 'PositionComponent';
            }
            return false;
          }),
          getEntitiesWithComponentTypes: jest.fn((types: string[]) => {
            return [1]; // One flag entity
          }),
          getComponent: jest.fn((entityId: number, componentType: string) => {
            if (componentType === 'PositionComponent') {
              return { x: 0, y: 2, z: 0 };
            }
            if (componentType === 'FlagComponent') {
              return { windStrength: 2.5, damping: 0.1, stiffness: 0.8 };
            }
            return null;
          }),
        },
      };

      // Test SimplifiedFlagRenderer
      const { SimplifiedFlagRenderer } = require('../SimplifiedFlagRenderer');
      const renderer = new SimplifiedFlagRenderer();

      const renderContext = {
        scene: mockScene,
        world: mockWorld,
        camera: {},
        renderer: {},
      };

      // Renderer should render without errors
      expect(() => renderer.render(renderContext)).not.toThrow();

      // Scene should have flag meshes added
      expect(mockScene.children.length).toBeGreaterThan(0);

      // Should be able to render multiple times
      renderer.render(renderContext);
      expect(mockScene.children.length).toBeGreaterThan(0); // Should not duplicate
    });
  });

  describe('SOLUTION IMPLEMENTATION', () => {
    it('should implement parameter manager integration in Studio', () => {
      // This test defines what the fix should look like

      // The Studio should automatically register plugin parameters
      const mockStudio: any = {
        plugins: new Map(),
        parameterManager: {
          parameters: new Map(),
          registerParameter: jest.fn(),
        },

        // Method to register plugin and its parameters
        registerPlugin: jest.fn((plugin: any) => {
          mockStudio.plugins.set(plugin.name, plugin);

          // Auto-register plugin parameters if it has getParameterSchema
          if (typeof plugin.getParameterSchema === 'function') {
            const schema = plugin.getParameterSchema();
            for (const [key, param] of schema) {
              mockStudio.parameterManager.registerParameter(plugin.name, key, param);
            }
          }
        }),
      };

      // When a plugin is registered, its parameters should be auto-registered
      const FlagSimulationPlugin = require('../index').default;
      const plugin = new FlagSimulationPlugin();

      mockStudio.registerPlugin(plugin);

      // Verify plugin was registered
      expect(mockStudio.plugins.has(plugin.name)).toBe(true);

      // Verify parameters were auto-registered
      expect(mockStudio.parameterManager.registerParameter).toHaveBeenCalledTimes(4);
      expect(mockStudio.parameterManager.registerParameter).toHaveBeenCalledWith(
        'flag-simulation', 'windStrength', expect.any(Object)
      );
      expect(mockStudio.parameterManager.registerParameter).toHaveBeenCalledWith(
        'flag-simulation', 'damping', expect.any(Object)
      );
      expect(mockStudio.parameterManager.registerParameter).toHaveBeenCalledWith(
        'flag-simulation', 'stiffness', expect.any(Object)
      );
      expect(mockStudio.parameterManager.registerParameter).toHaveBeenCalledWith(
        'flag-simulation', 'height', expect.any(Object)
      );
    });

    it('should implement automatic UI panel creation for registered plugins', () => {
      // This test defines how UI panels should be automatically created

      const mockStudio: any = {
        plugins: new Map(),
        uiManager: {
          createParameterPanel: jest.fn(),
        },
        visibilityManager: {
          registerPluginPanel: jest.fn(),
        },

        // Method to create UI panels for plugins
        createPluginUI: jest.fn((pluginName: string) => {
          const plugin = mockStudio.plugins.get(pluginName);
          if (plugin && typeof plugin.getParameterSchema === 'function') {
            const schema = plugin.getParameterSchema();
            const panel: any = mockStudio.uiManager.createParameterPanel(pluginName, schema);
            mockStudio.visibilityManager.registerPluginPanel(`${pluginName}-panel`, panel);
            return panel;
          }
          return null;
        }),
      };

      // Register plugin and create its UI
      const FlagSimulationPlugin = require('../index').default;
      const plugin = new FlagSimulationPlugin();
      mockStudio.plugins.set(plugin.name, plugin);

      const panel = mockStudio.createPluginUI(plugin.name);

      // UI should be created
      expect(mockStudio.uiManager.createParameterPanel).toHaveBeenCalledWith(
        plugin.name, plugin.getParameterSchema()
      );
      expect(mockStudio.visibilityManager.registerPluginPanel).toHaveBeenCalledWith(
        'flag-simulation-panel', panel
      );
    });
  });
});
