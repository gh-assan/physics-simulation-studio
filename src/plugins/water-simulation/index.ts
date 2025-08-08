import { ISimulationPlugin } from "@core/plugin/ISimulationPlugin";
import { IWorld } from "@core/ecs/IWorld";
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
import { System } from "../../core/ecs/System";

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

  register(world: IWorld, studio?: any): void {
    // Register components using IWorld interface
    world.registerComponent(WaterBodyComponent);
    world.registerComponent(WaterDropletComponent);

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

  initializeEntities(world: IWorld): void {
    // Create sample water droplet entities
    const droplet1 = world.createEntity();
    world.addComponent(
      droplet1,
      PositionComponent.type,
      new PositionComponent(0, 10, 0)
    );
    world.addComponent(
      droplet1,
      WaterDropletComponent.type,
      new WaterDropletComponent()
    );
    world.addComponent(
      droplet1,
      SelectableComponent.type,
      new SelectableComponent(false)
    );

    console.log("Water simulation entities initialized.");
  }

  getRenderer(): WaterRenderer {
    return this.waterRenderer;
  }

  getSystems(studio: IStudio): System[] {
    return [this.waterSystem];
  }
}

// Export plugin instance for auto-discovery
export default new WaterSimulationPlugin();
