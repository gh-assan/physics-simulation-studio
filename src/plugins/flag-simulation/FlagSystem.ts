import { ISystem } from '../../core/ecs/ISystem';
import { IWorld } from '../../core/ecs/IWorld';
import { FlagComponent } from './FlagComponent';
import { FlagAlgorithm } from './FlagAlgorithm';
import { PositionComponent } from '../../core/components/PositionComponent';

export class FlagSystem implements ISystem {
    public priority = 50;
    private algorithm: FlagAlgorithm;

    constructor(algorithm: FlagAlgorithm) {
        this.algorithm = algorithm;
    }

    createFlag(world: IWorld, position: PositionComponent): number {
        const flagEntity = world.createEntity();
        const flagComponent = new FlagComponent();

        // Initialize the algorithm and get the points
        this.algorithm.initialize([flagEntity]);
        const state = this.algorithm.getState() as any;
        flagComponent.points = state.points;

        world.addComponent(flagEntity, PositionComponent.type, position);
        world.addComponent(flagEntity, FlagComponent.type, flagComponent);
        return flagEntity;
    }

    update(world: IWorld, deltaTime: number): void {
        const entities = world.componentManager.getEntitiesWithComponentTypes([FlagComponent.type]);

        for (const entity of entities) {
            const flagComponent = world.componentManager.getComponent(entity, FlagComponent.type) as FlagComponent;
            if (flagComponent) {
                const currentState = this.algorithm.getState();
                const newState = this.algorithm.step(currentState, deltaTime);
                const newPoints = (newState as any).points;
                if (newPoints) {
                    flagComponent.points = newPoints;
                }
            }
        }
    }
}
