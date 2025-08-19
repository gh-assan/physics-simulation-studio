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

    private initialized = false;
    update(world: IWorld, deltaTime: number): void {
        const entities = world.componentManager.getEntitiesWithComponentTypes([FlagComponent.type]);

        if (!this.initialized && entities.length > 0) {
            console.log('[FlagSystem] Initializing algorithm with entities:', entities);
            this.algorithm.initialize(entities);
            // Link each FlagComponent's points to the algorithm's points array
            for (const entity of entities) {
                const flagComponent = world.componentManager.getComponent(entity, FlagComponent.type) as FlagComponent;
                if (flagComponent) {
                    flagComponent.points = (this.algorithm as any).points;
                }
            }
            this.initialized = true;
        }

        for (const entity of entities) {
            const flagComponent = world.componentManager.getComponent(entity, FlagComponent.type) as FlagComponent;
            if (flagComponent) {
                const before = flagComponent.points.map(p => ({...p.position}));
                const currentState = this.algorithm.getState();
                const newState = this.algorithm.step(currentState, deltaTime);
                const newPoints = (newState as any).points;
                if (newPoints) {
                    flagComponent.points = newPoints;
                }
                // Log if any point changed
                const changed = flagComponent.points.some((p, idx) => {
                    const initial = before[idx];
                    return p.position.x !== initial.x || p.position.y !== initial.y || p.position.z !== initial.z;
                });
                console.log(`[FlagSystem] Entity ${entity} points changed after update:`, changed);
            }
        }
    }
}
