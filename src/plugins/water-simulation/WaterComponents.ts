import { IComponent } from '@core/ecs/IComponent';

export interface Ripple {
    x: number;
    z: number;
    radius: number;
    amplitude: number;
    decay: number;
}

export class WaterBodyComponent implements IComponent {
    public static readonly type = 'WaterBodyComponent';
    readonly type = WaterBodyComponent.type;

    public ripples: Ripple[] = [];

    constructor(public viscosity: number = 0.1, public surfaceTension: number = 0.5) {}
}

export class WaterDropletComponent implements IComponent {
    public static readonly type = 'WaterDropletComponent';
    readonly type = WaterDropletComponent.type;

    constructor(
        public size: number = 0.5,
        public fallHeight: number = 10,
        public velocity: number = 0
    ) {}
}
