import { System } from '@core/ecs/System';
import { World } from '@core/ecs/World';
import { WaterDropletComponent, WaterBodyComponent } from './WaterComponents';
import { PositionComponent } from '@core/components/PositionComponent';

export class WaterSystem extends System {
    constructor() {
        super();
    }

    update(world: World, dt: number): void {
        console.log('WaterSystem update called');
        const droplets = world.componentManager.getEntitiesWithComponents([WaterDropletComponent, PositionComponent]);
        console.log('Droplets found:', droplets);
        const waterBodies = world.componentManager.getEntitiesWithComponents([WaterBodyComponent, PositionComponent]);
        console.log('Water bodies found:', waterBodies);

        if (waterBodies.length === 0) return;
        const waterBody = waterBodies[0]; // Assume one water body for now
        const waterBodyPosition = world.componentManager.getComponent(waterBody, PositionComponent.name) as PositionComponent;
        console.log('Water body position:', waterBodyPosition);

        for (const droplet of droplets) {
            const dropletComponent = world.componentManager.getComponent(droplet, WaterDropletComponent.type) as WaterDropletComponent;
            const positionComponent = world.componentManager.getComponent(droplet, PositionComponent.name) as PositionComponent;
            console.log(`Droplet ${droplet} initial position:`, positionComponent.y);
            console.log(`Droplet ${droplet} initial velocity:`, dropletComponent.velocity);

            // Simple gravity
            dropletComponent.velocity -= 9.81 * dt;
            positionComponent.y += dropletComponent.velocity * dt;

            console.log(`Droplet ${droplet} final position:`, positionComponent.y);
            console.log(`Droplet ${droplet} final velocity:`, dropletComponent.velocity);

            // Check for collision with water
            if (positionComponent.y <= waterBodyPosition.y) {
                console.log('Splash!');
                this.createRipples(world, positionComponent.x, positionComponent.z);
                world.entityManager.destroyEntity(droplet);
                console.log(`Droplet ${droplet} destroyed.`);
            }
        }
    }

    createRipples(world: World, x: number, z: number): void {
        // Ripple creation logic will go here
        // This would likely involve creating new entities for the ripples
        // or manipulating a mesh on the water body.
        console.log(`Creating ripples at (${x}, ${z})`);
    }
}
