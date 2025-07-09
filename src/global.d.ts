interface Window {
  showSaveFilePicker: (
    options?: SaveFilePickerOptions
  ) => Promise<FileSystemFileHandle>;
  showOpenFilePicker: (
    options?: OpenFilePickerOptions
  ) => Promise<FileSystemFileHandle[]>;
  addEventListener(type: 'parameter-changed', listener: (this: Window, ev: CustomEvent<{property: string}>) => any, options?: boolean | AddEventListenerOptions): void;
  addEventListener(type: 'simulation-loaded', listener: (this: Window, ev: CustomEvent<{simulationName: string}>) => any, options?: boolean | AddEventListenerOptions): void;
}

// Add declaration for OrbitControls
declare module 'three/examples/jsm/controls/OrbitControls' {
  import { Camera, EventDispatcher } from 'three';

  export class OrbitControls extends EventDispatcher {
    constructor(camera: Camera, domElement?: HTMLElement);

    enabled: boolean;
    enableDamping: boolean;
    dampingFactor: number;
    enableZoom: boolean;
    zoomSpeed: number;
    enableRotate: boolean;
    rotateSpeed: number;
    enablePan: boolean;
    panSpeed: number;
    screenSpacePanning: boolean;
    minDistance: number;
    maxDistance: number;
    minZoom: number;
    maxZoom: number;
    minPolarAngle: number;
    maxPolarAngle: number;

    update(): boolean;
    dispose(): void;
  }
}

interface SaveFilePickerOptions {
  types?: FilePickerAcceptType[];
  excludeAcceptAllOption?: boolean;
  id?: string;
  startIn?: FileSystemHandle;
  suggestedName?: string;
}

interface OpenFilePickerOptions {
  types?: FilePickerAcceptType[];
  multiple?: boolean;
  excludeAcceptAllOption?: boolean;
  id?: string;
  startIn?: FileSystemHandle;
}

interface FilePickerAcceptType {
  description?: string;
  accept: Record<string, string | string[]>;
}
