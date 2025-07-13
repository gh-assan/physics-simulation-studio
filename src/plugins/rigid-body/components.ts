import RAPIER from "@dimforge/rapier3d-compat";
import { IComponent } from "../../core/ecs";

export class RigidBodyComponent implements IComponent {
  static readonly type = "RigidBodyComponent";
  public body: RAPIER.RigidBody;

  constructor(body: RAPIER.RigidBody) {
    this.body = body;
  }

  clone(): RigidBodyComponent {
    return new RigidBodyComponent(this.body);
  }
}
