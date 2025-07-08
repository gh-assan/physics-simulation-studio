import { IComponent } from '../ecs';

export class PositionComponent implements IComponent {
    constructor(public x: number, public y: number, public z: number) {}
}
