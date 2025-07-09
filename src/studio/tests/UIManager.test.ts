import {UIManager} from '../uiManager';

// Mock the Tweakpane library
jest.mock('tweakpane', () => {
  interface MockFolder {
    addBinding: jest.Mock;
    dispose: jest.Mock;
    options: {title: string};
  }

  function makeFolder(options: {title: string}): MockFolder {
    return {
      addBinding: jest.fn(() => ({on: jest.fn()})),
      dispose: jest.fn(),
      options: options,
    };
  }

  interface MockPane {
    addFolder: jest.Mock<MockFolder, [{title: string}]>;
    dispose: jest.Mock;
    addBinding: jest.Mock;
  }

  const mockPane: MockPane = {
    addFolder: jest.fn((options: {title: string}) => makeFolder(options)),
    dispose: jest.fn(),
    addBinding: jest.fn(() => ({on: jest.fn()})),
  };
  return {
    Pane: jest.fn(() => mockPane),
  };
});

describe('UIManager', () => {
    let uiManager: UIManager;
  let mockPaneInstance: any; // This will hold the mocked Pane instance

  beforeEach(() => {
    // Create required DOM elements
    const ids = [
      'app-container',
      'viewport-container',
      'tweakpane-container',
      'scene-graph-container',
      'play-button',
      'pause-button',
      'reset-button',
      'add-box-button',
      'add-sphere-button',
    ];
    ids.forEach(id => {
      const el = document.createElement(
        id.endsWith('-button') ? 'button' : 'div',
      );
      el.id = id;
      document.body.appendChild(el);
    });

    // Clear all mocks before each test
    jest.clearAllMocks();

        mockPaneInstance =
      (jest.requireMock('tweakpane').Pane as jest.MockedFunction<any>).mock.results[0]?.value ||
      new (jest.requireMock('tweakpane').Pane as jest.MockedFunction<any>)();
    uiManager = new UIManager(mockPaneInstance);
  });

  afterEach(() => {
    // Clean up injected DOM elements
    const ids = [
      'app-container',
      'viewport-container',
      'tweakpane-container',
      'scene-graph-container',
      'play-button',
      'pause-button',
      'reset-button',
      'add-box-button',
      'add-sphere-button',
    ];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });
  });

  it('should initialize Tweakpane', () => {
        expect(jest.requireMock('tweakpane').Pane).toHaveBeenCalledTimes(1);
  });

  it('should register component controls for numbers, booleans, and strings', () => {
    const obj = {
      value: 10,
      enabled: true,
      name: 'test',
    };
    uiManager.registerComponentControls('TestComponent', obj);

    expect(mockPaneInstance.addFolder).toHaveBeenCalledWith({
      title: 'TestComponent',
    });
    const mockFolder = mockPaneInstance.addFolder.mock.results[0]?.value;
    expect(mockFolder.addBinding).toHaveBeenCalledWith(obj, 'value');
    expect(mockFolder.addBinding).toHaveBeenCalledWith(obj, 'enabled');
    expect(mockFolder.addBinding).toHaveBeenCalledWith(obj, 'name');
  });

  it('should clear all controls', () => {
    // Register some dummy components to create folders
    const mockObj1 = {prop1: 1};
    const mockObj2 = {prop2: true};
    uiManager.registerComponentControls('ComponentA', mockObj1);
    uiManager.registerComponentControls('ComponentB', mockObj2);

    // Get references to the mocked folders
    const mockFolderA = mockPaneInstance.addFolder.mock.results[0]?.value;
    const mockFolderB = mockPaneInstance.addFolder.mock.results[1]?.value;

    // Spy on the dispose method of the individual folders
    const disposeSpyA = jest.spyOn(mockFolderA, 'dispose');
    const disposeSpyB = jest.spyOn(mockFolderB, 'dispose');

    uiManager.clearControls();

    // Assert that the dispose method of each folder was called
    expect(disposeSpyA).toHaveBeenCalledTimes(1);
    expect(disposeSpyB).toHaveBeenCalledTimes(1);
    expect(uiManager['folders'].size).toBe(0); // Ensure the folders map is cleared
  });
});
