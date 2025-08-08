import {
  EnhancedCameraManager,
  Camera,
  Matrix4,
  OrbitControls
} from '../EnhancedCameraManager';
import {
  CameraType,
  IVector3,
  ICameraPreset
} from '../interfaces';

describe('EnhancedCameraManager', () => {
  let cameraManager: EnhancedCameraManager;

  beforeEach(() => {
    cameraManager = new EnhancedCameraManager();
  });

  describe('Basic Camera Management', () => {
    test('should create default camera on initialization', () => {
      const defaultCamera = cameraManager.getActiveCamera();
      expect(defaultCamera).toBeDefined();
      expect(defaultCamera.type).toBe(CameraType.PERSPECTIVE);
    });

    test('should create new cameras', () => {
      const camera = cameraManager.createCamera(CameraType.ORTHOGRAPHIC, 'test-camera');
      expect(camera.type).toBe(CameraType.ORTHOGRAPHIC);

      const retrieved = cameraManager.getCamera('test-camera');
      expect(retrieved).toBe(camera);
    });

    test('should list all cameras', () => {
      cameraManager.createCamera(CameraType.PERSPECTIVE, 'camera1');
      cameraManager.createCamera(CameraType.ORTHOGRAPHIC, 'camera2');

      const cameras = cameraManager.listCameras();
      expect(cameras).toContain('default');
      expect(cameras).toContain('camera1');
      expect(cameras).toContain('camera2');
      expect(cameras.length).toBe(3);
    });

    test('should set active camera', () => {
      const newCamera = cameraManager.createCamera(CameraType.ORTHOGRAPHIC, 'new-camera');
      cameraManager.setActiveCamera('new-camera');

      const activeCamera = cameraManager.getActiveCamera();
      expect(activeCamera).toBe(newCamera);
    });

    test('should throw error when setting non-existent active camera', () => {
      expect(() => {
        cameraManager.setActiveCamera('non-existent');
      }).toThrow();
    });

    test('should remove cameras', () => {
      cameraManager.createCamera(CameraType.PERSPECTIVE, 'removable');
      expect(cameraManager.getCamera('removable')).toBeDefined();

      cameraManager.removeCamera('removable');
      expect(cameraManager.getCamera('removable')).toBeUndefined();
    });

    test('should not allow removing active camera', () => {
      expect(() => {
        cameraManager.removeCamera('default');
      }).toThrow();
    });
  });

  describe('Camera Properties', () => {
    test('should set and get camera position', () => {
      const position: IVector3 = { x: 10, y: 20, z: 30 };
      cameraManager.setPosition(position);

      const retrievedPosition = cameraManager.getPosition();
      expect(retrievedPosition).toEqual(position);
    });

    test('should set and get camera target', () => {
      const target: IVector3 = { x: 5, y: 10, z: 15 };
      cameraManager.setTarget(target);

      const retrievedTarget = cameraManager.getTarget();
      expect(retrievedTarget).toEqual(target);
    });

    test('should set and get zoom distance', () => {
      cameraManager.setZoom(50);

      const zoom = cameraManager.getZoom();
      expect(zoom).toBeCloseTo(50, 1);
    });

    test('should set field of view', () => {
      cameraManager.setFOV(90);

      const camera = cameraManager.getActiveCamera();
      expect(camera.fov).toBe(90);
    });
  });

  describe('Camera Presets', () => {
    test('should have default presets', () => {
      const presets = cameraManager.getPresets();

      const presetNames = presets.map(p => p.name);
      expect(presetNames).toContain('Front');
      expect(presetNames).toContain('Top');
      expect(presetNames).toContain('Isometric');
    });

    test('should apply preset', () => {
      const presets = cameraManager.getPresets();
      const frontPreset = presets.find(p => p.name === 'Front');

      expect(frontPreset).toBeDefined();
      cameraManager.applyPreset(frontPreset!);

      const position = cameraManager.getPosition();
      expect(position).toEqual(frontPreset!.position);
    });

    test('should save custom preset', () => {
      const customPosition: IVector3 = { x: 100, y: 200, z: 300 };
      cameraManager.setPosition(customPosition);

      const savedPreset = cameraManager.savePreset('custom');
      expect(savedPreset.name).toBe('custom');
      expect(savedPreset.position).toEqual(customPosition);

      const presets = cameraManager.getPresets();
      expect(presets.find(p => p.name === 'custom')).toBeDefined();
    });
  });

  describe('Orbit Controls', () => {
    test('should create orbit controls', () => {
      const camera = cameraManager.getActiveCamera();
      const target: IVector3 = { x: 0, y: 0, z: 0 };

      const controls = cameraManager.createOrbitControls(camera, target);

      expect(controls).toBeDefined();
      expect(controls.enabled).toBe(true);
      expect(controls.target).toEqual(target);
    });
  });

  describe('Camera Callbacks', () => {
    test('should call callbacks on camera changes', () => {
      const callback = jest.fn();
      cameraManager.onCameraChanged(callback);

      const newPosition: IVector3 = { x: 10, y: 20, z: 30 };
      cameraManager.setPosition(newPosition);

      expect(callback).toHaveBeenCalled();

      const callbackArg = callback.mock.calls[0][0];
      expect(callbackArg.position).toEqual(newPosition);
    });

    test('should handle callback errors gracefully', () => {
      const errorCallback = jest.fn(() => {
        throw new Error('Test error');
      });
      const normalCallback = jest.fn();

      cameraManager.onCameraChanged(errorCallback);
      cameraManager.onCameraChanged(normalCallback);

      // Should not throw despite error in first callback
      expect(() => {
        cameraManager.setPosition({ x: 1, y: 2, z: 3 });
      }).not.toThrow();

      expect(errorCallback).toHaveBeenCalled();
      expect(normalCallback).toHaveBeenCalled();
    });
  });
});

