// src/studio/utils/StudioUtils.ts
import {IComponent} from '../../core/ecs/IComponent';
import {ComponentControlProperty} from '../types';

export const getLocation = () => window.location;

/**
 * Clears all child nodes of a given DOM element.
 * @param element The DOM element to clear.
 */
export function clearElement(element: HTMLElement): void {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

/**
 * Logs a message with a timestamp.
 * @param message The message to log.
 */
export function logWithTimestamp(message: string): void {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

/**
 * Extracts properties from a component for UI binding.
 * @param component The component to extract properties from.
 * @returns An array of ComponentControlProperty objects.
 */
export function extractComponentProperties(
  component: IComponent,
): ComponentControlProperty[] {
  const properties: ComponentControlProperty[] = [];

  for (const key in component) {
    if (Object.prototype.hasOwnProperty.call(component, key)) {
      const value = (component as any)[key];
      if (typeof value === 'number') {
        properties.push({
          label: key,
          property: key,
          type: 'number',
          min: 0,
          max: 100,
          step: 1,
        });
      } else if (typeof value === 'boolean') {
        properties.push({
          label: key,
          property: key,
          type: 'boolean',
        });
      }
    }
  }

  return properties;
}
