/**
 * 🧪 TDD Test: Simplified Rendering System
 */

import * as THREE from 'three';

describe('🎯 Simplified Rendering System - TDD Implementation', () => {

  describe('IRenderer Interface', () => {
    it('should define BaseRenderer implementation', () => {
      try {
        const { BaseRenderer } = require('../../src/studio/rendering/IRenderer');

        expect(BaseRenderer).toBeDefined();
        expect(typeof BaseRenderer).toBe('function');

        const renderer = new BaseRenderer('test', 5);
        expect(renderer.name).toBe('test');
        expect(renderer.priority).toBe(5);
        expect(renderer.update).toBeDefined();
        expect(renderer.dispose).toBeDefined();

        console.log('✅ BaseRenderer working');
      } catch (error) {
        console.log('🔴 Error:', (error as Error).message);
        throw error;
      }
    });
  });

  describe('RenderSystem', () => {
    it('should manage renderers', () => {
      try {
        const { RenderSystem } = require('../../src/studio/rendering/RenderSystem');

        const scene = new THREE.Scene();
        const renderSystem = new RenderSystem(scene);

        expect(renderSystem.registerRenderer).toBeDefined();
        expect(renderSystem.update).toBeDefined();
        expect(renderSystem.getDebugInfo).toBeDefined();

        console.log('✅ RenderSystem working');
      } catch (error) {
        console.log('🔴 Error:', (error as Error).message);
        throw error;
      }
    });
  });

  describe('DirectFlagRenderer', () => {
    it('should implement IRenderer', () => {
      try {
        const { DirectFlagRenderer } = require('../../src/plugins/flag-simulation/DirectFlagRenderer');

        const renderer = new DirectFlagRenderer();
        expect(renderer.name).toBe('direct-flag-renderer');
        expect(renderer.priority).toBe(10);
        expect(renderer.update).toBeDefined();
        expect(renderer.dispose).toBeDefined();

        console.log('✅ DirectFlagRenderer working');
      } catch (error) {
        console.log('🔴 Error:', (error as Error).message);
        throw error;
      }
    });
  });

  describe('Integration', () => {
    it('should work together', () => {
      try {
        const { RenderSystem } = require('../../src/studio/rendering/RenderSystem');
        const { DirectFlagRenderer } = require('../../src/plugins/flag-simulation/DirectFlagRenderer');

        const scene = new THREE.Scene();
        const renderSystem = new RenderSystem(scene);
        const flagRenderer = new DirectFlagRenderer();

        renderSystem.registerRenderer(flagRenderer);

        const debugInfo = renderSystem.getDebugInfo();
        expect(debugInfo.rendererCount).toBe(1);
        expect(debugInfo.renderers[0].name).toBe('direct-flag-renderer');

        console.log('✅ Full integration working');
      } catch (error) {
        console.log('🔴 Error:', (error as Error).message);
        throw error;
      }
    });
  });
});