describe('Camera', () => {
  let camera: Camera;

  beforeEach(() => {
    camera = new Camera(CameraType.PERSPECTIVE);
  });

  describe('Matrix Calculations', () => {
    test('should generate view matrix', () => {
      camera.setPosition({ x: 0, y: 0, z: 10 });
      camera.setTarget({ x: 0, y: 0, z: 0 });

      const viewMatrix = camera.getViewMatrix();
      expect(viewMatrix.elements).toBeDefined();
      expect(viewMatrix.elements.length).toBe(16);
    });

    test('should generate projection matrix', () => {
      camera.setFOV(75);
      camera.setAspectRatio(16/9);
      camera.setClippingPlanes(0.1, 1000);

      const projMatrix = camera.getProjectionMatrix();
      expect(projMatrix.elements).toBeDefined();
      expect(projMatrix.elements.length).toBe(16);
    });

    test('should update matrices when properties change', () => {
      const initialViewMatrix = camera.getViewMatrix();
      const initialElements = [...initialViewMatrix.elements];

      camera.setPosition({ x: 10, y: 0, z: 0 });

      const updatedViewMatrix = camera.getViewMatrix();
      const updatedElements = [...updatedViewMatrix.elements];

      expect(updatedElements).not.toEqual(initialElements);
    });

    test('should create proper orthographic projection', () => {
      const orthoCamera = new Camera(CameraType.ORTHOGRAPHIC);
      orthoCamera.setAspectRatio(1);

      const projMatrix = orthoCamera.getProjectionMatrix();
      expect(projMatrix.elements).toBeDefined();

      // Test that it's different from perspective projection
      const perspCamera = new Camera(CameraType.PERSPECTIVE);
      perspCamera.setAspectRatio(1);
      const perspMatrix = perspCamera.getProjectionMatrix();

      expect(projMatrix.elements).not.toEqual(perspMatrix.elements);
    });
  });

  describe('Camera Updates', () => {
    test('should mark camera for update when properties change', () => {
      // Get initial matrix to cache it
      camera.getViewMatrix();

      // Change position and verify update is triggered
      camera.setPosition({ x: 5, y: 5, z: 5 });
      camera.update();

      // Matrix should be recalculated
      const matrix = camera.getViewMatrix();
      expect(matrix).toBeDefined();
    });
  });
});

