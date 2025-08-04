export interface IRenderable {
  render(world: any, scene: any, camera: any): void;
  dispose?(): void;
}
