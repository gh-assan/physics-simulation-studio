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

  constructor() {
    this.waterSystem = new WaterSystem();
    this.waterRenderer = new WaterRenderer();
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
    world.componentManager.registerComponent(
      ParameterPanelComponent.type,
      ParameterPanelComponent
    );

    // Register systems
    world.systemManager.registerSystem(this.waterSystem);

    // Create and register parameter panel entities
    const waterBodyPanelEntity = world.entityManager.createEntity();
    world.componentManager.addComponent(
      waterBodyPanelEntity,
      ParameterPanelComponent.type,
      new WaterBodyParameterPanel()
    );

    const waterDropletPanelEntity = world.entityManager.createEntity();
    world.componentManager.addComponent(
      waterDropletPanelEntity,
      ParameterPanelComponent.type,
      new WaterDropletParameterPanel()
    );

    console.log("Water Simulation Plugin registered with parameter panels.");
  }

  unregister(): void {
    // Systems are removed by the PluginManager when the plugin is deactivated
    console.log("Water Simulation Plugin unregistered.");
  }

  initializeEntities(world: World): void {
    // Create the water body
    const waterBody = world.entityManager.createEntity();
    world.componentManager.addComponent(
      waterBody,
      PositionComponent.name,
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
      new RenderableComponent("plane", "blue")
    );
    world.componentManager.addComponent(
      waterBody,
      SelectableComponent.name,
      new SelectableComponent()
    );
    world.componentManager.addComponent(
      waterBody,
      RotationComponent.name,
      new RotationComponent(0, 0, 0, 1)
    ); // Add RotationComponent

    // Create a water droplet
    const droplet = world.entityManager.createEntity();
    world.componentManager.addComponent(
      droplet,
      PositionComponent.name,
      new PositionComponent(0, 10, 0)
    );
    world.componentManager.addComponent(
      droplet,
      WaterDropletComponent.type,
      new WaterDropletComponent()
    );
    world.componentManager.addComponent(
      droplet,
      RenderableComponent.name,
      new RenderableComponent("sphere", "lightblue")
    );
    world.componentManager.addComponent(
      droplet,
      SelectableComponent.name,
      new SelectableComponent()
    );
    world.componentManager.addComponent(
      droplet,
      RotationComponent.name,
      new RotationComponent(0, 0, 0, 1)
    ); // Add RotationComponent
  }

  getRenderer(): WaterRenderer {
    return this.waterRenderer;
  }
}
