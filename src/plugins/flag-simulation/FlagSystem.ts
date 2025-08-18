import { ISystem } from '../../core/ecs/ISystem';
import { IWorld } from '../../core/ecs/IWorld';
import { FlagComponent } from './FlagComponent';
import { FlagAlgorithm } from './FlagAlgorithm';

export class FlagSystem implements ISystem {
    public priority = 50;
    private algorithm: FlagAlgorithm;

    constructor(algorithm: FlagAlgorithm) {
        this.algorithm = algorithm;
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
