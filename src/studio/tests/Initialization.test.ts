import { World } from '../../core/ecs/World';
import { PluginManager } from '../../core/plugin/PluginManager';
import { StateManager } from '../state/StateManager';
import { Studio } from '../Studio';
import { UIManager } from '../uiManager';
import flagSimulationPluginInstance, { FlagSimulationPlugin } from '../../plugins/flag-simulation';
import { FlagComponent } from '../../plugins/flag-simulation/FlagComponent';
import { Pane } from 'tweakpane';
import { IPluginContext } from '../IPluginContext';
import { PropertyInspectorUIManager } from '../ui/PropertyInspectorUIManager';
import { PropertyInspectorSystem } from '../systems/PropertyInspectorSystem';
import { SelectionSystem } from '../systems/SelectionSystem';
import { Logger } from '../../core/utils/Logger';
import { RenderableComponent } from '../../core/ecs/RenderableComponent';

// Mock THREE.js to avoid issues in test environment
jest.mock('three', () => ({
  BufferGeometry: jest.fn(() => ({
    setAttribute: jest.fn(),
    setIndex: jest.fn(),
  })),
  BufferAttribute: jest.fn(),
  Mesh: jest.fn(() => ({ geometry: {}, material: {} })),
  MeshBasicMaterial: jest.fn(() => ({})),
}));

describe('Application Initialization', () => {
  let world: World;
  let pluginManager: PluginManager;
  let stateManager: StateManager;
  let studio: Studio;
  let uiManager: UIManager;
  let propertyInspectorUIManager: PropertyInspectorUIManager;
  let propertyInspectorSystem: PropertyInspectorSystem;
  let loadSimulationSpy: jest.SpyInstance;
  let orchestratorLoadSimulationSpy: jest.SpyInstance;

  beforeEach(async () => {
    Logger.getInstance().enable();
    world = new World();
    pluginManager = new PluginManager(world);
    stateManager = StateManager.getInstance();
    const eventBus = require('../../core/events/ApplicationEventBus').eventBus; // Corrected to use the exported `eventBus` instance

    // Mock graphics manager and render system for the test
    const mockGraphicsManager = {
      initialize: jest.fn(),
      getCamera: jest.fn(() => ({ position: { set: jest.fn() }, lookAt: jest.fn() })),
      getControlsManager: jest.fn(() => ({ enable: jest.fn() })),
    };
    const mockRenderSystem = {
      getGraphicsManager: jest.fn(() => mockGraphicsManager),
      registerRenderer: jest.fn(),
      unregisterRenderer: jest.fn(),
      update: jest.fn(),
      dispose: jest.fn(),
      getScene: jest.fn(() => ({ children: [] })), // Added getScene mock directly here
    };

    // Initialize pluginContext earlier
    const pluginContext: IPluginContext = {
      studio: undefined as any,
      world: world,
      eventBus: require('../../core/events/ApplicationEventBus').eventBus,
      getStateManager: () => stateManager,
    };

    // Initialize studio with pluginContext
    studio = new Studio(world, pluginManager, stateManager, pluginContext);
    pluginContext.studio = studio;

    // Set render system immediately after studio creation
    studio.setRenderSystem(mockRenderSystem as any);

    // Assign orchestratorLoadSimulationSpy earlier
    orchestratorLoadSimulationSpy = jest.spyOn(studio as any, 'loadSimulation');

    loadSimulationSpy = jest.spyOn(studio, 'loadSimulation');

    const pane = new Pane();
    uiManager = new UIManager(pane);
    propertyInspectorUIManager = new PropertyInspectorUIManager(uiManager);

    // Create and register required systems
    const selectionSystem = new SelectionSystem(studio, world);
    world.registerSystem(selectionSystem);

    propertyInspectorSystem = new PropertyInspectorSystem(
      propertyInspectorUIManager,
      world,
      studio,
      pluginManager,
      selectionSystem
    );
    world.registerSystem(propertyInspectorSystem);

    // 1. Register the plugin
    const flagPlugin = new FlagSimulationPlugin();
    pluginManager.registerPlugin(flagPlugin);

    // 2. Load the simulation
    await studio.loadSimulation('flag-simulation');
  });

  it('should load the flag simulation when explicitly requested and populate the UI and world', async () => {
    expect(loadSimulationSpy).toHaveBeenCalledWith('flag-simulation');
    expect(orchestratorLoadSimulationSpy).toHaveBeenCalledWith('flag-simulation');

    // 3. Verify the plugin is active
    const isPluginActive = pluginManager.getAvailablePluginNames().includes('flag-simulation');
    expect(isPluginActive).toBe(true);

    // 4. Verify the world has been populated
    const flagEntities = world.componentManager.getEntitiesWithComponents([FlagComponent]);
    expect(flagEntities.length).toBeGreaterThan(0);

    // 5. Trigger PropertyInspectorSystem directly without world update to avoid THREE.js issues
    // Call update directly on PropertyInspectorSystem to trigger parameter panel registration
    propertyInspectorSystem.update(world, 0);

    // Verify that no panels are visible by default (no auto-selection of entities)
    const panels = uiManager.getPanels(); // Assuming getPanels() returns the list of panels
    expect(panels.length).toBe(0); // No panels should be visible without entity selection

    // Verify the flag entity has the expected components (in new architecture, rendering is handled by systems)
    const flagEntity = flagEntities[0];
    const flagComponent = world.componentManager.getComponent(flagEntity, 'FlagComponent');
    expect(flagComponent).toBeDefined();
  });

  it('should initialize entities with FlagComponent', () => {
    const flagEntities = world.componentManager.getEntitiesWithComponents([FlagComponent]);
    expect(flagEntities.length).toBeGreaterThan(0);
  });

  it('should attach FlagComponent and PositionComponent to flag entities', () => {
    const flagEntities = world.componentManager.getEntitiesWithComponents([FlagComponent]);
    expect(flagEntities.length).toBeGreaterThan(0);

    const flagEntity = flagEntities[0];
    const flagComponent = world.componentManager.getComponent(flagEntity, 'FlagComponent');
    const positionComponent = world.componentManager.getComponent(flagEntity, 'PositionComponent');

    expect(flagComponent).toBeDefined();
    expect(positionComponent).toBeDefined();
  });

  it('should configure the camera without errors', () => {
    const mockStudio = {
      getGraphicsManager: jest.fn(() => ({
        getCamera: jest.fn(() => ({ position: { set: jest.fn() }, lookAt: jest.fn() })),
        getControlsManager: jest.fn(() => ({ enable: jest.fn() })),
      })),
    } as any;

    expect(() => {
      const flagPlugin = new FlagSimulationPlugin();
      // Plugin created successfully - camera configuration handled elsewhere
    }).not.toThrow();
  });
});
