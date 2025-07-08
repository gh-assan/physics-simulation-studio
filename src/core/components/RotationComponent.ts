import { IComponent } from '../ecs';

export class RotationComponent implements IComponent {
    constructor(public x: number, public y: number, public z: number, public w: number) {}
}
