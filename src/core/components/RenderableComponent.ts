import { Component } from "../ecs/Component";

/**
 * Component that defines how an entity should be rendered.
 */
export class RenderableComponent extends Component<RenderableComponent> {
  /**
   * The type of the component, used for serialization and deserialization.
   */
  static readonly type: string = "RenderableComponent";

  /**
   * The geometry type of the renderable.
   */
  public geometry: "box" | "sphere" | "cylinder" | "cone" | "plane";

  /**
   * The color of the renderable.
   */
  public color: string;

  /**
   * Creates a new RenderableComponent.
   *
   * @param geometry The geometry type of the renderable
   * @param color The color of the renderable
   */
  constructor(
    geometry: "box" | "sphere" | "cylinder" | "cone" | "plane" = "box",
    color = "#ffffff"
  ) {
    super();
    this.geometry = geometry;
    this.color = color;
  }

  /**
   * Creates a deep copy of this component.
   *
   * @returns A new instance of RenderableComponent with the same properties
   */
  clone(): RenderableComponent {
    return new RenderableComponent(this.geometry, this.color);
  }
}
