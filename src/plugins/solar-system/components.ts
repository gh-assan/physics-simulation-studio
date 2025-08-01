import { Component } from '@core/ecs/Component';
import { IComponent } from '@core/ecs/IComponent';

export interface ICelestialBodyComponentData {
  name: string;
  mass: number;
  radius: number;
}

export class CelestialBodyComponent extends Component<CelestialBodyComponent> implements IComponent {
  public static readonly type = 'CelestialBodyComponent';
  readonly type = CelestialBodyComponent.type;

  public name: string;
  public mass: number;
  public radius: number;

  constructor(name: string, mass: number, radius: number) {
    super();
    this.name = name;
    this.mass = mass;
    this.radius = radius;
  }

  public clone(): CelestialBodyComponent {
    return new CelestialBodyComponent(this.name, this.mass, this.radius);
  }
}

export class OrbitComponent extends Component<OrbitComponent> implements IComponent {
  public static readonly type = 'OrbitComponent';
  readonly type = OrbitComponent.type;

  public semiMajorAxis: number;
  public eccentricity: number;
  public orbitalSpeed: number;

  constructor(semiMajorAxis: number, eccentricity: number, orbitalSpeed: number) {
    super();
    this.semiMajorAxis = semiMajorAxis;
    this.eccentricity = eccentricity;
    this.orbitalSpeed = orbitalSpeed;
  }

  public clone(): OrbitComponent {
    return new OrbitComponent(
      this.semiMajorAxis,
      this.eccentricity,
      this.orbitalSpeed
    );
  }
}
