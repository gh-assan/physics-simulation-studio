// jest.setup.ts

jest.mock('@dimforge/rapier3d-compat', () => ({
  World: jest.fn(() => ({
    timestep: 0,
    step: jest.fn(),
    gravity: {x: 0, y: -9.81, z: 0},
    createRigidBody: jest.fn(() => ({
      translation: jest.fn(() => ({x: 0, y: 0, z: 0})),
      rotation: jest.fn(() => ({x: 0, y: 0, z: 0, w: 1})),
    })),
  })),
  Vector3: jest.fn((x, y, z) => ({x, y, z})),
  Quaternion: jest.fn((x, y, z, w) => ({x, y, z, w})),
}));

jest.mock('tweakpane', () => {
  const mockChildren: any[] = [];
  function makeFolder(options: any) {
    return {
      addBinding: jest.fn(() => ({on: jest.fn()})),
      dispose: jest.fn(),
      options: options,
    };
  }
  const mockPane = {
    addFolder: jest.fn(options => {
      const folder = makeFolder(options);
      mockChildren.push(folder);
      return folder;
    }),
    dispose: jest.fn(),
    children: mockChildren,
    remove: jest.fn(child => {
      const index = mockChildren.indexOf(child);
      if (index > -1) {
        mockChildren.splice(index, 1);
      }
    }),
    addBinding: jest.fn(() => ({on: jest.fn()})),
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
    Pane: jest.fn(() => mockPane),
  };
});

jest.mock('three', () => {
  const mockScene = {
    add: jest.fn(),
    background: null,
  };
  const mockCamera = {
    position: {z: 0},
    aspect: 0,
    updateProjectionMatrix: jest.fn(),
  };
  const mockRenderer = {
    setSize: jest.fn((width, height) => {
      // Mock setSize to update internal width/height if needed by tests
      mockRenderer.domElement.width = width;
      mockRenderer.domElement.height = height;
    }),
    domElement: document.createElement('canvas'),
    render: jest.fn(),
  };
  const mockMesh = {
    position: {set: jest.fn()},
    rotation: {setFromQuaternion: jest.fn()},
  };
  const mockQuaternion = {
    x: 0,
    y: 0,
    z: 0,
    w: 1,
    set: jest.fn(),
  };

  return {
    Scene: jest.fn(() => mockScene),
    PerspectiveCamera: jest.fn(() => mockCamera),
    WebGLRenderer: jest.fn(() => mockRenderer),
    BoxGeometry: jest.fn(),
    SphereGeometry: jest.fn(),
    PlaneGeometry: jest.fn(),
    MeshBasicMaterial: jest.fn(() => ({})),
    Mesh: jest.fn(() => mockMesh),
    Color: jest.fn(),
    Quaternion: jest.fn(() => mockQuaternion),
  };
});

// Mock window dimensions globally for tests
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});
Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: 768,
});
