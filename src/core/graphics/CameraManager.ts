// CameraManager.ts
import { ICameraManager } from './interfaces/ICameraManager';

export class CameraManager implements ICameraManager {
  private position = { x: 10, y: 10, z: 10 };
  private target = { x: 0, y: 0, z: 0 };
  private zoom = 1;
  private listeners: Array<(cameraState: any) => void> = [];

  setPosition(position: { x: number, y: number, z: number }): void {
    this.position = { ...position };
    this.emitChange();
  }

  setTarget(target: { x: number, y: number, z: number }): void {
    this.target = { ...target };
    this.emitChange();
  }

  setZoom(distance: number): void {
    this.zoom = distance;
    this.emitChange();
  }

  getPosition(): { x: number, y: number, z: number } {
    return { ...this.position };
  }

  getTarget(): { x: number, y: number, z: number } {
    return { ...this.target };
  }

  getZoom(): number {
    return this.zoom;
  }

  onCameraChanged(callback: (cameraState: any) => void): void {
    this.listeners.push(callback);
  }

  private emitChange(): void {
    const state = {
      position: this.getPosition(),
      target: this.getTarget(),
      zoom: this.getZoom()
    };
    this.listeners.forEach(cb => cb(state));
  }
}
