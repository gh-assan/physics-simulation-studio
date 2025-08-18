
import { World } from '../../src/core/ecs/World';
import { FlagComponent } from '../../src/plugins/flag-simulation/FlagComponent';
import { FlagSystem } from '../../src/plugins/flag-simulation/FlagSystem';
import { FlagAlgorithm } from '../../src/plugins/flag-simulation/FlagAlgorithm';
import { PositionComponent } from '../../src/core/components/PositionComponent';

describe('FlagSimulationSystem TDD', () => {
    let world: World;
    let flagAlgorithm: FlagAlgorithm;
    let flagSystem: FlagSystem;

    beforeEach(() => {
        world = new World();
        flagAlgorithm = new FlagAlgorithm();
        flagAlgorithm.initialize([]);
        flagSystem = new FlagSystem(flagAlgorithm);
        world.registerSystem(flagSystem);
        world.registerComponent(PositionComponent);
        world.registerComponent(FlagComponent);
    });

    test('should update flag component points after world update', () => {
        const flagEntity = world.createEntity();
        const flagComponent = new FlagComponent();
        const initialPoints = JSON.parse(JSON.stringify(flagComponent.points));
        world.addComponent(flagEntity, PositionComponent.type, new PositionComponent(0, 0, 0));
        world.addComponent(flagEntity, FlagComponent.type, flagComponent);

        world.update(1 / 60);

        const updatedPoints = flagComponent.points;

        expect(updatedPoints).not.toEqual(initialPoints);
    });
});
