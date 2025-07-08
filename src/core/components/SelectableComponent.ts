import { IComponent } from '../ecs';

export class SelectableComponent implements IComponent {
    constructor(public isSelected: boolean = false) {}
}
