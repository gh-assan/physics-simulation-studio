import { System, World } from '../../core/ecs';
import { PhysicsWrapper } from './physics-wrapper';
import { RigidBodyComponent } from './components';
import { PositionComponent, RotationComponent } from '../../core/components';

export class PhysicsSystem extends System {
    private componentQuery = [RigidBodyComponent, PositionComponent, RotationComponent];

    constructor() {
        super();
    }

    public update(world: World, deltaTime: number): void {
        // Physics world step is handled by RenderSystem

        // Synchronize physics state back to ECS components
        const entities = world.componentManager.getEntitiesWithComponents(this.componentQuery);
        for (const entityID of entities) {
            const rigidBodyComp = world.componentManager.getComponent<RigidBodyComponent>(entityID, RigidBodyComponent.name)!;
            const posComp = world.componentManager.getComponent<PositionComponent>(entityID, PositionComponent.name)!;
            const rotComp = world.componentManager.getComponent<RotationComponent>(entityID, RotationComponent.name)!;

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