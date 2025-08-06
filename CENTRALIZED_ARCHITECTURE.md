# Centralized Visibility & Rendering Architecture - Migration Guide

## Overview

This document describes the new centralized architecture that replaces the scattered visibility and rendering management system. The new system provides a single source of truth for all visibility and rendering operations.

## Problems Solved

### Before (Scattered Architecture)
- **RenderSystem** - Generic entity rendering
- **FlagRenderSystem** - Flag-specific rendering 
- **FlagRenderer** - Duplicate flag rendering (!)
- **WaterRenderer** - Water rendering
- **ThreeGraphicsManager** - Scene management
- **RendererProvider** - Scene clearing utilities
- **VisibilityManager** - UI panel visibility only
- **Multiple systems** calling `scene.add()` and `scene.remove()` independently
- **No coordination** between 3D rendering and UI visibility
- **Debugging nightmare** - scattered state across multiple classes

### After (Centralized Architecture)
- **VisibilityOrchestrator** - Master coordinator for ALL visibility
- **RenderOrchestrator** - Centralized 3D rendering management
- **IRenderer interface** - Standardized renderer implementation
- **FlagRenderer** - Single, clean flag renderer implementation
- **Coordinated state** - UI and 3D rendering work together
- **Single responsibility** - Each class has one clear purpose
- **Debuggable** - All state accessible from orchestrators

## New Architecture Components

### 1. VisibilityOrchestrator (`src/studio/orchestration/VisibilityOrchestrator.ts`)

**Purpose**: Master coordinator for ALL visibility in the application

**Key Methods**:
```typescript
// Show/hide everything
showAll(): void
hideAllPanels(): void
clearScene(): void
reset(): void

// Individual panel control
showPanel(panelId: string): void
hidePanel(panelId: string): void
togglePanel(panelId: string): void

// State debugging
getVisibilityState(): VisibilityState
logState(): void
isHealthy(): boolean
```

**What it manages**:
- UI panel visibility (via VisibilityManager)
- 3D scene rendering (via RenderOrchestrator)
- Coordination between UI and 3D state
- Event coordination and consistency

### 2. RenderOrchestrator (`src/studio/rendering/RenderOrchestrator.ts`)

**Purpose**: Centralized 3D rendering management

**Key Methods**:
```typescript
// Renderer management
registerRenderer(rendererId: string, renderer: IRenderer): void
unregisterRenderer(rendererId: string): void

// Scene management
clearScene(): void
requestRender(): void
getSceneState(): SceneState

// Persistent objects
addPersistentObject(name: string): void
removePersistentObject(name: string): void
```

**What it manages**:
- All 3D renderers (flags, water, particles, etc.)
- Scene clearing and cleanup
- Render requests and optimization
- Persistent object management (grid, lights, axes)

### 3. IRenderer Interface (`src/studio/rendering/RenderOrchestrator.ts`)

**Purpose**: Standardized interface for all renderers

```typescript
interface IRenderer {
  update(world: IWorld, deltaTime: number): void;
  clear?(): void;
  dispose?(): void;
}
```

**Implementation Pattern**:
All renderers (FlagRenderer, WaterRenderer, etc.) implement this interface and are managed by RenderOrchestrator.

### 4. FlagRenderer (`src/studio/rendering/FlagRenderer.ts`)

**Purpose**: Clean, single implementation of flag rendering

**Features**:
- Handles both flags and poles
- Proper geometry updates
- Wind effects
- Mesh lifecycle management
- No duplication with other systems

## Migration Benefits

### 1. **Single Source of Truth**
- All visibility state in VisibilityOrchestrator
- All 3D rendering state in RenderOrchestrator
- No more scattered state across multiple classes

### 2. **Predictable Behavior** 
- Clear ownership of responsibilities
- Coordinated state changes
- No race conditions between systems

### 3. **Easy Debugging**
```typescript
// Check all visibility state
visibilityOrchestrator.logState();

// Check if system is healthy
if (!visibilityOrchestrator.isHealthy()) {
  console.log("System health issue detected");
}

// Get detailed state
const state = visibilityOrchestrator.getVisibilityState();
```

### 4. **Extensible Design**
- Add new renderers via `renderOrchestrator.registerRenderer()`
- Add new panels via `visibilityManager.registerPanel()`
- Event system for coordination between components

### 5. **Performance**
- Centralized render requests prevent unnecessary renders
- Coordinated clearing prevents memory leaks
- Proper disposal of resources

## Usage Examples

### Registering a New Renderer
```typescript
// Create your renderer
class MyCustomRenderer implements IRenderer {
  update(world: IWorld, deltaTime: number): void {
    // Your rendering logic
  }
  
  clear(): void {
    // Clean up your objects
  }
}

// Register with orchestrator
const myRenderer = new MyCustomRenderer();
renderOrchestrator.registerRenderer("my-custom", myRenderer);
```

### Adding a New Panel
```typescript
// Create panel
const myPanel = pane.addFolder({ title: "My Panel" });

// Register with visibility system
visibilityOrchestrator.getVisibilityManager().registerGlobalPanel(
  'my-panel',
  myPanel,
  leftPanelContainer,
  { priority: 10 }
);
```

### Debugging Visibility Issues
```typescript
// Log complete state
visibilityOrchestrator.logState();

// Check specific panel
const isVisible = visibilityOrchestrator.getVisibilityManager().isPanelVisible('my-panel');

// Check scene state
const sceneState = visibilityOrchestrator.getRenderOrchestrator().getSceneState();
console.log(`Scene has ${sceneState.meshCount} meshes`);
```

## Files Changed

### Removed/Deprecated
- `RenderSystem.ts` - Replaced by RenderOrchestrator
- `FlagRenderSystem.ts` - Replaced by FlagRenderer
- `systems/FlagRenderer.ts` - Duplicate implementation removed

### New Files
- `orchestration/VisibilityOrchestrator.ts` - Master visibility coordinator
- `rendering/RenderOrchestrator.ts` - Centralized rendering management
- `rendering/FlagRenderer.ts` - Clean flag renderer implementation

### Modified
- `main.ts` - Updated to use centralized architecture
- `VisibilityManager.ts` - Now works with VisibilityOrchestrator

## Future Enhancements

The new architecture enables:

1. **Plugin Isolation**: Each plugin can register its own renderer without affecting others
2. **Performance Optimization**: Centralized render batching and optimization
3. **State Persistence**: Save/restore complete visibility state
4. **Advanced Debugging**: Runtime inspection of all rendering and visibility state
5. **Testing**: Each component can be tested in isolation
6. **Hot Reloading**: Renderers can be swapped without system restart

## Conclusion

The new centralized architecture eliminates the scattered visibility and rendering management that was causing debugging nightmares. All visibility and rendering is now managed through two main orchestrators, providing a clean, debuggable, and extensible foundation for the Physics Simulation Studio.
