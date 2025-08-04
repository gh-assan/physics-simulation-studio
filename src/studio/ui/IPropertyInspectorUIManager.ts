import { IParameterPanel } from "../../core/interfaces/IParameterPanel";

export interface IPropertyInspectorUIManager {
  clearInspectorControls(): void;
  registerParameterPanels(panels: IParameterPanel[]): void;
  registerComponentControls(componentName: string, component: any, parameterPanels: IParameterPanel[]): void;
}
