import { IComponent } from "../ecs/IComponent";

export class SelectableComponent implements IComponent {
    isSelected: boolean;

    constructor(isSelected: boolean = false) {
        this.isSelected = isSelected;
    }
}
