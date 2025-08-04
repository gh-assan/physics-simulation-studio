import { IComponent } from './IComponent';

export class SelectableComponent implements IComponent<SelectableComponent> {
  simulationType?: string;
  selected: boolean;

  constructor(selected = false, simulationType?: string) {
    this.selected = selected;
    this.simulationType = simulationType;
  }

  clone(): SelectableComponent {
    return new SelectableComponent(this.selected, this.simulationType);
  }
}
