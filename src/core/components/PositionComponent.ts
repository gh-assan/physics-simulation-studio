import { IComponent } from '@core/ecs/IComponent';

export class PositionComponent implements IComponent {
    constructor(public x: number, public y: number, public z: number) {}
}