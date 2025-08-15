// jest.setup.ts

jest.mock('@dimforge/rapier3d-compat', () => ({
  World: jest.fn(() => ({
    timestep: 0,
    step: jest.fn(),
    gravity: { x: 0, y: -9.81, z: 0 },
    createRigidBody: jest.fn(() => ({
      translation: jest.fn(() => ({ x: 0, y: 0, z: 0 })),
      rotation: jest.fn(() => ({ x: 0, y: 0, z: 0, w: 1 }))
    }))
  })),
  Vector3: jest.fn((x, y, z) => ({ x, y, z })),
  Quaternion: jest.fn((x, y, z, w) => ({ x, y, z, w }))
}));

jest.mock('tweakpane', () => {
  const mockChildren: any[] = [];
  function makeFolder(options: any) {
    return {
      addBinding: jest.fn(() => ({ on: jest.fn() })),
      dispose: jest.fn(),
      options: options
    };
  }
  const mockPane = {
    addFolder: jest.fn((options) => {
      const folder = makeFolder(options);
      mockChildren.push(folder);
      return folder;
    }),
    dispose: jest.fn(),
    children: mockChildren,
    remove: jest.fn((child) => {
      const index = mockChildren.indexOf(child);
      if (index > -1) {
        mockChildren.splice(index, 1);
      }
    }),
    addBinding: jest.fn(() => ({ on: jest.fn() }))
  };
  // This part seems problematic, as it tries to modify the mockPane.children
  // which is a getter. It might be better to mock the addBinding on the folder itself.
  // For now, I'll comment it out as it's not directly related to the Prettier errors.
  /*
  mockPane.children.forEach(folder => {
    folder.addBinding = jest.fn(() => ({on: jest.fn()}));
  });
  */
  return {
    Pane: jest.fn(() => mockPane)
  };
});

jest.mock('three', () => {
  const mockScene: any = {
    add: jest.fn(),
    remove: jest.fn(),
    children: [],
    background: null,
    traverse: jest.fn(),
    type: 'Scene',
    uuid: 'mock-scene-uuid',
    isScene: true
  };
  const mockCamera = {
    position: {
      x: 0,
      y: 0,
      z: 0,
      set: jest.fn(),
      clone: jest.fn(() => ({ x: 0, y: 0, z: 0 })),
      length: jest.fn(() => 0)
    },
    aspect: 0,
    fov: 75,
    updateProjectionMatrix: jest.fn(),
    lookAt: jest.fn()
  };
  const mockRenderer = {
    setSize: jest.fn((width, height) => {
      // Mock setSize to update internal width/height if needed by tests
      mockRenderer.domElement.width = width;
      mockRenderer.domElement.height = height;
    }),
    domElement: (() => {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 768;

      // Mock getContext to simulate rendering
      const originalGetContext = canvas.getContext;
      canvas.getContext = function (contextType: string): any {
        if (contextType === '2d') {
          const ctx = originalGetContext.call(this, '2d') as CanvasRenderingContext2D;
          if (ctx && mockScene.children.length > 0) {
            // Simulate that we've drawn something when there are objects in the scene
            ctx.fillStyle = 'red';
            ctx.fillRect(100, 100, 50, 50); // Draw a simple rectangle to simulate rendered content
          }
          return ctx;
        }
        return originalGetContext.call(this, contextType);
      };

      return canvas;
    })(),
    render: jest.fn((scene, camera) => {
      // Mock render to simulate drawing when there are objects in the scene
      if (scene && scene.children && scene.children.length > 0) {
        const canvas = mockRenderer.domElement;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = 'red';
          ctx.fillRect(100 + Math.random() * 200, 100 + Math.random() * 200, 50, 50);
        }
      }
    })
  };
  const mockMesh = {
    position: { set: jest.fn() },
    rotation: { setFromQuaternion: jest.fn() },
    geometry: {
      getAttribute: jest.fn(() => ({
        array: new Float32Array([0, 0, 0]),
        needsUpdate: false
      })),
      setAttribute: jest.fn(),
      setIndex: jest.fn(),
      computeVertexNormals: jest.fn(),
      dispose: jest.fn()
    },
    material: {
      dispose: jest.fn()
    }
  };
  const mockQuaternion = {
    x: 0,
    y: 0,
    z: 0,
    w: 1,
    set: jest.fn()
  };

  const MockBufferGeometry = jest.fn(() => ({
    setAttribute: jest.fn(),
    setIndex: jest.fn(),
    computeVertexNormals: jest.fn(),
    dispose: jest.fn(), // Add dispose method
    getAttribute: jest.fn(() => ({
      array: new Float32Array([0, 0, 0]),
      needsUpdate: false
    })),
    attributes: {},
    index: null
  }));

  const MockMaterial = jest.fn(() => ({
    dispose: jest.fn()
  }));

  const MockMeshPhongMaterial = jest.fn(() => ({
    dispose: jest.fn(),
    color: { r: 1, g: 0, b: 0 },
    side: 2 // DoubleSide
  }));

  const MockFloat32BufferAttribute = jest.fn((array, itemSize) => ({
    array: array instanceof Array ? new Float32Array(array) : array,
    itemSize,
    needsUpdate: false
  }));

  const MockBufferAttribute = jest.fn((array, itemSize) => ({
    array: array instanceof Array ? new Float32Array(array) : array,
    itemSize,
    needsUpdate: false
  }));

  return {
    Scene: jest.fn(() => mockScene),
    PerspectiveCamera: jest.fn(() => mockCamera),
    WebGLRenderer: jest.fn(() => mockRenderer),
    BoxGeometry: jest.fn(),
    SphereGeometry: jest.fn(),
    PlaneGeometry: jest.fn(),
    BufferGeometry: MockBufferGeometry,
    Material: MockMaterial,
    MeshBasicMaterial: jest.fn(() => ({})),
    MeshPhongMaterial: MockMeshPhongMaterial,
    Mesh: jest.fn(() => mockMesh),
    Color: jest.fn(),
    Vector3: jest.fn(() => ({
      x: 0,
      y: 0,
      z: 0,
      set: jest.fn(),
      copy: jest.fn(),
      clone: jest.fn()
    })),
    Quaternion: jest.fn(() => mockQuaternion),
    Float32BufferAttribute: MockFloat32BufferAttribute,
    BufferAttribute: MockBufferAttribute,
    DoubleSide: 2,
    PointLight: jest.fn(() => ({
      position: { set: jest.fn() }
    })),
    AmbientLight: jest.fn(() => ({})),
    DirectionalLight: jest.fn(() => ({
      position: { set: jest.fn() },
      lookAt: jest.fn()
    })),
    GridHelper: jest.fn(() => ({
      name: ""
    })),
    AxesHelper: jest.fn(() => ({
      name: ""
    }))
  };
});

// Mock window dimensions globally for tests
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024
});
Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: 768
});
