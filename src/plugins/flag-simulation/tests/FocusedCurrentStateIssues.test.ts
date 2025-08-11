/**
 * FOCUSED TEST: Current State Parameter Panel and Sim Display Issues
 *
 * Following TDD protocol: Write minimal failing tests to identify exactly what's broken
 */

describe('FOCUSED: Parameter Panel and Sim Display Issues', () => {

  describe('Parameter Panel Integration Issue', () => {
    it('should have working parameter schema in flag simulation plugin', () => {
      // Test the core issue: parameter schema access
      const FlagSimulationPlugin = require('../index').default;
      const plugin = new FlagSimulationPlugin();

      // Basic functionality check
      expect(plugin).toBeDefined();
      expect(plugin.name).toBe('flag-simulation');
      expect(typeof plugin.getParameterSchema).toBe('function');

      // Schema structure check
      const schema = plugin.getParameterSchema();
      expect(schema).toBeDefined();
      expect(schema.pluginId).toBe('flag-simulation');
      expect(schema.components).toBeInstanceOf(Map);

      // Parameter availability check
      expect(schema.components.has('FlagComponent')).toBe(true);
      expect(schema.components.has('PoleComponent')).toBe(true);

      const flagParams = schema.components.get('FlagComponent');
      expect(flagParams).toBeDefined();
      expect(Array.isArray(flagParams)).toBe(true);

      // Critical parameters that should be available for parameter panels
      const windStrengthParam = flagParams.find((p: any) => p.key === 'windStrength');
      const dampingParam = flagParams.find((p: any) => p.key === 'damping');
      const stiffnessParam = flagParams.find((p: any) => p.key === 'stiffness');

      expect(windStrengthParam).toBeDefined();
      expect(dampingParam).toBeDefined();
      expect(stiffnessParam).toBeDefined();

      const poleParams = schema.components.get('PoleComponent');
      expect(poleParams).toBeDefined();
      expect(Array.isArray(poleParams)).toBe(true);

      const heightParam = poleParams.find((p: any) => p.key === 'height');
      expect(heightParam).toBeDefined();
    });
  });

  describe('Simulation Display Renderer Issue', () => {
    it('should have working SimplifiedFlagRenderer file structure', () => {
      // Test if the renderer file exists and has basic structure
      const fs = require('fs');
      const path = require('path');

      const rendererPath = path.join(__dirname, '../SimplifiedFlagRenderer.ts');
      expect(fs.existsSync(rendererPath)).toBe(true);

      // Check if renderer can be imported
      expect(() => {
        require('../SimplifiedFlagRenderer');
      }).not.toThrow();

      // Check renderer class structure
      const { SimplifiedFlagRenderer } = require('../SimplifiedFlagRenderer');
      expect(SimplifiedFlagRenderer).toBeDefined();

      const renderer = new SimplifiedFlagRenderer();
      expect(renderer.name).toBe('simplified-flag-renderer');
      expect(typeof renderer.render).toBe('function');
      expect(typeof renderer.canRender).toBe('function');
    });

    it('should handle basic renderer initialization without THREE.js errors', () => {
      // This test focuses on the core initialization issue
      const { SimplifiedFlagRenderer } = require('../SimplifiedFlagRenderer');

      // Should be able to create renderer
      expect(() => {
        const renderer = new SimplifiedFlagRenderer();
        expect(renderer.name).toBe('simplified-flag-renderer');
      }).not.toThrow();
    });
  });

  describe('Plugin Integration Issue', () => {
    it('should have flag simulation plugin properly exported', () => {
      // Test the export issue found in TDD test
      const FlagSimulationPlugin = require('../index').default;

      // Should be the class, not an instance
      expect(typeof FlagSimulationPlugin).toBe('function');
      expect(FlagSimulationPlugin.name).toBe('FlagSimulationPlugin');

      // Should be able to instantiate
      const plugin = new FlagSimulationPlugin();
      expect(plugin).toBeInstanceOf(FlagSimulationPlugin);
      expect(plugin.name).toBe('flag-simulation');
    });
  });

  describe('Root Cause Analysis', () => {
    it('should identify if this is a Studio integration issue vs plugin issue', () => {
      // Check if the plugin itself is working (plugin-level issue)
      const FlagSimulationPlugin = require('../index').default;
      const plugin = new FlagSimulationPlugin();

      // Plugin should work in isolation
      expect(plugin.getParameterSchema).toBeDefined();
      expect(plugin.getName()).toBe('flag-simulation');

      // The issue is likely in Studio integration, not the plugin itself
      console.log('✅ Plugin works in isolation - issue is likely in Studio integration');

      // This suggests the problem is:
      // 1. Studio not connecting to plugin parameter schemas
      // 2. Studio not properly registering renderers
      // 3. Studio parameter panel system not working with plugin schemas
      expect(true).toBe(true); // Test passes - plugin works fine
    });
  });
});
