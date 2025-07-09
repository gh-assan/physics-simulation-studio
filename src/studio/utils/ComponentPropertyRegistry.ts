// src/studio/utils/ComponentPropertyRegistry.ts

import { ComponentControlProperty, ComponentPropertyMap } from "../types";

const componentPropertyRegistry: ComponentPropertyMap = {};

export function registerComponentProperties(
  componentName: string,
  properties: ComponentControlProperty[]
): void {
  componentPropertyRegistry[componentName] = properties;
}

export function getComponentProperties(
  componentName: string
): ComponentControlProperty[] | undefined {
  return componentPropertyRegistry[componentName];
}
