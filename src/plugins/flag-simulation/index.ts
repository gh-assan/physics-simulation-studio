import { World } from "../../core/ecs/World";
import { ISimulationPlugin } from "../../core/plugin/ISimulationPlugin";
import { FlagComponent } from "./FlagComponent";
import { PoleComponent } from "./PoleComponent"; // Add this import
import { FlagSystem } from "./FlagSystem";
import { PositionComponent } from "../../core/components/PositionComponent";
import { RenderableComponent } from "../../core/components/RenderableComponent";
import { SelectableComponent } from "../../core/components/SelectableComponent";
import { RotationComponent } from "../../core/components/RotationComponent";
import { FlagPhysicsInitializer } from "./utils/FlagPhysicsInitializer";
import { FlagParameterPanel } from "./FlagParameterPanel";
import { ParameterPanelComponent } from "../../core/components/ParameterPanelComponent";
import * as THREE from "three";
import { flagComponentProperties } from "./flagComponentProperties";
import { registerComponentProperties } from "../../studio/utils/ComponentPropertyRegistry";

export { FlagComponent } from "./FlagComponent";
export { FlagSystem } from "./FlagSystem";
export { FlagParameterPanel } from "./FlagParameterPanel";

export function registerFlagComponentProperties() {
  registerComponentProperties("FlagComponent", flagComponentProperties);
}

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
  register(world: World): void {
    // Register components
    world.componentManager.registerComponent(FlagComponent);
    world.componentManager.registerComponent(PoleComponent);
    world.componentManager.registerComponent(FlagParameterPanel);
    // ParameterPanelComponent registration is handled by the core system
    // world.componentManager.registerComponent(
    //   ParameterPanelComponent.type,
    //   ParameterPanelComponent
    // );

    // Register systems
    this._flagSystem = new FlagSystem();
    world.systemManager.registerSystem(this._flagSystem);

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

        console.log("FlagSimulationPlugin registered with parameter panel.");
      } else {
        console.log(
          "FlagSimulationPlugin registered without parameter panel (ParameterPanelComponent not registered)."
        );
      }
    } catch (error) {
      console.warn(
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

  initializeEntities(world: World): void {
    // Create a default pole entity
    const poleEntity = world.entityManager.createEntity();
    console.log("[FlagSimulationPlugin] Created pole entity:", poleEntity);
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
    console.log("[FlagSimulationPlugin] Created flag entity:", flagEntity);
    world.componentManager.addComponent(
      flagEntity,
      PositionComponent.type,
      new PositionComponent(0, 15, 0) // Adjusted flag position to be near the top of the pole
    );
    // Use a bright red color for better visibility against the default background
    world.componentManager.addComponent(
      flagEntity,
      RenderableComponent.type,
      new RenderableComponent("plane", "#ff0000")
    );
    // Create a larger flag with more segments for better visibility
    const initialFlagComponent = new FlagComponent(
      30,
      20,
      30,
      20,
      0.1,
      0.5,
      0.05,
      "",
      0,
      null,
      null,
      poleEntity,
      "left"
    );
    world.componentManager.addComponent(
      flagEntity,
      FlagComponent.type,
      new FlagComponent(
        30,
        20,
        30,
        20,
        0.1,
        0.5,
        0.05,
        "",
        5,
        { x: 1, y: 0.5, z: 0.5 },
        null,
        poleEntity,
        "left"
      )
    );
    console.log(
      "[FlagSimulationPlugin] Initial FlagComponent properties:",
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
    // Log all components for this entity
    const comps = world.componentManager.getAllComponentsForEntity(flagEntity);
    console.log("[FlagSimulationPlugin] Components for flag entity:", comps);

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
      console.log(
        "[FlagSimulationPlugin] Flag physics initialized with",
        flagComponent.points.length,
        "points and",
        flagComponent.springs.length,
        "springs"
      );
      console.log(
        "[FlagSimulationPlugin] First few flag points after init:",
        flagComponent.points.slice(0, 5)
      );
    }
  }
}
