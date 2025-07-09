import RAPIER from '@dimforge/rapier3d-compat';
import {IComponent} from '../../core/ecs';

export class RigidBodyComponent implements IComponent<RigidBodyComponent> {
  public body: RAPIER.RigidBody;

  constructor(body: RAPIER.RigidBody) {
    this.body = body;
  }

  clone(): RigidBodyComponent {
    // Note: This shallow clones the body reference. Deep clone if needed.
    return new RigidBodyComponent(this.body);
  }
}
