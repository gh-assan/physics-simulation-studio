import { ISimulationPlugin } from "@core/plugin/ISimulationPlugin";
import { World } from "@core/ecs/World";
import { WaterBodyComponent, WaterDropletComponent } from "./WaterComponents";
import { WaterSystem } from "./WaterSystem";
import { WaterRenderer } from "./WaterRenderer";
import { PositionComponent } from "@core/components/PositionComponent";
import { RenderableComponent } from "../../core/ecs/RenderableComponent";
import { SelectableComponent } from "@core/components/SelectableComponent";
import { RotationComponent } from "../../core/ecs/RotationComponent";
import { Vector3 } from "./utils/Vector3";
import { waterPluginParameterSchema } from "./WaterPluginParameters";
import { PluginParameterManager } from "../../core/ui/PluginParameterManager";
import { IStudio } from "../../studio/IStudio";
import { ISystem } from "../../core/ecs/ISystem";

export { WaterBodyComponent, WaterDropletComponent } from "./WaterComponents";

export class WaterSimulationPlugin implements ISimulationPlugin {
  public getName(): string {
    return "water-simulation";
  }

  public getDependencies(): string[] {
    return [];
  }

  private waterSystem: WaterSystem;
  private waterRenderer: WaterRenderer;
  private _parameterManager: PluginParameterManager | null = null;

  constructor() {
    this.waterSystem = new WaterSystem();
    this.waterRenderer = new WaterRenderer();
  }

  // Clean parameter system - no more parameter panel classes!
  getParameterSchema() {
    return waterPluginParameterSchema;
  }

  // Initialize parameter manager with the UI
  initializeParameterManager(uiRenderer: any): void {
    this._parameterManager = new PluginParameterManager(uiRenderer);
    console.log('✅ Water plugin parameter manager initialized');
  }

  // Register component parameters - called when components are selected
  registerComponentParameters(componentType: string, component: any): void {
    if (!this._parameterManager) return;

    const parameters = waterPluginParameterSchema.components.get(componentType);
    if (parameters) {
      this._parameterManager.registerComponentParameters(
        'water-simulation',
        componentType,
        component,
        parameters
      );
    }
  }

  register(world: World, studio?: any): void {
    // Register components - no more parameter panel boilerplate!
    world.componentManager.registerComponent(WaterBodyComponent);
    world.componentManager.registerComponent(WaterDropletComponent);

    // Register systems
    world.systemManager.registerSystem(this.waterSystem);

    console.log('✅ Water simulation plugin registered - simplified & clean!');
  }

  unregister(): void {
    // Clear parameter manager
    if (this._parameterManager) {
      this._parameterManager.clearAll();
      this._parameterManager = null;
    }

    console.log('✅ Water plugin unregistered');
  }

  initializeEntities(world: World): void {
    // Create sample water droplet entities
    const droplet1 = world.entityManager.createEntity();
    world.componentManager.addComponent(
      droplet1,
      PositionComponent.type,
      new PositionComponent(0, 10, 0)
    );
    world.componentManager.addComponent(
      droplet1,
      WaterDropletComponent.type,
      new WaterDropletComponent()
    );
    world.componentManager.addComponent(
      droplet1,
      SelectableComponent.type,
      new SelectableComponent(false)
    );

    console.log("Water simulation entities initialized.");
  }

  getRenderer(): WaterRenderer {
    return this.waterRenderer;
  }

  getSystems(studio: IStudio): ISystem[] {
    return [this.waterSystem];
  }
}
