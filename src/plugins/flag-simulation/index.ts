import { IStudio } from "../../studio/IStudio";
import { World } from "../../core/ecs/World";
import { IWorld } from "../../core/ecs/IWorld";
import { ISimulationPlugin } from "../../core/plugin/ISimulationPlugin";
import { FlagComponent } from "./FlagComponent";
import { PoleComponent } from "./PoleComponent";
import { FlagSystem } from "./FlagSystem";
import { FlagRenderSystem } from "./FlagRenderSystem";
import { PositionComponent } from "../../core/components/PositionComponent";
import { RenderableComponent } from "../../core/components/RenderableComponent";
import { SelectableComponent } from "../../core/components/SelectableComponent";
import { RotationComponent } from "../../core/components/RotationComponent";
import { FlagPhysicsInitializer } from "./utils/FlagPhysicsInitializer";
import { ParameterPanelComponent } from "../../core/components/ParameterPanelComponent";
import * as THREE from "three";
import { flagPluginParameterSchema } from "./FlagPluginParameters";
import { PluginParameterManager } from "../../core/ui/PluginParameterManager";
import { System } from "../../core/ecs/System";
import { Logger } from '../../core/utils/Logger';
import { ThreeGraphicsManager } from "../../studio/graphics/ThreeGraphicsManager";

export class FlagSimulationPlugin implements ISimulationPlugin {
  private _flagSystem: FlagSystem | null = null;
  private _parameterManager: PluginParameterManager | null = null;
  private _studio: IStudio | null = null;

  getName(): string {
    return "flag-simulation";
  }

  getDependencies(): string[] {
    return [];
  }

  // Clean parameter system - no more parameter panel classes!
  getParameterSchema() {
    return flagPluginParameterSchema;
  }

  // Initialize parameter manager with the UI
  initializeParameterManager(uiRenderer: any): void {
    this._parameterManager = new PluginParameterManager(uiRenderer);
    console.log('✅ Flag plugin parameter manager initialized');
  }

  // Register component parameters - called when components are selected
  registerComponentParameters(componentType: string, component: any): void {
    if (!this._parameterManager) return;

    const parameters = flagPluginParameterSchema.components.get(componentType);
    if (parameters) {
      this._parameterManager.registerComponentParameters(
        'flag-simulation',
        componentType,
        component,
        parameters
      );
    }
  }

  getSystems(studio: IStudio): System[] {
    // Store studio reference for later use in initializeEntities
    this._studio = studio;
    return [new FlagSystem(), new FlagRenderSystem(studio.getGraphicsManager() as ThreeGraphicsManager)];
  }

  register(world: World): void {
    // Register components - no more parameter panel boilerplate!
    world.componentManager.registerComponent(FlagComponent);
    world.componentManager.registerComponent(PoleComponent);

    // Register core components needed by this plugin
    world.componentManager.registerComponent(PositionComponent);
    world.componentManager.registerComponent(RenderableComponent);
    world.componentManager.registerComponent(SelectableComponent);
    world.componentManager.registerComponent(RotationComponent);

    console.log('✅ Flag simulation plugin registered - simplified & clean!');
  }
  unregister(): void {
    if (this._flagSystem) {
      this._flagSystem.unregister();
      this._flagSystem = null;
    }

    // Clear parameter manager
    if (this._parameterManager) {
      this._parameterManager.clearAll();
      this._parameterManager = null;
    }

    console.log('✅ Flag plugin unregistered');
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

    // Initialize entities
    this.initializeEntities(world);

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

    const initialFlagComponent = new FlagComponent(10, 6, 10, 6, 0.1, 0.5, 0.05, "", 0, { x: 1, y: 0, z: 0 }, { x: 0, y: -9.81, z: 0 }, undefined, "left");
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

    if (!flagComponent || !positionComponent) {
      Logger.getInstance().error("FlagComponent or PositionComponent is missing for the flag entity.");
      return;
    }

    try {
      FlagPhysicsInitializer.initializeFlag(
        flagComponent,
        positionComponent,
        world
      );
    } catch (error) {
      Logger.getInstance().error("Failed to initialize flag physics:", error);
    }
  }
}
