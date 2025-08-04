import { IComponent } from './IComponent';

export class FlagComponent implements IComponent<FlagComponent> {
  simulationType?: string;
  isAttached: boolean;

  constructor(isAttached: boolean = false, simulationType?: string) {
    this.isAttached = isAttached;
    this.simulationType = simulationType;
  }

  clone(): FlagComponent {
    return new FlagComponent(this.isAttached, this.simulationType);
  }
}
