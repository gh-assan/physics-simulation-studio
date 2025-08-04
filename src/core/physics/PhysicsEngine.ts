import { IRigidBody } from './IRigidBody';
import { RigidBody } from './RigidBody';
import { IPhysicsEngine } from './IPhysicsEngine';

export class PhysicsEngine implements IPhysicsEngine {
  private bodies: Set<IRigidBody> = new Set();

  async init(): Promise<void> {
    // Initialize physics engine resources here
  }

  createRigidBody(config: any): IRigidBody {
    const body = new RigidBody(config.position, config.rotation);
    this.bodies.add(body);
    return body;
  }

  step(deltaTime: number): void {
    // Physics simulation step logic here
  }

  getRigidBodyPosition(body: IRigidBody): { x: number, y: number, z: number } {
    return body.getPosition();
  }

  getRigidBodyRotation(body: IRigidBody): { x: number, y: number, z: number, w: number } {
    return body.getRotation();
  }

  setRigidBodyPosition(body: IRigidBody, position: { x: number, y: number, z: number }): void {
    if ('setPosition' in body) {
      (body as RigidBody).setPosition(position);
    }
  }

  setRigidBodyRotation(body: IRigidBody, rotation: { x: number, y: number, z: number, w: number }): void {
    if ('setRotation' in body) {
      (body as RigidBody).setRotation(rotation);
    }
  }

  removeRigidBody(body: IRigidBody): void {
    this.bodies.delete(body);
  }
}
