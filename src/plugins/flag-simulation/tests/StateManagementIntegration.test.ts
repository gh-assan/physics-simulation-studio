/**
 * @fileoverview TDD Test for Flag Simulation State Management Integration - Phase 1
 * Priority: CRITICAL - Testing removal of studio context check to enable state integration
 *
 * This test focuses on the first fix: removing the studio context requirement
 * that prevents the flag simulation from working in demos and tests.
 */

import { World } from '../../../core/ecs/World';
import { FlagSimulationPlugin } from '../index';

describe('Flag Simulation Studio Context Removal (TDD Phase 1)', () => {
  let plugin: FlagSimulationPlugin;
  let world: World;

  beforeEach(() => {
    // Create fresh instances for each test
    world = new World();
    plugin = new FlagSimulationPlugin();
  });

  describe('Studio Context Check Removal', () => {
    it('should create entities without studio context', async () => {
      // ARRANGE: Plugin without studio context (simulates demo environment)
      // Current implementation has: if (!this.studio) return;
      // This test should FAIL initially, then PASS after we remove the check

      // Register plugin first to register components
      plugin.register(world);

      // ACT: Initialize entities without studio
      await plugin.initializeEntities(world);

      // ASSERT: Entities should be created (no early return)
      // Get entities with flag components
      const flagEntities = world.getEntitiesWithComponentTypes([
        'FlagComponent',
      ]);
      const poleEntities = world.getEntitiesWithComponentTypes([
        'PoleComponent',
      ]);

      // These should exist after removing the studio check
      expect(flagEntities.length).toBeGreaterThan(0);
      expect(poleEntities.length).toBeGreaterThan(0);
    });

    it('should register components correctly', () => {
      // ARRANGE: Fresh world and plugin

      // ACT: Register plugin
      plugin.register(world);

      // ASSERT: Components should be registered
      expect(() => {
        // These should not throw if components are registered
        world.createEntity();
      }).not.toThrow();
    });

    it('should work in demo environment without studio', async () => {
      // ARRANGE: Simulate demo environment (no studio setup)
      const demoWorld = new World();
      const demoPlugin = new FlagSimulationPlugin();

      // ACT: Register and initialize without studio
      demoPlugin.register(demoWorld);
      await demoPlugin.initializeEntities(demoWorld);

      // ASSERT: Should create entities successfully in demo mode
      const flagEntities = demoWorld.getEntitiesWithComponentTypes([
        'FlagComponent',
      ]);
      const poleEntities = demoWorld.getEntitiesWithComponentTypes([
        'PoleComponent',
      ]);

      expect(flagEntities.length).toBeGreaterThan(0);
      expect(poleEntities.length).toBeGreaterThan(0);
    });
  });

  describe('Current State Verification', () => {
    it('should verify studio context check is removed', async () => {
      // ARRANGE: Plugin without studio context
      plugin.register(world);

      // ACT: Initialize entities
      await plugin.initializeEntities(world);

      // ASSERT: Should now create entities (test verifies fix worked)
      const flagEntities = world.getEntitiesWithComponentTypes([
        'FlagComponent',
      ]);
      const poleEntities = world.getEntitiesWithComponentTypes([
        'PoleComponent',
      ]);

      // After fix: entities are created
      expect(flagEntities.length).toBeGreaterThan(0);
      expect(poleEntities.length).toBeGreaterThan(0);
    });
  });
});
