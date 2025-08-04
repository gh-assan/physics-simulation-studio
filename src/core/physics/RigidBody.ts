import { IRigidBody } from './IRigidBody';

export class RigidBody implements IRigidBody {
  private position: { x: number, y: number, z: number };
  private rotation: { x: number, y: number, z: number, w: number };

  constructor(
    position: { x: number, y: number, z: number } = { x: 0, y: 0, z: 0 },
    rotation: { x: number, y: number, z: number, w: number } = { x: 0, y: 0, z: 0, w: 1 }
  ) {
    this.position = position;
    this.rotation = rotation;
  }

  getPosition(): { x: number, y: number, z: number } {
    return { ...this.position };
  }

  setPosition(position: { x: number, y: number, z: number }): void {
    this.position = { ...position };
  }

  getRotation(): { x: number, y: number, z: number, w: number } {
    return { ...this.rotation };
  }

  setRotation(rotation: { x: number, y: number, z: number, w: number }): void {
    this.rotation = { ...rotation };
  }

  applyImpulse(impulse: { x: number, y: number, z: number }): void {
    // Simple example: just add impulse to position
    this.position.x += impulse.x;
    this.position.y += impulse.y;
    this.position.z += impulse.z;
  }
}
