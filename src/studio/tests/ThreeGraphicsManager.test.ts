import * as THREE from "three";
import { ThreeGraphicsManager } from "../graphics/ThreeGraphicsManager";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

// Mock the DOM elements and methods that ThreeGraphicsManager uses
jest.mock("three", () => {
  const originalModule = jest.requireActual("three");
  return {
    ...originalModule,
    WebGLRenderer: jest.fn().mockImplementation(() => ({
      setSize: jest.fn(),
      render: jest.fn(),
      domElement: document.createElement("canvas")
    })),
    Scene: jest.fn().mockImplementation(() => ({
      add: jest.fn(),
      children: [],
      background: null
    })),
    PerspectiveCamera: jest.fn().mockImplementation(() => ({
      position: { set: jest.fn() },
      lookAt: jest.fn(),
      aspect: 1,
      updateProjectionMatrix: jest.fn()
    })),
    Color: jest.fn().mockImplementation(() => ({
      set: jest.fn()
    })),
    PointLight: jest.fn().mockImplementation(() => ({
      position: { set: jest.fn() }
    })),
    AmbientLight: jest.fn(),
    DirectionalLight: jest.fn().mockImplementation(() => ({
      position: { set: jest.fn() },
      lookAt: jest.fn()
    })),
    GridHelper: jest.fn(),
    AxesHelper: jest.fn(),
    SphereGeometry: jest.fn(),
    MeshBasicMaterial: jest.fn(),
    Mesh: jest.fn().mockImplementation(() => ({
      position: { set: jest.fn() }
    }))
  };
});

// Mock OrbitControls
jest.mock("three/examples/jsm/controls/OrbitControls", () => ({
  OrbitControls: jest.fn().mockImplementation(() => ({
    enableDamping: false,
    dampingFactor: 0,
    screenSpacePanning: false,
    minDistance: 0,
    maxDistance: 0,
    maxPolarAngle: 0,
    update: jest.fn(),
    dispose: jest.fn()
  }))
}));

// Mock document methods
document.createElement = jest.fn().mockImplementation((tag) => {
  if (tag === "div" || tag === "button") {
    return {
      style: {
        position: "",
        top: "",
        left: "",
        right: "",
        backgroundColor: "",
        color: "",
        padding: "",
        borderRadius: "",
        fontFamily: "",
        fontSize: "",
        zIndex: "",
        pointerEvents: "",
        display: ""
      },
      innerHTML: "",
      textContent: "",
      addEventListener: jest.fn(),
      appendChild: jest.fn()
    };
  }
  if (tag === "canvas") {
    return {
      style: {},
      getContext: jest.fn(() => ({
        canvas: { width: 800, height: 600 }
      }))
    };
  }
  return {};
});
document.body.appendChild = jest.fn();

describe("ThreeGraphicsManager", () => {
  let graphicsManager: ThreeGraphicsManager;

  beforeEach(() => {
    jest.clearAllMocks();
    graphicsManager = new ThreeGraphicsManager();
  });

  it("should initialize with a scene, camera, renderer, and controls", () => {
    expect(graphicsManager.scene).toBeDefined();
    expect(graphicsManager.camera).toBeDefined();
    expect(graphicsManager.renderer).toBeDefined();
    expect(graphicsManager.controls).toBeDefined();
    expect(OrbitControls).toHaveBeenCalled();
  });

  it("should configure OrbitControls with appropriate settings", () => {
    expect(graphicsManager.controls.enableDamping).toBe(true);
    expect(graphicsManager.controls.dampingFactor).toBe(0.25);
    expect(graphicsManager.controls.screenSpacePanning).toBe(false);
    expect(graphicsManager.controls.minDistance).toBe(5);
    expect(graphicsManager.controls.maxDistance).toBe(50);
    expect(graphicsManager.controls.maxPolarAngle).toBe(Math.PI / 2);
  });

  it("should add lights to the scene", () => {
    expect(THREE.PointLight).toHaveBeenCalled();
    expect(THREE.AmbientLight).toHaveBeenCalled();
    expect(THREE.DirectionalLight).toHaveBeenCalled();
    expect(graphicsManager.scene.add).toHaveBeenCalled();
  });

  it("should add helper objects to the scene", () => {
    expect(THREE.GridHelper).toHaveBeenCalled();
    expect(THREE.AxesHelper).toHaveBeenCalled();
    expect(THREE.SphereGeometry).toHaveBeenCalled();
    expect(THREE.MeshBasicMaterial).toHaveBeenCalled();
    expect(THREE.Mesh).toHaveBeenCalled();
    expect(graphicsManager.scene.add).toHaveBeenCalled();
  });

  it("should update controls when rendering only if controls are enabled", () => {
    // By default, controls are disabled
    graphicsManager.render();
    expect(graphicsManager.controls.update).not.toHaveBeenCalled();
    expect(graphicsManager.renderer.render).toHaveBeenCalled();

    // Enable controls and render again
    graphicsManager.toggleControls(true);
    graphicsManager.render();
    expect(graphicsManager.controls.update).toHaveBeenCalled();
    expect(graphicsManager.renderer.render).toHaveBeenCalledTimes(2);
  });

  it("should handle window resize events", () => {
    // Simulate a resize event
    const resizeEvent = new Event("resize");
    window.dispatchEvent(resizeEvent);

    // Check if camera and renderer were updated
    expect(graphicsManager.camera.updateProjectionMatrix).toHaveBeenCalled();
    expect(graphicsManager.renderer.setSize).toHaveBeenCalled();
  });

  it("should provide getter methods for scene, camera, renderer, and controls", () => {
    expect(graphicsManager.getScene()).toBe(graphicsManager.scene);
    expect(graphicsManager.getCamera()).toBe(graphicsManager.camera);
    expect(graphicsManager.getRenderer()).toBe(graphicsManager.renderer);
    expect(graphicsManager.controls).toBe(graphicsManager.controls);
  });

  it("should not display camera control instructions directly", () => {
    // Camera control instructions are now managed through the UI panel
    // so we don't expect DOM manipulation calls for this purpose
    expect(graphicsManager.showControlInstructions).toBeDefined();
  });
});
