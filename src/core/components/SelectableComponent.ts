import {IComponent} from '../ecs/IComponent';

export class SelectableComponent implements IComponent<SelectableComponent> {
  isSelected: boolean;

  constructor(isSelected = false) {
    this.isSelected = isSelected;
  }

  clone(): SelectableComponent {
    return new SelectableComponent(this.isSelected);
  }
}
