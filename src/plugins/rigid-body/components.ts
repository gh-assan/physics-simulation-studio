import { IComponent } from "../../core/ecs/IComponent";
import { IRigidBody } from "../../core/physics/IRigidBody";

export class RigidBodyComponent implements IComponent<RigidBodyComponent> {
  static readonly type = "RigidBodyComponent";
  public body: IRigidBody;

  constructor(body: IRigidBody) {
    this.body = body;
  }

  clone(): RigidBodyComponent {
    return new RigidBodyComponent(this.body);
  }
}
