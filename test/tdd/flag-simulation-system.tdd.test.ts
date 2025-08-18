import { World } from '../../src/core/ecs/World';
import { FlagComponent } from '../../src/plugins/flag-simulation/FlagComponent';
import { FlagSystem } from '../../src/plugins/flag-simulation/FlagSystem';
import { FlagAlgorithm } from '../../src/plugins/flag-simulation/FlagAlgorithm';
import { PositionComponent } from '../../src/core/components/PositionComponent';
import { Vector3 } from '../../src/plugins/flag-simulation/utils/Vector3';

describe('FlagSimulationSystem TDD', () => {
    let world: World;
    let flagAlgorithm: FlagAlgorithm;
    let flagSystem: FlagSystem;

    beforeEach(() => {
        world = new World();
        flagAlgorithm = new FlagAlgorithm();
        flagSystem = new FlagSystem(flagAlgorithm);
        world.registerSystem(flagSystem);
        world.registerComponent(PositionComponent);
        world.registerComponent(FlagComponent);
    });

    test('should update a specific unpinned point in the flag component after several world updates', () => {
        const flagEntity = flagSystem.createFlag(world, new PositionComponent(0, 0, 0));
        const flagComponent = world.componentManager.getComponent(flagEntity, FlagComponent.type) as FlagComponent;

        // Find an unpinned point to track. The first point (index 0) is pinned. Let's take the second one.
        const trackedPointIndex = 1;
        const initialPointPosition = new Vector3(
            flagComponent.points[trackedPointIndex].position.x,
            flagComponent.points[trackedPointIndex].position.y,
            flagComponent.points[trackedPointIndex].position.z
        );

        // Run the simulation for a few frames
        for (let i = 0; i < 10; i++) {
            world.update(1 / 60);
        }

        const updatedPoints = flagComponent.points;
        const updatedPointPosition = new Vector3(
            updatedPoints[trackedPointIndex].position.x,
            updatedPoints[trackedPointIndex].position.y,
            updatedPoints[trackedPointIndex].position.z
        );

        // The position of the unpinned point should have changed.
        expect(updatedPointPosition.x).not.toBeCloseTo(initialPointPosition.x);
        expect(updatedPointPosition.y).not.toBeCloseTo(initialPointPosition.y);
    });
});
