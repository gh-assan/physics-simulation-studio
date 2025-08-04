// ICameraManager.ts
export interface ICameraManager {
  setPosition(position: { x: number, y: number, z: number }): void;
  setTarget(target: { x: number, y: number, z: number }): void;
  setZoom(distance: number): void;
  getPosition(): { x: number, y: number, z: number };
  getTarget(): { x: number, y: number, z: number };
  getZoom(): number;
  onCameraChanged(callback: (cameraState: any) => void): void;
}
