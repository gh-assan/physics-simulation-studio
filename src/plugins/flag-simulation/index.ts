import { IStudio } from "../../studio/IStudio";
import { World } from "../../core/ecs/World";
import { IWorld } from "../../core/ecs/IWorld";
import { ISimulationPlugin } from "../../core/plugin/ISimulationPlugin";
import { FlagComponent } from "./FlagComponent";
import { PoleComponent } from "./PoleComponent"; // Add this import
import { FlagSystem } from "./FlagSystem";
import { FlagRenderSystem } from "./FlagRenderSystem";
import { PositionComponent } from "../../core/components/PositionComponent";
import { RenderableComponent } from "../../core/components/RenderableComponent"; // Correct import
import { SelectableComponent } from "../../core/components/SelectableComponent";
import { RotationComponent } from "../../core/components/RotationComponent";
import { FlagPhysicsInitializer } from "./utils/FlagPhysicsInitializer";
import { FlagParameterPanel } from "./FlagParameterPanel";
import { ParameterPanelComponent } from "../../core/components/ParameterPanelComponent";
import * as THREE from "three";
import { flagComponentProperties } from "./flagComponentProperties";
import { ComponentPropertyRegistry } from "../../studio/utils/ComponentPropertyRegistry";
import { System } from "../../core/ecs/System";
import { Logger } from '../../core/utils/Logger';
import { ThreeGraphicsManager } from "../../studio/graphics/ThreeGraphicsManager";

export class FlagSimulationPlugin implements ISimulationPlugin {
  private _flagSystem: FlagSystem | null = null;
  private _parameterPanels: ParameterPanelComponent[] = [];
  private _studio: IStudio | null = null;

  getName(): string {
    return "flag-simulation";
  }
  getDependencies(): string[] {
    return [];
  }
  getParameterPanels(world: IWorld): ParameterPanelComponent[] {
    return this._parameterPanels;
  }
  getSystems(studio: IStudio): System[] {
    // Store studio reference for later use in initializeEntities
    this._studio = studio;
    return [new FlagSystem(), new FlagRenderSystem(studio.getGraphicsManager() as ThreeGraphicsManager)];
  }

  register(world: World): void {
    // Register component properties first
    ComponentPropertyRegistry.getInstance().registerComponentProperties(
      FlagComponent.type,
      flagComponentProperties
    );

    // Register components
    world.componentManager.registerComponent(FlagComponent);
    world.componentManager.registerComponent(PoleComponent);
    world.componentManager.registerComponent(FlagParameterPanel);

    // Register core components needed by this plugin
    world.componentManager.registerComponent(PositionComponent);
    world.componentManager.registerComponent(RenderableComponent);
    world.componentManager.registerComponent(SelectableComponent);
    world.componentManager.registerComponent(RotationComponent);
    // Register ParameterPanelComponent with proper type casting
    world.componentManager.registerComponent(
      ParameterPanelComponent as unknown as new (...args: any[]) => ParameterPanelComponent
    );

    // Ensure FlagComponent and FlagParameterPanel are registered
    world.registerComponent(FlagComponent);
    world.registerComponent(FlagParameterPanel);

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

  initialize(world: World): void {
    Logger.getInstance().log("Initializing FlagSimulationPlugin...");

    // Register components
    world.componentManager.registerComponent(FlagComponent);
    world.componentManager.registerComponent(PoleComponent);
    // Ensure ParameterPanelComponent is registered correctly
    world.componentManager.registerComponent(
      ParameterPanelComponent as unknown as new (...args: any[]) => ParameterPanelComponent
    );

    // Initialize entities
    this.initializeEntities(world);

    // Consolidated log for initialization
    Logger.getInstance().log("FlagSimulationPlugin initialized with components and entities.");
  }

  initializeEntities(world: World): void {
    const studio = this._studio;
    if (!studio) {
      Logger.getInstance().error("Studio instance is not available. Call getSystems() first to provide studio context.");
      return;
    }
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
    world.componentManager.addComponent(
      flagEntity,
      RenderableComponent.type,
      new RenderableComponent("plane", "#ff0000") // Corrected color format to string
    );

    const initialFlagComponent = new FlagComponent(10, 6, 10, 6, 0.1, 0.5, 0.05, "", 0, { x: 1, y: 0, z: 0 }, { x: 0, y: -9.81, z: 0 }, null, "left");
    world.componentManager.addComponent(
      flagEntity,
      FlagComponent.type,
      initialFlagComponent // Use type instead of string
    );

    world.componentManager.addComponent(
      flagEntity,
      SelectableComponent.type,
      new SelectableComponent(true)
    );

    // Create a simple rotation (90 degrees around X-axis)
    // Using simple quaternion values instead of THREE.js
    world.componentManager.addComponent(
      flagEntity,
      RotationComponent.type,
      new RotationComponent(
        0.7071067811865475, // x: sin(45°)
        0,                  // y
        0,                  // z
        0.7071067811865476  // w: cos(45°)
      )
    );

    const flagComponent = world.componentManager.getComponent(
      flagEntity,
      FlagComponent.type
    ) as FlagComponent;
    const positionComponent = world.componentManager.getComponent(
      flagEntity,
      PositionComponent.type
    ) as PositionComponent;

    if (flagComponent && positionComponent) {
      try {
        FlagPhysicsInitializer.initializeFlag(
          flagComponent,
          positionComponent,
          world
        );
      } catch (error) {
        Logger.getInstance().error("Failed to initialize flag physics:", error);
      }
    } else {
      Logger.getInstance().error("FlagComponent or PositionComponent is missing for the flag entity.");
    }
  }
}
