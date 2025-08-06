import { ComponentControlProperty } from "../types";

export function prepareComponentProperties(
  data: any,
  properties?: ComponentControlProperty[]
): ComponentControlProperty[] {
  return properties ?? Object.keys(data)
    .filter(key => !['particles', 'springs', 'fixedParticles'].includes(key))
    .map(key => ({ property: key, label: key, type: 'binding' as const }));
}
