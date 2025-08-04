export interface IRigidBody {
  getPosition(): { x: number, y: number, z: number };
  getRotation(): { x: number, y: number, z: number, w: number };
  applyImpulse(impulse: { x: number, y: number, z: number }): void;
}
