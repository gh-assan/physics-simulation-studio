import { Component } from "../ecs/Component";

/**
 * Component that marks an entity as selectable and tracks its selection state.
 */
export class SelectableComponent extends Component<SelectableComponent> {
  /**
   * The type of the component, used for serialization and deserialization.
   */
  static readonly type: string = "SelectableComponent";

  /**
   * Whether the entity is currently selected.
   */
  public isSelected: boolean;

  /**
   * Creates a new SelectableComponent.
   *
   * @param isSelected Whether the entity is initially selected
   */
  constructor(isSelected = false) {
    super();
    this.isSelected = isSelected;
  }

  /**
   * Creates a deep copy of this component.
   *
   * @returns A new instance of SelectableComponent with the same properties
   */
  clone(): SelectableComponent {
    return new SelectableComponent(this.isSelected);
  }
}
