/**
 * @jest-environment jsdom
 */

import { SceneSerializer } from '../systems/SceneSerializer';
import { World } from '@core/ecs';
import { PositionComponent, RenderableComponent } from '@core/components';
import { getLocation } from '../helpers/locationHelper';


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
        serializer = new SceneSerializer();
        world = new World();

        // Register components that might be serialized
        world.componentManager.registerComponent('PositionComponent');
        world.componentManager.registerComponent('RenderableComponent');

        global.btoa = jest.fn((str) => Buffer.from(str).toString('base64'));
        global.atob = jest.fn((str) => Buffer.from(str, 'base64').toString('ascii'));

        Object.defineProperty(window, 'showSaveFilePicker', {
            writable: true,
            value: jest.fn(() => Promise.resolve({
                createWritable: jest.fn(() => Promise.resolve({
                    write: jest.fn(() => Promise.resolve()),
                    close: jest.fn(() => Promise.resolve()),
                })),
            })),
        });

        Object.defineProperty(window, 'showOpenFilePicker', {
            writable: true,
            value: jest.fn(() => Promise.resolve([
                {
                    getFile: jest.fn(() => Promise.resolve({
                        text: jest.fn(() => Promise.resolve(JSON.stringify({
                            entities: [{ id: 300, components: [{ type: 'PositionComponent', data: { x: 1, y: 1, z: 1 } }] }]
                        }))),
                    })),
                },
            ])),
        });
    });

    beforeEach(() => {
        // Reset hash for each test
        (getLocation().href as unknown as string) = '';
    });

    afterAll(() => {
        // No need to restore locationSpy as window.location is mocked using Object.defineProperty
    });

    it('should serialize a dummy world state to JSON', () => {
        const entity = world.entityManager.createEntity();
        world.componentManager.addComponent(entity, PositionComponent.name, new PositionComponent(1, 2, 3));
        world.componentManager.addComponent(entity, RenderableComponent.name, new RenderableComponent('box'));

        const json = serializer.serialize(world);
        const parsed = JSON.parse(json);

        expect(parsed).toHaveProperty('entities');
        expect(parsed.entities.length).toBeGreaterThan(0);
        expect(parsed.entities[0].components[0]).toHaveProperty('type', 'PositionComponent');
        expect(parsed.entities[0].components[0]).toHaveProperty('data');
    });

    it('should deserialize a JSON string into the world (simplified)', () => {
        const jsonString = JSON.stringify({
            entities: [
                {
                    id: 100,
                    components: [
                        { type: 'PositionComponent', data: { x: 10, y: 20, z: 30 } },
                    ],
                },
            ],
        });

        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        serializer.deserialize(world, jsonString);
        expect(consoleSpy).not.toHaveBeenCalledWith('Deserializing scene:', expect.any(Object));
        consoleSpy.mockRestore();
    });

    it('should generate a shareable URL', () => {
        const url = serializer.shareViaUrl(world);
        expect(url).toContain('http://localhost/index.html#scene=');
        expect(global.btoa).toHaveBeenCalled();
    });

    it('should load a scene from a URL hash', () => {
        const mockJson = JSON.stringify({
            entities: [
                {
                    id: 200,
                    components: [
                        { type: 'PositionComponent', data: { x: 5, y: 5, z: 5 } },
                    ],
                },
            ],
        });
        const encoded = global.btoa(mockJson);
        window.location.hash = `#scene=${encoded}`;
        console.log("Test - window.location.hash before loadFromUrl:", window.location.hash);
        console.log("Test - encoded string:", encoded);

        const deserializeSpy = jest.spyOn(serializer, 'deserialize').mockImplementation(() => {});
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        serializer.loadFromUrl(world);

        expect(global.atob).toHaveBeenCalledWith(encoded);
        expect(deserializeSpy).toHaveBeenCalledWith(world, mockJson);
        expect(consoleSpy).toHaveBeenCalledWith('Scene loaded from URL.');

        deserializeSpy.mockRestore();
        consoleSpy.mockRestore();
    });

    

    it('should save scene to file', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        await serializer.saveToFile(world, 'test-scene.json');
        expect(window.showSaveFilePicker).toHaveBeenCalledTimes(1);
        expect(consoleSpy).toHaveBeenCalledWith('Scene saved to test-scene.json');
        consoleSpy.mockRestore();
    });

    it('should load scene from file', async () => {
        const deserializeSpy = jest.spyOn(serializer, 'deserialize').mockImplementation(() => {});
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        await serializer.loadFromFile(world, new File([], 'mock.json'));

        expect(deserializeSpy).toHaveBeenCalledWith(world, expect.any(String));
        expect(consoleSpy).toHaveBeenCalledWith('Scene loaded from file.');

        deserializeSpy.mockRestore();
        consoleSpy.mockRestore();
    });
});