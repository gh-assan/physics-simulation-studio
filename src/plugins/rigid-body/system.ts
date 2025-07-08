import { System, World } from '../../core/ecs';
import { PhysicsWrapper } from './physics-wrapper';
import { RigidBodyComponent } from './components';
import { PositionComponent, RotationComponent } from '../../core/components';

export class PhysicsSystem extends System {
    private physicsWrapper: PhysicsWrapper;
    private componentQuery = ['RigidBodyComponent', 'PositionComponent', 'RotationComponent'];

    constructor(physicsWrapper: PhysicsWrapper) {
        super();
        this.physicsWrapper = physicsWrapper;
    }

    public update(world: World, deltaTime: number): void {
        // 1. Step the physics simulation
        this.physicsWrapper.step(deltaTime);

        // 2. Synchronize physics state back to ECS components
        const entities = world.componentManager.getEntitiesWithComponents(this.componentQuery);
        for (const entityID of entities) {
            const rigidBodyComp = world.componentManager.getComponent<RigidBodyComponent>(entityID, 'RigidBodyComponent')!;
            const posComp = world.componentManager.getComponent<PositionComponent>(entityID, 'PositionComponent')!;
            const rotComp = world.componentManager.getComponent<RotationComponent>(entityID, 'RotationComponent')!;

            const translation = rigidBodyComp.body.translation();
            const rotation = rigidBodyComp.body.rotation();

            posComp.x = translation.x;
            posComp.y = translation.y;
            posComp.z = translation.z;

            rotComp.x = rotation.x;
            rotComp.y = rotation.y;
            rotComp.z = rotation.z;
            rotComp.w = rotation.w;
        }
    }
}