describe('Matrix4', () => {
  let matrix: Matrix4;

  beforeEach(() => {
    matrix = new Matrix4();
  });

  describe('Basic Operations', () => {
    test('should initialize as identity matrix', () => {
      const elements = matrix.elements;

      // Check diagonal elements are 1
      expect(elements[0]).toBe(1);
      expect(elements[5]).toBe(1);
      expect(elements[10]).toBe(1);
      expect(elements[15]).toBe(1);

      // Check non-diagonal elements are 0
      expect(elements[1]).toBe(0);
      expect(elements[2]).toBe(0);
      expect(elements[4]).toBe(0);
    });

    test('should set elements', () => {
      matrix.set(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16);

      expect(matrix.elements[0]).toBe(1);
      expect(matrix.elements[5]).toBe(6);
      expect(matrix.elements[15]).toBe(16);
    });

    test('should multiply matrices', () => {
      matrix.set(
        1, 0, 0, 1,
        0, 1, 0, 2,
        0, 0, 1, 3,
        0, 0, 0, 1
      );

      const other = new Matrix4();
      other.set(
        1, 0, 0, 4,
        0, 1, 0, 5,
        0, 0, 1, 6,
        0, 0, 0, 1
      );

      matrix.multiply(other);

      // For translation matrices T1 * T2, the translations should be combined
      // In column-major format, translations are at indices 3, 7, 11 (not 12, 13, 14)
      expect(matrix.elements[3]).toBe(5);  // 1 + 4
      expect(matrix.elements[7]).toBe(7);  // 2 + 5
      expect(matrix.elements[11]).toBe(9); // 3 + 6
    });

    test('should copy matrix', () => {
      const source = new Matrix4();
      source.set(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16);

      matrix.copy(source);

      for (let i = 0; i < 16; i++) {
        expect(matrix.elements[i]).toBe(source.elements[i]);
      }
    });

    test('should clone matrix', () => {
      matrix.set(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16);

      const cloned = matrix.clone();

      expect(cloned).not.toBe(matrix);
      for (let i = 0; i < 16; i++) {
        expect(cloned.elements[i]).toBe(matrix.elements[i]);
      }
    });
  });

  describe('Camera-Specific Operations', () => {
    test('should create look-at matrix', () => {
      const eye: IVector3 = { x: 0, y: 0, z: 10 };
      const target: IVector3 = { x: 0, y: 0, z: 0 };
      const up: IVector3 = { x: 0, y: 1, z: 0 };

      matrix.lookAt(eye, target, up);

      // Verify matrix is not identity
      expect(matrix.elements).not.toEqual(new Matrix4().elements);

      // Basic sanity check - translation should be negative of eye position (view transform)
      expect(matrix.elements[14]).toBeCloseTo(-10, 5);
    });

    test('should create perspective projection matrix', () => {
      matrix.perspective(75, 16/9, 0.1, 1000);

      // Verify matrix is not identity
      expect(matrix.elements).not.toEqual(new Matrix4().elements);

      // Check that diagonal elements are set (basic sanity check)
      expect(matrix.elements[0]).not.toBe(0);
      expect(matrix.elements[5]).not.toBe(0);
      expect(matrix.elements[10]).not.toBe(0);
    });

    test('should create orthographic projection matrix', () => {
      matrix.orthographic(-10, 10, -10, 10, 0.1, 1000);

      // Verify matrix is not identity
      expect(matrix.elements).not.toEqual(new Matrix4().elements);

      // Check scaling factors
      expect(matrix.elements[0]).toBeCloseTo(0.1, 5); // 2/20
      expect(matrix.elements[5]).toBeCloseTo(0.1, 5); // 2/20
    });
  });
});

