export interface IRenderer {
  name: string;
  priority: number;
  update(): void;
  dispose(): void;
}

export class BaseRenderer implements IRenderer {
  public readonly name: string;
  public readonly priority: number;

  constructor(name: string, priority = 10) {
    this.name = name;
    this.priority = priority;
  }

  update(): void { }
  dispose(): void { }
}
