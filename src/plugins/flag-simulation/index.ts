import { IStudio } from "../../studio/IStudio";
import { World } from "../../core/ecs/World";
import { ISimulationPlugin } from "../../core/plugin/ISimulationPlugin";
import { FlagComponent } from "./FlagComponent";
import { PoleComponent } from "./PoleComponent"; // Add this import
import { FlagSystem } from "./FlagSystem";
import { FlagRenderSystem } from "./FlagRenderSystem";
import { PositionComponent } from "../../core/components/PositionComponent";
import { RenderableComponent } from "../../core/ecs/RenderableComponent";
import { SelectableComponent } from "../../core/components/SelectableComponent";
import { RotationComponent } from "../../core/components/RotationComponent";
import { FlagPhysicsInitializer } from "./utils/FlagPhysicsInitializer";
import { FlagParameterPanel } from "./FlagParameterPanel";
import { ParameterPanelComponent } from "../../core/components/ParameterPanelComponent";
import * as THREE from "three";
import { flagComponentProperties } from "./flagComponentProperties";
import { ComponentPropertyRegistry } from "../../studio/utils/ComponentPropertyRegistry";
import { System } from "../../core/ecs/System";
import { Logger } from "../../core/utils/Logger";
import { ThreeGraphicsManager } from "../../studio/graphics/ThreeGraphicsManager";

ComponentPropertyRegistry.getInstance().registerComponentProperties("flag-simulation", flagComponentProperties);

export class FlagSimulationPlugin implements ISimulationPlugin {
  private _flagSystem: FlagSystem | null = null;
  private _parameterPanels: ParameterPanelComponent[] = [];

  getName(): string {
    return "flag-simulation";
  }
  getDependencies(): string[] {
    return [];
  }
  getParameterPanels(): ParameterPanelComponent[] {
    return this._parameterPanels;
  }
  getSystems(studio: IStudio): System[] {
            return [new FlagSystem(), new FlagRenderSystem(studio.getGraphicsManager() as ThreeGraphicsManager)];
  }

  register(world: World): void {
    // Register components
    world.componentManager.registerComponent(FlagComponent);
    world.componentManager.registerComponent(PoleComponent);
    world.componentManager.registerComponent(FlagParameterPanel);

    try {
      // Create parameter panel
      const flagParameterPanel = new FlagParameterPanel(world);

      // Store it in the parameter panels array
      this._parameterPanels.push(flagParameterPanel);

      // Create and register parameter panel entity if ParameterPanelComponent is registered
      if (
        world.componentManager
          .getComponentConstructors()
          .has(ParameterPanelComponent.type)
      ) {
        const panelEntity = world.entityManager.createEntity();
        world.componentManager.addComponent(
          panelEntity,
          ParameterPanelComponent.type,
          flagParameterPanel
        );

        Logger.getInstance().log("FlagSimulationPlugin registered with parameter panel.");
      } else {
        Logger.getInstance().log(
          "FlagSimulationPlugin registered without parameter panel (ParameterPanelComponent not registered)."
        );
      }
    } catch (error) {
      Logger.getInstance().warn(
        "Failed to register parameter panel, but simulation will continue:",
        error
      );
    }
  }
  unregister(): void {
    if (this._flagSystem) {
      this._flagSystem.unregister();
      this._flagSystem = null;
    }

    // Clear parameter panels
    this._parameterPanels = [];
  }

  private configureCamera(studio: IStudio): void {
    const graphicsManager = studio.getGraphicsManager() as ThreeGraphicsManager;
    const camera = graphicsManager.getCamera();
    camera.position.set(0, 30, 60); // Set a natural, angled view
    camera.lookAt(0, 0, 0); // Focus on the origin
    graphicsManager.getControlsManager().enable(); // Enable camera controls
  }

  initializeEntities(world: World): void {
    const studio = (world as any).studio as IStudio; // Assuming studio is accessible via world
    this.configureCamera(studio);

    // Create a default pole entity
    const poleEntity = world.entityManager.createEntity();
    world.componentManager.addComponent(
      poleEntity,
      PositionComponent.type,
      new PositionComponent(0, 0, 0) // Pole at origin
    );
    world.componentManager.addComponent(
      poleEntity,
      PoleComponent.type,
      new PoleComponent({ height: 20, radius: 0.2 }) // Default pole properties
    );

    // Create flag entity
    const flagEntity = world.entityManager.createEntity();
    world.componentManager.addComponent(
      flagEntity,
      PositionComponent.type,
      new PositionComponent(0, 10, 0) // Adjusted flag position to ensure visibility
    );
    // Use a bright red color for better visibility against the default background
    world.componentManager.addComponent(
      flagEntity,
      RenderableComponent.name,
      new RenderableComponent("plane", 0xff0000)
    );
    // Create a larger flag with more segments for better visibility
    const initialFlagComponent = new FlagComponent(10, 6, 10, 6, 0.1, 0.5, 0.05, "", 0, { x: 1, y: 0, z: 0 }, { x: 0, y: -9.81, z: 0 }, null, "left");
    world.componentManager.addComponent(
      flagEntity,
      "FlagComponent",
      initialFlagComponent
    );

    world.componentManager.addComponent(
      flagEntity,
      SelectableComponent.type,
      new SelectableComponent(true)
    );
    // Rotate the flag 90 degrees around the X axis to make it face the camera
    const rotationQuat = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(1, 0, 0),
      Math.PI / 2
    );
    world.componentManager.addComponent(
      flagEntity,
      RotationComponent.type,
      new RotationComponent(
        rotationQuat.x,
        rotationQuat.y,
        rotationQuat.z,
        rotationQuat.w
      )
    );

    // Initialize the flag physics (points and springs) immediately
    const flagComponent = world.componentManager.getComponent(
      flagEntity,
      FlagComponent.type
    ) as FlagComponent;
    const positionComponent = world.componentManager.getComponent(
      flagEntity,
      PositionComponent.type
    ) as PositionComponent;

    if (flagComponent && positionComponent) {
      FlagPhysicsInitializer.initializeFlag(
        flagComponent,
        positionComponent,
        world
      );
    }
  }
}
