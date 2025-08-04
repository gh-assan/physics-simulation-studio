import { IPanel } from './IPanel';
import { ComponentControlProperty } from "./types";

export interface IUIManager {
  createPanel(title: string): IPanel;
  addButton(panel: IPanel, title: string, onClick: () => void): void;
  addBinding(panel: IPanel, target: any, key: string, options: any): void;
  refresh(): void;
  registerComponentControls(
    componentName: string,
    data: any,
    properties?: ComponentControlProperty[]
  ): void;
  clearControls(): void;
  getRegisteredComponentNames(): string[];
  removeComponentControls(componentName: string): void;
  setUIPane(newPane: any): void;
}

