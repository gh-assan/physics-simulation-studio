import {Vector3} from './utils/Vector3';

export interface PointMass {
  position: Vector3;
  previousPosition: Vector3;
  velocity: Vector3;
  forces: Vector3;
  mass: number;
  isFixed: boolean;
}

export interface Spring {
  p1: PointMass;
  p2: PointMass;
  restLength: number;
  stiffness: number;
  damping: number;
  type: 'structural' | 'shear' | 'bend';
}
