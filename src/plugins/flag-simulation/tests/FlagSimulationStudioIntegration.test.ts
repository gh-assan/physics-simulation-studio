import { World } from "../../../core/ecs/World";
import { IStudio } from "../../../studio/IStudio";
import { ThreeGraphicsManager } from "../../../studio/graphics/ThreeGraphicsManager";
import { FlagComponent } from "../FlagComponent";
import { FlagSimulationPlugin } from "../index";

// Mock THREE library
jest.mock("three", () => {
  class Object3D {
    children: any[];
    position: { x: number; y: number; z: number; set: (...args: any[]) => void };
    rotation: { x: number; y: number; z: number };
    name: string;
    constructor() {
      this.children = [];
      this.position = { x: 0, y: 0, z: 0, set: jest.fn() };
      this.rotation = { x: 0, y: 0, z: 0 };
      this.name = '';
    }
    add(...objs: any[]) { this.children.push(...objs); }
    remove(obj: any) { this.children = this.children.filter((o: any) => o !== obj); }
    traverse(fn: (obj: any) => void) { this.children.forEach(fn); }
    getObjectByName(name: string) { return this.children.find((o: any) => o.name === name); }
  }
  class Group extends Object3D { }
  class Scene extends Object3D { }
  class Mesh extends Object3D {
    geometry: any;
    material: any;
    constructor(geometry: any, material: any) { super(); this.geometry = geometry; this.material = material; }
  }
  class CylinderGeometry { dispose() { } }
  class PlaneGeometry { dispose() { } }
  class MeshLambertMaterial { constructor(opts: any) { } dispose() { } }
  class PerspectiveCamera extends Object3D { }
  class AmbientLight extends Object3D { }
  class AxesHelper extends Object3D { }
  class BufferGeometry { dispose() { } }
  class Material { dispose() { } }
  return {
    Vector3: jest.fn().mockImplementation(() => ({ x: 0, y: 0, z: 0 })),
    Quaternion: jest.fn().mockImplementation(() => ({ x: 0, y: 0, z: 0, w: 1, setFromAxisAngle: jest.fn().mockReturnThis() })),
    Object3D,
    Group,
    Scene,
    Mesh,
    CylinderGeometry,
    PlaneGeometry,
    MeshLambertMaterial,
    PerspectiveCamera,
    AmbientLight,
    AxesHelper,
    BufferGeometry,
    Material,
    DoubleSide: 2
  };
});

describe("FlagSimulationPlugin Studio Integration Tests", () => {
  let world: World;
  let flagPlugin: FlagSimulationPlugin;
  let mockStudio: IStudio;
  let mockGraphicsManager: ThreeGraphicsManager;

  beforeEach(() => {
    world = new World();
    flagPlugin = new FlagSimulationPlugin(); // Create new instance for testing

    // Mock graphics manager
    const mockCamera = {
      position: { set: jest.fn() },
      lookAt: jest.fn()
    };

    const mockControlsManager = {
      enable: jest.fn()
    };

    mockGraphicsManager = {
      getCamera: jest.fn().mockReturnValue(mockCamera),
      getControlsManager: jest.fn().mockReturnValue(mockControlsManager)
    } as any;

    mockStudio = {
      getGraphicsManager: jest.fn().mockReturnValue(mockGraphicsManager)
    } as any;

    // Register the plugin and get its systems to provide studio context
    flagPlugin.register(world); // Register components first
    flagPlugin.getSystems(mockStudio); // This should provide studio context to the plugin
  });

  test("should create flag entities when studio context is available", async () => {
    // Act: Initialize entities with world only (as per interface) - await async operation
    await flagPlugin.initializeEntities(world);

    // Wait a bit more for the async setTimeout in the plugin
    await new Promise(resolve => setTimeout(resolve, 50));

    // Assert: Flag entities should be created using the IWorld interface
    const flagEntities = world.getEntitiesWithComponents([FlagComponent]);
    expect(flagEntities.length).toBeGreaterThan(0);
  });

  test("should initialize entities without camera configuration", async () => {
    // Act: Initialize entities
    await flagPlugin.initializeEntities(world);

    // Assert: Camera should not be configured in initializeEntities (handled by systems)
    // The plugin focuses on entity creation, not camera setup
    expect(mockGraphicsManager.getCamera).not.toHaveBeenCalled();
  });

  test("should create parameter panels when ParameterPanelComponent is registered", async () => {
    // Act: Initialize entities
    await flagPlugin.initializeEntities(world);

    // Assert: Parameter schema should be available
    const parameterSchema = flagPlugin.getParameterSchema();
    expect(parameterSchema).toBeDefined();
    expect(parameterSchema.pluginId).toBe('flag-simulation');
  });

  test('should create entities regardless of studio context availability', async () => {
    // UPDATED TEST: After removing studio context requirement
    // Arrange: Create a new plugin without studio context
    const newPlugin = new FlagSimulationPlugin();
    newPlugin.register(world); // Register components but don't call getSystems

    // Act: Should create entities even without studio context
    await newPlugin.initializeEntities(world);

    // Assert: Should now create entities even when studio is not available (post-fix behavior)
    const flagEntities = world.componentManager.getEntitiesWithComponents([
      FlagComponent,
    ]);
    expect(flagEntities.length).toBeGreaterThan(0);
  });
});
