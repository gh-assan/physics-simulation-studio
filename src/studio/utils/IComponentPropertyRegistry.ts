import { ComponentControlProperty } from "../types";

export interface IComponentPropertyRegistry {
  registerComponentProperties(componentType: string, properties: ComponentControlProperty[]): void;
  getComponentProperties(componentType: string): ComponentControlProperty[] | undefined;
}
