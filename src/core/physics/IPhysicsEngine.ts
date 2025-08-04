import { IRigidBody } from './IRigidBody';

export interface IPhysicsEngine {
  init(): Promise<void>;
  createRigidBody(config: any): IRigidBody;
  step(deltaTime: number): void;
  getRigidBodyPosition(body: IRigidBody): { x: number, y: number, z: number };
  getRigidBodyRotation(body: IRigidBody): { x: number, y: number, z: number, w: number };
  setRigidBodyPosition(body: IRigidBody, position: { x: number, y: number, z: number }): void;
  setRigidBodyRotation(body: IRigidBody, rotation: { x: number, y: number, z: number, w: number }): void;
  removeRigidBody(body: IRigidBody): void;
}
