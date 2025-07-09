import { World } from "../../core/ecs/World";
import { IComponent } from "../../core/ecs/IComponent";
import { SerializedScene, StudioEntity } from "../types";
import {
  saveToFile,
  loadFromFile,
  encodeBase64,
  decodeBase64,
  hasOwnProperty
} from "../utils/StudioUtils";

export class SceneSerializer {
  /**
   * Serializes the world to a JSON string
   * @param world The world to serialize
   * @returns A JSON string representing the serialized world
   */
  public serialize(world: World): string {
    const serializedEntities: StudioEntity[] = [];

    // Iterate through all entities and their components
    // This is a simplified serialization. A more robust solution would handle component types and their specific data structures.
    for (const entityId of world.entityManager.getAllEntities()) {
      const components: { [key: string]: IComponent } = {};
      const entityComponents =
        world.componentManager.getAllComponentsForEntity(entityId);
      for (const componentName in entityComponents) {
        if (hasOwnProperty(entityComponents, componentName)) {
          components[componentName] = entityComponents[componentName];
        }
      }
      serializedEntities.push({ entityId, components });
    }

    return JSON.stringify({ entities: serializedEntities }, null, 2);
  }

  /**
   * Deserializes a JSON string into the world
   * @param world The world to deserialize into
   * @param serializedScene A JSON string representing the serialized world
   */
  public deserialize(world: World, serializedScene: string): void {
    const sceneData = JSON.parse(serializedScene) as SerializedScene;

    // Clear existing entities in the world
    world.entityManager.clear();
    world.componentManager.clear();

    for (const entityData of sceneData.entities) {
      const entityId = world.entityManager.createEntity(entityData.entityId);
      for (const componentName in entityData.components) {
        if (hasOwnProperty(entityData.components, componentName)) {
          const componentConstructor = world.componentManager
            .getComponentConstructors()
            .get(componentName);
          if (componentConstructor) {
            const componentInstance = new componentConstructor();
            // Fix: Only assign once
            Object.assign(
              componentInstance,
              entityData.components[componentName]
            );
            world.componentManager.addComponent(
              entityId,
              componentName,
              componentInstance
            );
          } else {
            console.warn(
              `Unknown component type during deserialization: ${componentName}`
            );
          }
        }
      }
    }
  }

  /**
   * Saves the world to a file
   * @param world The world to save
   * @param filename The name of the file
   */
  public saveToFile(world: World, filename = "scene.json"): void {
    const serializedData = this.serialize(world);
    saveToFile(serializedData, filename);
  }

  /**
   * Loads the world from a file
   * @param world The world to load into
   * @returns A promise that resolves when the world is loaded
   */
  public loadFromFile(world: World): Promise<void> {
    return loadFromFile().then((data) => {
      this.deserialize(world, data);
    });
  }

  /**
   * Serializes the world to a URL-safe string
   * @param world The world to serialize
   * @returns A URL-safe string representing the serialized world
   */
  public serializeToUrl(world: World): string {
    const serializedData = this.serialize(world);
    return encodeBase64(serializedData);
  }

  /**
   * Deserializes a URL-safe string into the world
   * @param world The world to deserialize into
   * @param encodedData A URL-safe string representing the serialized world
   */
  public deserializeFromUrl(world: World, encodedData: string): void {
    const decodedData = decodeBase64(encodedData);
    this.deserialize(world, decodedData);
  }
}
