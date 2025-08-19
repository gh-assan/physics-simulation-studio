import { World } from "../../../core/ecs/World";
import { FlagComponent } from "../FlagComponent";
import { FlagSimulationPlugin } from "../index";

describe("FlagSimulationPlugin Physics Animation Integration", () => {
  let world: World;
  let flagPlugin: FlagSimulationPlugin;

  beforeEach(async () => {
    world = new World();
    flagPlugin = new FlagSimulationPlugin();
    flagPlugin.register(world);
    await flagPlugin.initializeEntities(world);
    // Register the plugin's systems (physics) with the world
    const systems = flagPlugin.getSystems({} as any);
    systems.forEach(system => world.registerSystem(system));
  });

  test("flag points should change after world updates (physics runs)", () => {
    const flagEntities = world.getEntitiesWithComponents([FlagComponent]);
    expect(flagEntities.length).toBeGreaterThan(0);
    const entityId = flagEntities[0];
    const flag = world.componentManager.getComponent(entityId, FlagComponent.type) as FlagComponent;
    expect(flag).toBeDefined();
    // Run one update to ensure points are initialized
    world.update(16.67);
    // Deep-clone initial positions to avoid referencing the same objects
    const initialPoints = flag.points.map(p => ({
      x: p.position.x,
      y: p.position.y,
      z: p.position.z
    }));
    // Simulate several more world updates
    for (let i = 0; i < 9; i++) {
      world.update(16.67);
    }
    // Re-fetch the FlagComponent to ensure we have the latest reference
    const updatedFlag = world.componentManager.getComponent(entityId, FlagComponent.type) as FlagComponent;
    // Check if any point has changed (handle possible length change)
    const minLen = Math.min(updatedFlag.points.length, initialPoints.length);
    // Debug: print lengths and always print the first point's values
    console.log(`initialPoints.length=${initialPoints.length}, updatedFlag.points.length=${updatedFlag.points.length}`);
    if (minLen > 0) {
      const initial = initialPoints[0];
      const updated = updatedFlag.points[0].position;
      console.log(`Point 0: initial=(${initial.x},${initial.y},${initial.z}) updated=(${updated.x},${updated.y},${updated.z})`);
    }
    const changed = updatedFlag.points.slice(0, minLen).some((p, idx) => {
      const initial = initialPoints[idx];
      return p.position.x !== initial.x || p.position.y !== initial.y || p.position.z !== initial.z;
    });
    expect(changed).toBe(true); // This will fail if physics is not running
  });
});
