# Migration Plan: Existing Simulations to New Architecture

## Overview
This document outlines the migration plan for existing simulations (Flag, Solar System, Water) to the new comprehensive architecture described in `COMPREHENSIVE_ARCHITECTURE_DESIGN.md`.

## Current State Analysis

### Existing Simulations Status:
- **Flag Simulation**: 70% compatible, needs interface migration
- **Solar System**: 50% compatible, needs renderer and parameter system
- **Water Simulation**: 70% compatible, needs interface migration

## Migration Phases

### Phase 1: Core Foundation (Week 1-2) - PRIORITY
**Status**: ❌ Not implemented

#### Required Core Components:
1. **Create Core Interfaces** (`src/core/simulation/`)
   ```typescript
   - ISimulationAlgorithm.ts
   - ISimulationRenderer.ts  
   - IParameterDefinition.ts
   - SimulationState.ts
   - TimeSteppingEngine.ts
   ```

2. **Studio Managers** (`src/studio/`)
   ```typescript
   - SimulationManager.ts
   - SimulationController.ts
   - ParameterManager.ts
   - CameraManager.ts
   - SimulationRenderManager.ts
   ```

3. **Enhanced Global State**
   - Extend GlobalState with simulation state
   - Add simulation Actions and Selectors

### Phase 2: Plugin Interface Migration (Week 3)

#### Update Plugin Interface:
```typescript
// OLD interface
interface ISimulationPlugin {
  getName(): string;
  register(world: World): void;
  getSystems(studio: IStudio): System[];
}

// NEW interface  
interface ISimulationPlugin {
  readonly name: string;
  getAlgorithms(): ISimulationAlgorithm[];
  getRenderers(): ISimulationRenderer[];
  getParameters(): IParameterDefinition[];
  register(context: IPluginContext): void;
}
```

### Phase 3: Simulation-Specific Migration

#### 3.1 Flag Simulation Migration
**Current Structure:**
```
src/plugins/flag-simulation/
├── FlagSystem.ts           # → FlagClothAlgorithm.ts
├── FlagRenderSystem.ts     # → FlagRenderer.ts  
├── FlagPluginParameters.ts # → Parameters array
└── index.ts               # Update plugin interface
```

**Migration Steps:**
1. Convert `FlagSystem` → `FlagClothAlgorithm` implementing `ISimulationAlgorithm`
2. Convert `FlagRenderSystem` → `FlagRenderer` implementing `ISimulationRenderer`
3. Convert parameter schema to new format
4. Update plugin registration

#### 3.2 Solar System Migration  
**Current Structure:**
```
src/plugins/solar-system/
├── system.ts              # → SolarSystemAlgorithm.ts
├── components.ts          # Keep as-is
├── parameter-panel.ts     # → Parameters array
└── index.ts              # Update plugin interface
```

**Missing Components:**
- ❌ Dedicated renderer (currently uses generic RenderSystem)
- ❌ Modern parameter system

**Migration Steps:**
1. Create `SolarSystemRenderer` implementing `ISimulationRenderer`
2. Convert `SolarSystem` → `SolarSystemAlgorithm`
3. Convert parameter panel to parameter definitions
4. Update plugin registration

#### 3.3 Water Simulation Migration
**Current Structure:**
```
src/plugins/water-simulation/
├── WaterSystem.ts         # → WaterAlgorithm.ts
├── WaterRenderer.ts       # Update to new interface
├── WaterPluginParameters.ts # → Parameters array  
└── index.ts              # Update plugin interface
```

**Migration Steps:**
1. Update `WaterRenderer` to implement `ISimulationRenderer`
2. Convert `WaterSystem` → `WaterAlgorithm`
3. Convert parameter schema to new format
4. Update plugin registration

## Detailed Migration Examples

### Example 1: Flag Algorithm Migration

**Before:**
```typescript
// FlagSystem.ts
export class FlagSystem extends System {
  update(deltaTime: number): void {
    // Physics logic here
  }
}
```

**After:**
```typescript
// FlagClothAlgorithm.ts
export class FlagClothAlgorithm implements ISimulationAlgorithm {
  readonly name = "Flag Cloth Simulation";
  
  step(state: SimulationState, deltaTime: number): SimulationState {
    // Same physics logic, but returns new state
    return newState;
  }
  
  configure(parameters: Record<string, any>): void {
    // Handle parameter updates
  }
}
```

### Example 2: Renderer Migration

**Before:**
```typescript
// FlagRenderSystem.ts  
export class FlagRenderSystem extends System {
  update(): void {
    // Rendering logic
  }
}
```

**After:**
```typescript
// FlagRenderer.ts
export class FlagRenderer implements ISimulationRenderer {
  readonly algorithmName = "Flag Cloth Simulation";
  
  canRender(entity: Entity): boolean {
    return entity.hasComponent(FlagComponent);
  }
  
  render(entities: Entity[], context: RenderContext): void {
    // Same rendering logic
  }
}
```

### Example 3: Parameter Migration

**Before:**
```typescript
// FlagPluginParameters.ts
export const flagPluginParameterSchema = {
  components: new Map([
    ['FlagComponent', [
      { name: 'stiffness', type: 'number', default: 0.8 }
    ]]
  ])
};
```

**After:**
```typescript
// In plugin index.ts
getParameters(): IParameterDefinition[] {
  return [
    {
      name: 'stiffness',
      type: 'number', 
      defaultValue: 0.8,
      constraints: { min: 0.1, max: 1.0, step: 0.01 },
      category: 'physics',
      description: 'Cloth structural stiffness',
      units: 'dimensionless'
    }
  ];
}
```

## Implementation Priority

### High Priority (Weeks 1-2):
1. ✅ Implement core interfaces
2. ✅ Create studio managers  
3. ✅ Extend global state
4. ✅ Migrate Flag simulation (most complete)

### Medium Priority (Weeks 3-4):
1. ✅ Migrate Water simulation
2. ✅ Create Solar System renderer
3. ✅ Migrate Solar System

### Low Priority (Weeks 5+):
1. ✅ Add graph system integration
2. ✅ Performance optimizations
3. ✅ Advanced UI features

## Success Criteria

### Phase 1 Complete:
- [ ] All core interfaces implemented
- [ ] Studio managers functional
- [ ] State management extended
- [ ] Flag simulation successfully migrated

### Phase 2 Complete:
- [ ] All 3 simulations migrated
- [ ] No rendering conflicts
- [ ] Unified parameter system working
- [ ] Play/pause/reset functionality

### Phase 3 Complete:
- [ ] Graph system integrated
- [ ] Camera management working
- [ ] Performance optimized
- [ ] Documentation updated

## Risk Assessment

### High Risk:
- **State management complexity**: New state system may be complex to integrate
- **Rendering conflicts**: Ensuring new architecture actually solves flag flickering

### Medium Risk:
- **Performance impact**: New architecture may introduce overhead
- **Testing coverage**: Need comprehensive tests for new interfaces

### Low Risk:
- **Plugin migration**: Existing plugins are relatively simple to migrate
- **UI integration**: Tweakpane integration is already working

## Next Steps

1. **Immediate**: Implement Phase 1 core foundation
2. **Week 1**: Start with Flag simulation migration as proof of concept
3. **Week 2**: Validate architecture solves rendering conflicts
4. **Week 3+**: Migrate remaining simulations

## Success Validation

The migration is successful when:
- ✅ Flag simulation runs without flickering
- ✅ All simulations work with unified controls
- ✅ Parameter changes work across all simulations  
- ✅ Play/pause/reset works consistently
- ✅ Code is cleaner and more maintainable
