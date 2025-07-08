import { IComponent } from '@core/ecs/IComponent';

export class SelectableComponent implements IComponent {
    constructor(public isSelected: boolean = false) {}
}