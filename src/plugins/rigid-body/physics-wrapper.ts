import RAPIER from '@dimforge/rapier3d-compat';

export class PhysicsWrapper {
    public world: RAPIER.World;

    constructor() {
        const gravity = new RAPIER.Vector3(0.0, -9.81, 0.0);
        this.world = new RAPIER.World(gravity);
    }

    public step(deltaTime: number): void {
        // Use a fixed timestep for stability
        this.world.timestep = 1.0 / 60.0;
        this.world.step();
    }
}
