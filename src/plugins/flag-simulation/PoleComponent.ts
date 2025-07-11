import { Component } from "../../core/ecs/Component";
import { Vector3 } from "./utils/Vector3";

export class PoleComponent extends Component<PoleComponent> {
  static type = "PoleComponent";

  position: Vector3 = new Vector3(0, 0, 0);
  height = 30; // Increased height
  radius = 0.5; // Increased radius

  constructor(data?: Partial<PoleComponent>) {
    super();
    Object.assign(this, data);
  }

  clone(): PoleComponent {
    return new PoleComponent({
      position: this.position.clone(),
      height: this.height,
      radius: this.radius
    });
  }
}
