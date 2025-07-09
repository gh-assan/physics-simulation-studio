export interface PointMass {
  position: {x: number; y: number; z: number};
  previousPosition: {x: number; y: number; z: number};
  velocity: {x: number; y: number; z: number};
  forces: {x: number; y: number; z: number};
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
