import { ISimulationPlugin } from "@core/plugin/ISimulationPlugin";
import { World } from "@core/ecs/World";
import { WaterBodyComponent, WaterDropletComponent } from "./WaterComponents";
import { WaterSystem } from "./WaterSystem";
import { WaterRenderer } from "./WaterRenderer";
import { PositionComponent } from "@core/components/PositionComponent";
import { RenderableComponent } from "../../core/ecs/RenderableComponent";
import { SelectableComponent } from "@core/components/SelectableComponent";
import { RotationComponent } from "../../core/ecs/RotationComponent";
import { ParameterPanelComponent } from "@core/components/ParameterPanelComponent";
import { WaterBodyParameterPanel } from "./WaterBodyParameterPanel";
import { WaterDropletParameterPanel } from "./WaterDropletParameterPanel";
import { Vector3 } from "./utils/Vector3"; // Add this import
import { waterBodyComponentProperties, waterDropletComponentProperties } from "./waterComponentProperties";
import { registerComponentProperties } from "../../studio/utils/ComponentPropertyRegistry";

export { WaterBodyComponent, WaterDropletComponent } from "./WaterComponents";
export { WaterBodyParameterPanel } from "./WaterBodyParameterPanel";
export { WaterDropletParameterPanel } from "./WaterDropletParameterPanel";

export function registerWaterComponentProperties() {
  registerComponentProperties("WaterBodyComponent", waterBodyComponentProperties);
  registerComponentProperties("WaterDropletComponent", waterDropletComponentProperties);
}

export class WaterSimulationPlugin implements ISimulationPlugin {
  public getName(): string {
    return "water-simulation";
  }

  public getDependencies(): string[] {
    return [];
  }

  private waterSystem: WaterSystem;
  private waterRenderer: WaterRenderer;
  private _parameterPanels: ParameterPanelComponent[] = [];

  constructor() {
    this.waterSystem = new WaterSystem();
    this.waterRenderer = new WaterRenderer();
  }

  public getParameterPanels(): ParameterPanelComponent[] {
    return this._parameterPanels;
  }

  register(world: World, studio?: any): void {
    // Register components
    world.componentManager.registerComponent(WaterBodyComponent);
    world.componentManager.registerComponent(WaterDropletComponent);
    // ParameterPanelComponent registration is handled by the core system
    // world.componentManager.registerComponent(
    //   ParameterPanelComponent.type,
    //   ParameterPanelComponent
    // );

    // Register systems
    world.systemManager.registerSystem(this.waterSystem);

    try {
      // Create parameter panels
      const waterBodyPanel = new WaterBodyParameterPanel();
      const waterDropletPanel = new WaterDropletParameterPanel();

      // Store them in the parameter panels array
      this._parameterPanels.push(waterBodyPanel);
      this._parameterPanels.push(waterDropletPanel);

      // Create and register parameter panel entities if ParameterPanelComponent is registered
      if (
        world.componentManager
          .getComponentConstructors()
          .has(ParameterPanelComponent.type)
      ) {
        const waterBodyPanelEntity = world.entityManager.createEntity();
        world.componentManager.addComponent(
          waterBodyPanelEntity,
          ParameterPanelComponent.type,
          waterBodyPanel
        );

        const waterDropletPanelEntity = world.entityManager.createEntity();
        world.componentManager.addComponent(
          waterDropletPanelEntity,
          ParameterPanelComponent.type,
          waterDropletPanel
        );

        console.log(
          "Water Simulation Plugin registered with parameter panels."
        );
      } else {
        console.log(
          "Water Simulation Plugin registered without parameter panels (ParameterPanelComponent not registered)."
        );
      }
    } catch (error) {
      console.warn(
        "Failed to register parameter panels, but simulation will continue:",
        error
      );
    }
  }

  unregister(): void {
    // Systems are removed by the PluginManager when the plugin is deactivated

    // Clear parameter panels
    this._parameterPanels = [];

    console.log("Water Simulation Plugin unregistered.");
  }

  initializeEntities(world: World): void {
    // Create the water body
    const waterBody = world.entityManager.createEntity();
    world.componentManager.addComponent(
      waterBody,
      PositionComponent.type,
      new PositionComponent(0, 0, 0)
    );
    world.componentManager.addComponent(
      waterBody,
      WaterBodyComponent.type,
      new WaterBodyComponent()
    );
    world.componentManager.addComponent(
      waterBody,
      RenderableComponent.name,
      new RenderableComponent("plane", 0x0000ff)
    );
    world.componentManager.addComponent(
      waterBody,
      SelectableComponent.type,
      new SelectableComponent()
    );
    world.componentManager.addComponent(
      waterBody,
      RotationComponent.name,
      new RotationComponent(0, 0, 0, 1)
    ); // Add RotationComponent

    // Create a water droplet
    const droplet = world.entityManager.createEntity();
    console.log("[WaterSimulationPlugin] Created droplet entity:", droplet);
    world.componentManager.addComponent(
      droplet,
      PositionComponent.type,
      new PositionComponent(0, 5, 0)
    );
    const initialDropletComponent = new WaterDropletComponent(new Vector3(0, 5, 0));
    world.componentManager.addComponent(
      droplet,
      WaterDropletComponent.type,
      initialDropletComponent
    );
    console.log(
      "[WaterSimulationPlugin] Initial DropletComponent properties:",
      initialDropletComponent
    );

    world.componentManager.addComponent(
      droplet,
      RenderableComponent.name,
      new RenderableComponent("sphere", 0x87ceeb)
    );
    world.componentManager.addComponent(
      droplet,
      SelectableComponent.type,
      new SelectableComponent(true)
    );
    world.componentManager.addComponent(
      droplet,
      RotationComponent.name,
      new RotationComponent(0, 0, 0, 1) // Add RotationComponent
    );
  }

  getRenderer(): WaterRenderer {
    return this.waterRenderer;
  }
}
