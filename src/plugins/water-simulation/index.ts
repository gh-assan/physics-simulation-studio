import { ISimulationPlugin } from "@core/plugin/ISimulationPlugin";
import { World } from "@core/ecs/World";
import { WaterBodyComponent, WaterDropletComponent } from "./WaterComponents";
import { WaterSystem } from "./WaterSystem";
import { WaterRenderer } from "./WaterRenderer";
import { PositionComponent } from "@core/components/PositionComponent";
import { RenderableComponent } from "@core/components/RenderableComponent";
import { SelectableComponent } from "@core/components/SelectableComponent";
import { RotationComponent } from "@core/components/RotationComponent"; // Import RotationComponent
import { ParameterPanelComponent } from "@core/components/ParameterPanelComponent";
import { WaterBodyParameterPanel } from "./WaterBodyParameterPanel";
import { WaterDropletParameterPanel } from "./WaterDropletParameterPanel";

export { WaterBodyComponent, WaterDropletComponent } from "./WaterComponents";
export { WaterBodyParameterPanel } from "./WaterBodyParameterPanel";
export { WaterDropletParameterPanel } from "./WaterDropletParameterPanel";

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

  register(world: World): void {
    // Register components
    world.componentManager.registerComponent(
      WaterBodyComponent.type,
      WaterBodyComponent
    );
    world.componentManager.registerComponent(
      WaterDropletComponent.type,
      WaterDropletComponent
    );
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
      if (world.componentManager.getComponentConstructors().has(ParameterPanelComponent.type)) {
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

        console.log("Water Simulation Plugin registered with parameter panels.");
      } else {
        console.log("Water Simulation Plugin registered without parameter panels (ParameterPanelComponent not registered).");
      }
    } catch (error) {
      console.warn("Failed to register parameter panels, but simulation will continue:", error);
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
      RenderableComponent.type,
      new RenderableComponent("plane", "blue")
    );
    world.componentManager.addComponent(
      waterBody,
      SelectableComponent.type,
      new SelectableComponent()
    );
    world.componentManager.addComponent(
      waterBody,
      RotationComponent.type,
      new RotationComponent(0, 0, 0, 1)
    ); // Add RotationComponent

    // Create a water droplet
    const droplet = world.entityManager.createEntity();
    world.componentManager.addComponent(
      droplet,
      PositionComponent.type,
      new PositionComponent(0, 10, 0)
    );
    world.componentManager.addComponent(
      droplet,
      WaterDropletComponent.type,
      new WaterDropletComponent()
    );
    world.componentManager.addComponent(
      droplet,
      RenderableComponent.type,
      new RenderableComponent("sphere", "lightblue")
    );
    world.componentManager.addComponent(
      droplet,
      SelectableComponent.type,
      new SelectableComponent(true)
    );
    world.componentManager.addComponent(
      droplet,
      RotationComponent.type,
      new RotationComponent(0, 0, 0, 1)
    ); // Add RotationComponent
  }

  getRenderer(): WaterRenderer {
    return this.waterRenderer;
  }
}
