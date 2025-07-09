/**
 * @jest-environment jsdom
 */

import {SceneSerializer} from '../systems/SceneSerializer';
import {World} from '@core/ecs';
import {
  PositionComponent,
  RenderableComponent,
  RotationComponent,
  SelectableComponent,
} from '@core/components';

// Mock URL.createObjectURL and revokeObjectURL for JSDOM environment
Object.defineProperty(window, 'URL', {
  writable: true,
  value: {
    createObjectURL: jest.fn(() => 'blob:mocked-url'),
    revokeObjectURL: jest.fn(),
  },
});

describe('SceneSerializer', () => {
  let serializer: SceneSerializer;
  let world: World;

  beforeAll(() => {
    // Mock File System Access API
    Object.defineProperty(window, 'showSaveFilePicker', {
      writable: true,
      value: jest.fn(),
    });
    Object.defineProperty(window, 'showOpenFilePicker', {
      writable: true,
      value: jest.fn(),
    });

    serializer = new SceneSerializer();
    world = new World();

    // Register all core components that might be serialized
    world.componentManager.registerComponent(
      PositionComponent.name,
      PositionComponent,
    );
    world.componentManager.registerComponent(
      RenderableComponent.name,
      RenderableComponent,
    );
    world.componentManager.registerComponent(
      RotationComponent.name,
      RotationComponent,
    );
    world.componentManager.registerComponent(
      SelectableComponent.name,
      SelectableComponent,
    );

    global.btoa = jest.fn(str => Buffer.from(str).toString('base64'));
    global.atob = jest.fn(str => Buffer.from(str, 'base64').toString('ascii'));
  });

  beforeEach(() => {
    // Reset hash for each test
    world = new World(); // Re-initialize world for each test to ensure clean state
    world.componentManager.registerComponent(
      PositionComponent.name,
      PositionComponent,
    );
    world.componentManager.registerComponent(
      RenderableComponent.name,
      RenderableComponent,
    );
    world.componentManager.registerComponent(
      RotationComponent.name,
      RotationComponent,
    );
    world.componentManager.registerComponent(
      SelectableComponent.name,
      SelectableComponent,
    );
    window.location.hash = '';

    // Move file picker mocks here for each test
    Object.defineProperty(window, 'showSaveFilePicker', {
      writable: true,
      value: jest.fn(() =>
        Promise.resolve({
          createWritable: jest.fn(() =>
            Promise.resolve({
              write: jest.fn(() => Promise.resolve()),
              close: jest.fn(() => Promise.resolve()),
            }),
          ),
        }),
      ),
    });
    Object.defineProperty(window, 'showOpenFilePicker', {
      writable: true,
      value: jest.fn(() =>
        Promise.resolve([
          {
            getFile: jest.fn(() =>
              Promise.resolve({
                text: jest.fn(() =>
                  Promise.resolve(
                    JSON.stringify({
                      entities: [
                        {
                          id: 300,
                          components: {PositionComponent: {x: 1, y: 1, z: 1}},
                        },
                      ],
                    }),
                  ),
                ),
              }),
            ),
          },
        ]),
      ),
    });
  });

  afterAll(() => {
    // No need to restore locationSpy as window.location is mocked using Object.defineProperty
  });

  it('should serialize a dummy world state to JSON', () => {
    const entity = world.entityManager.createEntity();
    world.componentManager.addComponent(
      entity,
      PositionComponent.name,
      new PositionComponent(1, 2, 3),
    );
    world.componentManager.addComponent(
      entity,
      RenderableComponent.name,
      new RenderableComponent('box', '#ffffff'),
    );

    const json = serializer.serialize(world);
    const parsed = JSON.parse(json);

    expect(parsed).toHaveProperty('entities');
    expect(parsed.entities.length).toBeGreaterThan(0);
    expect(parsed.entities[0].components.PositionComponent).toHaveProperty(
      'x',
      1,
    );
    expect(parsed.entities[0].components.RenderableComponent).toHaveProperty(
      'geometry',
      'box',
    );
  });

  it('should deserialize a JSON string into the world', () => {
    // Register components on the current world instance right before deserialization
    world.componentManager.registerComponent(
      PositionComponent.name,
      PositionComponent,
    );
    world.componentManager.registerComponent(
      RenderableComponent.name,
      RenderableComponent,
    );
    world.componentManager.registerComponent(
      RotationComponent.name,
      RotationComponent,
    );
    world.componentManager.registerComponent(
      SelectableComponent.name,
      SelectableComponent,
    );

    // Debug: print registered component keys
    // eslint-disable-next-line no-console
    console.log(
      'Registered components:',
      Array.from(world.componentManager.getComponentConstructors().keys()),
    );
    const jsonString = JSON.stringify({
      entities: [
        {
          id: 100,
          components: {
            PositionComponent: {x: 10, y: 20, z: 30},
          },
        },
      ],
    });

    // Debug: print JSON string
    // eslint-disable-next-line no-console
    console.log('Deserializing JSON:', jsonString);

    serializer.deserialize(world, jsonString);

    const entity = world.entityManager.getAllEntities().values().next().value;
    if (entity === undefined) {
      fail('Entity was not created during deserialization.');
    }
    const position = world.componentManager.getComponent<PositionComponent>(
      entity,
      PositionComponent.name,
    );

    // Debug: print the deserialized position
    // eslint-disable-next-line no-console
    console.log('Deserialized position:', position);

    expect(position).toBeDefined();
    expect(position?.x).toBe(10);
    expect(position?.y).toBe(20);
    expect(position?.z).toBe(30);
  });

  // Add clone() to all test component classes as needed for IComponent interface
  it('should clone PositionComponent correctly', () => {
    const original = new PositionComponent(1, 2, 3);
    const clone = original.clone();

    expect(clone).toEqual(original);
    expect(clone).not.toBe(original); // Ensure it's a different instance
  });

  it('should clone RenderableComponent correctly', () => {
    const original = new RenderableComponent('box', '#ffffff');
    const clone = original.clone();

    expect(clone).toEqual(original);
    expect(clone).not.toBe(original); // Ensure it's a different instance
  });

  it('should clone RotationComponent correctly', () => {
    const original = new RotationComponent(0, 0, 0, 1);
    const clone = original.clone();

    expect(clone).toEqual(original);
    expect(clone).not.toBe(original); // Ensure it's a different instance
  });

  it('should clone SelectableComponent correctly', () => {
    const original = new SelectableComponent(true);
    const clone = original.clone();

    expect(clone).toEqual(original);
    expect(clone).not.toBe(original); // Ensure it's a different instance
  });
});
