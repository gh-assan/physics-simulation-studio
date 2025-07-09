import { World } from "../../core/ecs/World";
import { ISimulationPlugin } from "../../core/plugin/ISimulationPlugin";
import { FlagComponent } from "./FlagComponent";
import { FlagSystem } from "./FlagSystem";
import { PositionComponent } from "../../core/components/PositionComponent";
import { RenderableComponent } from "../../core/components/RenderableComponent";
import { SelectableComponent } from "../../core/components/SelectableComponent";
import { RotationComponent } from "../../core/components/RotationComponent";
import { FlagPhysicsInitializer } from "./utils/FlagPhysicsInitializer";
import * as THREE from "three";

export { FlagComponent } from "./FlagComponent";
export { FlagSystem } from "./FlagSystem";

export class FlagSimulationPlugin implements ISimulationPlugin {
  private _flagSystem: FlagSystem | null = null;

  getName(): string {
    return "flag-simulation";
  }
  getDependencies(): string[] {
    return [];
  }
  register(world: World): void {
    world.componentManager.registerComponent(FlagComponent.type, FlagComponent);
    this._flagSystem = new FlagSystem();
    world.systemManager.registerSystem(this._flagSystem);
    console.log("FlagSimulationPlugin registered.");
  }
  unregister(): void {
    if (this._flagSystem) {
      this._flagSystem.unregister();
      this._flagSystem = null;
    }
  }

  initializeEntities(world: World): void {
    // Create flag entity
    const flagEntity = world.entityManager.createEntity();
    console.log("[FlagSimulationPlugin] Created flag entity:", flagEntity);
    world.componentManager.addComponent(
      flagEntity,
      PositionComponent.type,
      new PositionComponent(0, 0, -5)
    );
    // Use a bright red color for better visibility against the default background
    world.componentManager.addComponent(
      flagEntity,
      RenderableComponent.type,
      new RenderableComponent("plane", "#ff0000")
    );
    // Create a larger flag with more segments for better visibility
    world.componentManager.addComponent(
      flagEntity,
      FlagComponent.type,
      new FlagComponent(30, 20, 30, 20)
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
      FlagPhysicsInitializer.initializeFlag(flagComponent, positionComponent);
      console.log(
        "[FlagSimulationPlugin] Flag physics initialized with",
        flagComponent.points.length,
        "points and",
        flagComponent.springs.length,
        "springs"
      );
    }
  }
}
