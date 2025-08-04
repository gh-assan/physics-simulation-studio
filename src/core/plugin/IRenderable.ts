import { IGraphicsManager } from '../../studio/IGraphicsManager';

export interface IRenderable {
  render(graphics: IGraphicsManager): void;
  dispose?(): void;
}
