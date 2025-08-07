/**
 * Migration strategy from current complex parameter system to simplified approach
 */

import { ParameterSchemaRegistry, SchemaInference } from './ParameterSchema';
import { ParameterManager, TweakpaneAdapter } from './ParameterManager';

// Phase 1: Create compatibility layer
class ParameterMigrationHelper {

  // Convert existing ComponentControlProperty[] to new schema
  static convertLegacyProperties(componentType: string, legacyProperties: any[]): void {
    const schema = legacyProperties.map(prop => ({
      key: prop.property,
      label: prop.label,
      type: prop.type,
      min: prop.min,
      max: prop.max,
      step: prop.step,
      options: prop.options
    }));

    ParameterSchemaRegistry.register(componentType, schema);
  }

  // Migrate existing parameter panel classes
  static migrateParameterPanel(PanelClass: any): void {
    const instance = new PanelClass();
    const componentType = instance.componentType;

    // Extract properties from registerControls method
    let extractedProperties: any[] = [];

    const mockUIManager = {
      registerComponentControls: (_: string, __: any, properties: any[]) => {
        extractedProperties = properties || [];
      }
    };

    try {
      instance.registerControls(mockUIManager, {});
      this.convertLegacyProperties(componentType, extractedProperties);
    } catch (error) {
      console.warn(`Could not migrate ${PanelClass.name}:`, error);
    }
  }

  // Auto-migrate all existing parameter panels
  static migrateAllParameterPanels(parameterPanelClasses: any[]): void {
    parameterPanelClasses.forEach(PanelClass => {
      this.migrateParameterPanel(PanelClass);
    });
  }
}

// Phase 2: Backward compatibility wrapper
class LegacyParameterPanelAdapter {
  private parameterManager: ParameterManager;

  constructor(uiAdapter: TweakpaneAdapter) {
    this.parameterManager = new ParameterManager(uiAdapter);
  }

  // Make new system work with old PropertyInspectorUIManager interface
  registerComponentControls(
    componentTypeKey: string,
    componentInstance: any,
    parameterPanels: any[]
  ): void {
    // Try new system first
    const schema = ParameterSchemaRegistry.get(componentTypeKey);
    if (schema) {
      this.parameterManager.registerComponent(componentTypeKey, componentInstance);
      return;
    }

    // Fall back to legacy parameter panels
    const parameterPanel = parameterPanels.find(
      (panel) => panel.componentType === componentTypeKey
    );

    if (parameterPanel) {
      // Convert legacy panel to new system on the fly
      ParameterMigrationHelper.migrateParameterPanel(parameterPanel.constructor);
      this.parameterManager.registerComponent(componentTypeKey, componentInstance);
    }
  }

  registerParameterPanels(parameterPanels: any[]): void {
    parameterPanels.forEach(panel => {
      const componentType = panel.componentType;

      // Ensure schema exists
      if (!ParameterSchemaRegistry.get(componentType)) {
        ParameterMigrationHelper.migrateParameterPanel(panel.constructor);
      }

      // Create a dummy component instance for schema-only panels
      const dummyComponent = {};
      this.parameterManager.registerComponent(componentType, dummyComponent);
    });
  }

  clearInspectorControls(): void {
    this.parameterManager.clearAll();
  }
}

// Phase 3: Component modernization examples
export class ModernizationExamples {

  // Before: 280+ line FlagParameterPanel class
  // After: Just add decorators to component
  static modernizeFlagComponent(): string {
    return `
// OLD (FlagParameterPanel.ts - 280+ lines)
export class FlagParameterPanel extends ParameterPanelComponent {
  registerControls(uiManager: IUIManager, component?: IComponent): void {
    const properties: ComponentControlProperty[] = [
      { property: "width", type: "number", label: "Flag Width", min: 0.1, max: 10, step: 0.1 },
      { property: "height", type: "number", label: "Flag Height", min: 0.1, max: 10, step: 0.1 },
      // ... 40+ more definitions
    ];
    uiManager.registerComponentControls(this.componentType, component, properties);
  }
  // ... more boilerplate
}

// NEW (FlagComponent.ts - just add decorators)
export class FlagComponent {
  @Parameter({ label: "Width", min: 0.1, max: 10, step: 0.1, group: "Size" })
  width = 2.0;

  @Parameter({ label: "Height", min: 0.1, max: 10, step: 0.1, group: "Size" })
  height = 3.0;

  @Parameter({ label: "Stiffness", min: 0.1, max: 1, step: 0.01, group: "Physics" })
  stiffness = 0.8;
  
  // No parameter panel class needed!
}
`;
  }

  // Before: Manual property definitions everywhere
  // After: Automatic inference for simple cases
  static modernizeWaterComponent(): string {
    return `
// OLD - manual definitions in 3 places
// 1. WaterDropletParameterPanel.ts (200+ lines)
// 2. waterComponentProperties.ts 
// 3. ComponentPropertyDefinitions.ts

// NEW - just define constraints in component
export class WaterDropletComponent {
  radius = { value: 0.1, min: 0.01, max: 1.0, step: 0.01 };
  mass = { value: 1.0, min: 0.1, max: 10, step: 0.1 };
  viscosity = { value: 0.8, min: 0, max: 1, step: 0.01 };
}

// Auto-generate schema
const schema = SchemaInference.infer(new WaterDropletComponent());
ParameterSchemaRegistry.register('WaterDropletComponent', schema);
`;
  }
}

// Phase 4: Performance and maintainability improvements
export class SystemImprovements {

  static getImprovements(): string[] {
    return [
      "🔥 Reduced code: 280+ lines → 10-20 lines per component",
      "🚀 Type safety: Decorators provide compile-time checking",
      "🔧 Framework agnostic: Easy to switch from Tweakpane to other UI libraries",
      "🎯 Single source of truth: Component properties define their own UI",
      "⚡ Auto-inference: No manual UI definitions for simple cases",
      "🧹 No ECS coupling: Parameter panels aren't ECS components",
      "🔄 Hot reload friendly: Changes to @Parameter decorators update UI instantly",
      "🧪 Testable: UI adapters can be mocked for testing",
      "📦 Plugin friendly: Plugins just need to register their components",
      "🎨 Flexible grouping: Properties can be organized into collapsible groups"
    ];
  }

  static getMetrics(): { before: any, after: any } {
    return {
      before: {
        linesOfCode: "~2000+ for all parameter panels",
        files: "~15 parameter panel classes + registry files",
        couplingToECS: "High - parameter panels are ECS components",
        couplingToUI: "High - tightly coupled to Tweakpane",
        maintainability: "Low - scattered property definitions",
        typeChecking: "None - string-based property paths",
        testability: "Difficult - complex mocking required"
      },
      after: {
        linesOfCode: "~200 core + decorators on components",
        files: "3 core files + decorators on components",
        couplingToECS: "None - pure UI concern",
        couplingToUI: "Low - adapter pattern",
        maintainability: "High - co-located with component logic",
        typeChecking: "Strong - TypeScript decorators",
        testability: "Easy - mockable adapters"
      }
    };
  }
}

export { ParameterMigrationHelper, LegacyParameterPanelAdapter };
