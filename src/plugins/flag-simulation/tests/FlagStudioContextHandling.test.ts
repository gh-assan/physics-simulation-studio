import { World } from '../../../core/ecs/World';
import { FlagComponent } from '../FlagComponent';
import { FlagSimulationPlugin } from '../index';

describe('FlagSimulationPlugin Studio Context Handling', () => {
  test('should not create entities when initializeEntities is called without studio context', async () => {
    // TDD: This test should initially fail
    const plugin = new FlagSimulationPlugin();
    const world = new World();

    plugin.register(world);

    // Act: Initialize entities without providing studio context
    await plugin.initializeEntities(world);

    // Assert: Should not create flag entities without studio context
    const flagEntities = world.componentManager.getEntitiesWithComponents([FlagComponent]);
    expect(flagEntities.length).toBe(0);
  });

  test('should create entities when studio context is available', async () => {
    // This test shows the expected working behavior
    const plugin = new FlagSimulationPlugin();
    const world = new World();

    plugin.register(world);

    // Provide studio context by calling getSystems
    const mockStudio = { getGraphicsManager: jest.fn() } as any;
    plugin.getSystems(mockStudio);

    // Act: Initialize entities with studio context
    await plugin.initializeEntities(world);

    // Assert: Should create flag entities when studio context is available
    const flagEntities = world.componentManager.getEntitiesWithComponents([FlagComponent]);
    expect(flagEntities.length).toBeGreaterThan(0);
  });
});
