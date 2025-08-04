export interface IGraphicsManager {
  initialize(container: HTMLElement): void;
  getScene(): any;
  getCamera(): any;
  render(): void;
  add(object: any): void;
  remove(object: any): void;
}
