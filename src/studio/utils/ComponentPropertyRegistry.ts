// src/studio/utils/ComponentPropertyRegistry.ts

import { ComponentControlProperty } from "../types";

interface ComponentPropertyMap {
  [componentName: string]: ComponentControlProperty[];
}

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
