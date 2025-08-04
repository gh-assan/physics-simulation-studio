import { IPanel } from "./IPanel";

export interface IUIManager {
  createPanel(title: string): IPanel;
  addButton(panel: IPanel, title: string, onClick: () => void): void;
  addBinding(panel: IPanel, target: any, key: string, options: any): void;
}
