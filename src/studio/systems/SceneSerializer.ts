import {World} from '../../core/ecs/World';
import {IComponent} from '../../core/ecs/IComponent';

export class SceneSerializer {
  public serialize(world: World): string {
    const serializedEntities = Array.from(
      world.entityManager.getAllEntities(),
    ).map((entityId: number) => {
      const components =
        world.componentManager.getAllComponentsForEntity(entityId);
      return {
        entityId,
        components,
      };
    });

    return JSON.stringify({entities: serializedEntities}, null, 2);
  }

  public deserialize(world: World, serializedScene: string): void {
    const sceneData = JSON.parse(serializedScene);

    world.entityManager.clear();
    world.componentManager.clear();

    sceneData.entities.forEach((entityData: any) => {
      const entityId = world.entityManager.createEntity(entityData.entityId);
      Object.entries(entityData.components).forEach(([name, component]) => {
        world.componentManager.addComponent(
          entityId,
          name,
          component as IComponent<unknown>,
        );
      });
    });
  }

  public saveToFile(world: World, filename = 'scene.json'): void {
    const serializedData = this.serialize(world);
    const blob = new Blob([serializedData], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  public loadFromFile(world: World): Promise<void> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json';

      input.onchange = (event: Event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = e => {
            try {
              this.deserialize(world, e.target?.result as string);
              resolve();
            } catch (error) {
              reject(error);
            }
          };
          reader.readAsText(file);
        } else {
          reject(new Error('No file selected'));
        }
      };

      input.click();
    });
  }

  // Simplified URL parameter handling - for demonstration purposes
  public serializeToUrl(world: World): string {
    const serializedData = this.serialize(world);
    return btoa(serializedData); // Base64 encode
  }

  public deserializeFromUrl(world: World, encodedData: string): void {
    const decodedData = atob(encodedData); // Base64 decode
    this.deserialize(world, decodedData);
  }
}
