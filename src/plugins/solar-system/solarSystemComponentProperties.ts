import { ComponentControlProperty } from '@app/types';

export const positionComponentProperties: ComponentControlProperty[] = [
  { property: 'x', type: 'number', label: 'Position X', step: 0.1 },
  { property: 'y', type: 'number', label: 'Position Y', step: 0.1 },
  { property: 'z', type: 'number', label: 'Position Z', step: 0.1 },
];

export const celestialBodyComponentProperties: ComponentControlProperty[] = [
  { property: 'name', type: 'text', label: 'Name' },
  { property: 'mass', type: 'number', label: 'Mass', step: 1e20 },
  { property: 'radius', type: 'number', label: 'Radius', step: 100 },
];

export const orbitComponentProperties: ComponentControlProperty[] = [
  { property: 'semiMajorAxis', type: 'number', label: 'Semi-Major Axis', step: 1 },
  { property: 'eccentricity', type: 'number', label: 'Eccentricity', step: 0.001 },
  { property: 'orbitalSpeed', type: 'number', label: 'Orbital Speed', step: 0.001 },
];
