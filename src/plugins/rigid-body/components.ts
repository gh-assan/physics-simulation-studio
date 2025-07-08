import RAPIER from '@dimforge/rapier3d-compat';
import { IComponent } from '../../core/ecs';

export class RigidBodyComponent implements IComponent {
    public body: RAPIER.RigidBody;
    
    constructor(body: RAPIER.RigidBody) {
        this.body = body;
    }
}
