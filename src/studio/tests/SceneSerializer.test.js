"use strict";
/**
 * @jest-environment jsdom
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const SceneSerializer_1 = require("../systems/SceneSerializer");
const ecs_1 = require("@core/ecs");
const components_1 = require("@core/components");
const locationHelper_1 = require("../helpers/locationHelper");
const THREE = __importStar(require("three"));
// Mock URL.createObjectURL and revokeObjectURL for JSDOM environment
Object.defineProperty(window, 'URL', {
    writable: true,
    value: {
        createObjectURL: jest.fn(() => 'blob:mocked-url'),
        revokeObjectURL: jest.fn(),
    },
});
describe('SceneSerializer', () => {
    let serializer;
    let world;
    beforeAll(() => {
        serializer = new SceneSerializer_1.SceneSerializer();
        world = new ecs_1.World();
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
        (0, locationHelper_1.getLocation)().href = '';
    });
    afterAll(() => {
        // No need to restore locationSpy as window.location is mocked using Object.defineProperty
    });
    it('should serialize a dummy world state to JSON', () => {
        const entity = world.entityManager.createEntity();
        world.componentManager.addComponent(entity, components_1.PositionComponent.name, new components_1.PositionComponent(1, 2, 3));
        world.componentManager.addComponent(entity, components_1.RenderableComponent.name, new components_1.RenderableComponent(new THREE.Mesh()));
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
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
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
        const deserializeSpy = jest.spyOn(serializer, 'deserialize').mockImplementation(() => { });
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
        serializer.loadFromUrl(world);
        expect(global.atob).toHaveBeenCalledWith(encoded);
        expect(deserializeSpy).toHaveBeenCalledWith(world, mockJson);
        expect(consoleSpy).toHaveBeenCalledWith('Scene loaded from URL.');
        deserializeSpy.mockRestore();
        consoleSpy.mockRestore();
    });
    it('should save scene to file', () => __awaiter(void 0, void 0, void 0, function* () {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
        yield serializer.saveToFile(world, 'test-scene.json');
        expect(window.showSaveFilePicker).toHaveBeenCalledTimes(1);
        expect(consoleSpy).toHaveBeenCalledWith('Scene saved to test-scene.json');
        consoleSpy.mockRestore();
    }));
    it('should load scene from file', () => __awaiter(void 0, void 0, void 0, function* () {
        const deserializeSpy = jest.spyOn(serializer, 'deserialize').mockImplementation(() => { });
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
        yield serializer.loadFromFile(world, new File([], 'mock.json'));
        expect(deserializeSpy).toHaveBeenCalledWith(world, expect.any(String));
        expect(consoleSpy).toHaveBeenCalledWith('Scene loaded from file.');
        deserializeSpy.mockRestore();
        consoleSpy.mockRestore();
    }));
});