describe('OrbitControls', () => {
  let camera: Camera;
  let controls: OrbitControls;
  let target: IVector3;

  beforeEach(() => {
    camera = new Camera(CameraType.PERSPECTIVE);
    target = { x: 0, y: 0, z: 0 };
    controls = new OrbitControls(camera, target);
  });

  describe('Initialization', () => {
    test('should initialize with default values', () => {
      expect(controls.enabled).toBe(true);
      expect(controls.target).toEqual(target);
      expect(controls.enableZoom).toBe(true);
      expect(controls.enablePan).toBe(true);
      expect(controls.enableRotate).toBe(true);
    });

    test('should calculate initial distance', () => {
      camera.setPosition({ x: 0, y: 0, z: 10 });
      const newControls = new OrbitControls(camera, { x: 0, y: 0, z: 0 });

      expect(newControls.distance).toBeCloseTo(10, 5);
    });
  });

  describe('Control Operations', () => {
    test('should update camera position', () => {
      const initialPosition = { ...camera.position };

      controls.rotate(Math.PI / 4, 0);
      controls.update();

      const newPosition = camera.position;
      expect(newPosition).not.toEqual(initialPosition);
    });

    test('should respect zoom limits', () => {
      controls.minDistance = 5;
      controls.maxDistance = 20;

      controls.zoom(-10); // Try to zoom out beyond max
      controls.update();
      expect(controls.distance).toBeLessThanOrEqual(controls.maxDistance);

      controls.zoom(50); // Try to zoom in beyond min
      controls.update();
      expect(controls.distance).toBeGreaterThanOrEqual(controls.minDistance);
    });

    test('should reset to default state', () => {
      controls.rotate(Math.PI, Math.PI / 2);
      controls.zoom(20);
      controls.update();

      controls.reset();

      expect(controls.target).toEqual({ x: 0, y: 0, z: 0 });
      // Position should be reset to default
      const expectedDistance = Math.sqrt(
        Math.pow(camera.position.x, 2) +
        Math.pow(camera.position.y, 2) +
        Math.pow(camera.position.z, 2)
      );
      expect(expectedDistance).toBeCloseTo(10, 1);
    });

    test('should respect enable flags', () => {
      const initialPosition = { ...camera.position };

      controls.setEnabled(false);
      controls.rotate(Math.PI, 0);
      controls.update();

      // Position should not change when disabled
      expect(camera.position).toEqual(initialPosition);
    });

    test('should respect individual control enables', () => {
      controls.enableRotate = false;
      const initialPosition = { ...camera.position };

      controls.rotate(Math.PI / 2, 0);
      controls.update();

      // Should not rotate when rotate is disabled (use close comparison for floating point)
      expect(camera.position.x).toBeCloseTo(initialPosition.x, 10);
      expect(camera.position.y).toBeCloseTo(initialPosition.y, 10);
      expect(camera.position.z).toBeCloseTo(initialPosition.z, 10);
    });
  });

  describe('Target Management', () => {
    test('should update target', () => {
      const newTarget: IVector3 = { x: 10, y: 20, z: 30 };
      controls.setTarget(newTarget);

      expect(controls.target).toEqual(newTarget);
    });

    test('should point camera at target', () => {
      const newTarget: IVector3 = { x: 5, y: 0, z: 0 };
      controls.setTarget(newTarget);
      controls.update();

      expect(camera.target).toEqual(newTarget);
    });
  });

  describe('Pan Operations', () => {
    test('should pan when enabled', () => {
      const initialTarget = { ...controls.target };

      controls.pan(1, 1);

      expect(controls.target).not.toEqual(initialTarget);
    });

    test('should not pan when disabled', () => {
      controls.enablePan = false;
      const initialTarget = { ...controls.target };

      controls.pan(1, 1);

      expect(controls.target).toEqual(initialTarget);
    });
  });
});
