import { Logger } from "../../core/utils/Logger";
import { World } from "../../core/ecs/World";
import { ISystem } from "../../core/ecs/ISystem";

/**
 * Ensures proper system initialization and debugging for simulation issues
 */
export class SystemDiagnostics {
  private world: World;

  constructor(world: World) {
    this.world = world;
  }

  /**
   * Diagnoses and fixes common system initialization issues
   */
  public diagnoseAndFix(): void {
    Logger.getInstance().log("[SystemDiagnostics] Starting system diagnostics...");

    this.checkSystemRegistrations();
    this.checkComponentRegistrations();
    this.checkEntityIntegrity();
    this.ensureSystemsRunning();

    Logger.getInstance().log("[SystemDiagnostics] Diagnostics completed");
  }

  /**
   * Checks if all expected systems are registered
   */
  private checkSystemRegistrations(): void {
    const systems = this.world.systemManager.getAllSystems();
    const systemNames = systems.map(s => s.constructor.name);

    Logger.getInstance().log(`[SystemDiagnostics] Registered systems: ${systemNames.join(", ")}`);

    // Check for critical core systems only - plugin systems are optional
    const criticalSystems = ["SimplifiedPropertyInspectorSystem", "RenderOrchestrator"];
    const missingSystems = criticalSystems.filter(name => !systemNames.includes(name));

    if (missingSystems.length > 0) {
      Logger.getInstance().warn(`[SystemDiagnostics] Missing critical systems: ${missingSystems.join(", ")}`);
    }
  }

  /**
   * Checks if all expected components are registered
   */
  private checkComponentRegistrations(): void {
    const componentConstructors = this.world.componentManager.getComponentConstructors();
    const componentTypes = Array.from(componentConstructors.keys());

    Logger.getInstance().log(`[SystemDiagnostics] Registered components: ${componentTypes.join(", ")}`);

    // Check for critical core components only
    const criticalComponents = ["PositionComponent", "RenderableComponent", "SelectableComponent"];
    const missingComponents = criticalComponents.filter(name => !componentTypes.includes(name));

    if (missingComponents.length > 0) {
      Logger.getInstance().warn(`[SystemDiagnostics] Missing critical components: ${missingComponents.join(", ")}`);
    }
  }

  /**
   * Checks entity integrity and relationships
   */
  private checkEntityIntegrity(): void {
    const entities = this.world.entityManager.getAllEntities();
    Logger.getInstance().log(`[SystemDiagnostics] Total entities: ${entities.size}`);

    for (const entityId of entities) {
      const components = this.world.componentManager.getAllComponentsForEntity(entityId);
      const componentTypes = Object.keys(components);

      if (componentTypes.length === 0) {
        Logger.getInstance().warn(`[SystemDiagnostics] Entity ${entityId} has no components`);
      }
    }
  }

  /**
   * Ensures systems are properly running
   */
  private ensureSystemsRunning(): void {
    const systems = this.world.systemManager.getAllSystems();

    for (const system of systems) {
      try {
        // Force a system update to check if it's working
        system.update(this.world, 0.016); // 60 FPS delta
      } catch (error) {
        Logger.getInstance().error(`[SystemDiagnostics] System ${system.constructor.name} failed to update:`, error);
      }
    }
  }

  /**
   * Gets a diagnostic report
   */
  public getReport(): string {
    const systems = this.world.systemManager.getAllSystems();
    const components = this.world.componentManager.getComponentConstructors();
    const entities = this.world.entityManager.getAllEntities();

    return `
=== System Diagnostics Report ===
Systems: ${systems.length} registered
- ${systems.map(s => s.constructor.name).join("\n- ")}

Components: ${components.size} registered
- ${Array.from(components.keys()).join("\n- ")}

Entities: ${entities.size} created
${Array.from(entities).map((id: number) => {
  const comps = this.world.componentManager.getAllComponentsForEntity(id);
  return `- Entity ${id}: [${Object.keys(comps).join(", ")}]`;
}).join("\n")}
================================
    `;
  }
}
