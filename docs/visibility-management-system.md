# Centralized Visibility Management System

## Overview

This document describes the comprehensive visibility management system implemented to solve recurring panel visibility issues in the Physics Simulation Studio. The solution follows Test-Driven Development (TDD) principles and provides a centralized, robust approach to UI element visibility management.

## Problem Statement

The original issues were:
1. **Parameter panels not visible**: Tweakpane wasn't properly mounted to the left panel container
2. **Main panel not visible**: CSS layout issues and missing DOM mounting 
3. **Flag simulation not running**: System initialization and component registration problems
4. **Recurrent visibility issues**: No centralized system for managing UI element visibility

## Solution Architecture

### Core Components

#### 1. VisibilityManager (`src/studio/ui/VisibilityManager.ts`)

The central manager for all UI panel visibility:

```typescript
export class VisibilityManager {
  // Central registry for all panels
  private panels = new Map<string, PanelRegistration>();
  
  // Event system for visibility changes
  private eventListeners = new Map<VisibilityEventType, Array<(data: VisibilityEventData) => void>>();
  
  // Core methods
  public registerPanel(panelId: string, element: HTMLElement, container: HTMLElement): boolean
  public showPanel(panelId: string): void
  public hidePanel(panelId: string): void
  public togglePanel(panelId: string): void
  public isPanelVisible(panelId: string): boolean
}
```

**Features:**
- Centralized panel registration and management
- Event-driven visibility changes
- Responsive layout handling
- Error handling for missing panels
- Memory cleanup and proper DOM management

#### 2. UIVisibilityIntegration (`src/studio/ui/UIVisibilityIntegration.ts`)

Integration layer between existing UI system and visibility management:

```typescript
export class UIVisibilityIntegration {
  constructor(visibilityManager: VisibilityManager, uiManager: UIManager)
  
  // Ensures proper mounting of Tweakpane to left panel
  public initialize(): void
  
  // Public API for common operations
  public showAllPanels(): void
  public hideAllPanels(): void
  public toggleMainPanel(): void
  public refreshLayout(): void
}
```

**Features:**
- Automatic Tweakpane mounting to left panel container
- DOM mutation observation for dynamic changes
- Window focus handling to ensure panels remain visible
- Integration with existing UIManager

#### 3. SystemDiagnostics (`src/studio/utils/SystemDiagnostics.ts`)

Diagnostic tool for system health monitoring:

```typescript
export class SystemDiagnostics {
  public diagnoseAndFix(): void
  public getReport(): string
  
  // Internal diagnostics
  private checkSystemRegistrations(): void
  private checkComponentRegistrations(): void
  private checkEntityIntegrity(): void
  private ensureSystemsRunning(): void
}
```

**Features:**
- Automated system health checks
- Component and entity integrity validation
- Missing dependency detection
- Runtime error reporting

### Implementation Details

#### Updated Main.ts Integration

The main application initialization now properly integrates visibility management:

```typescript
function setupUI(studio: Studio, stateManager: StateManager, pluginManager: PluginManager) {
  // Create visibility manager first
  const visibilityManager = new VisibilityManager();

  // Create Tweakpane with proper container mounting
  const leftPanel = document.getElementById("left-panel");
  const pane = new Pane({ 
    container: leftPanel,  // THIS WAS THE KEY FIX
    title: "Physics Simulation Studio"
  });

  // Create integration layer
  const visibilityIntegration = new UIVisibilityIntegration(visibilityManager, uiManager);
  visibilityIntegration.initialize();
}
```

#### CSS Layout Improvements

The CSS ensures proper panel structure:

```css
.studio--left {
  grid-area: left-panel;
  overflow-y: auto;
  background-color: #252526;
  border-right: 1px solid #333;
  display: block;      /* Ensures visibility */
  visibility: visible; /* Explicit visibility */
  opacity: 1;         /* No transparency issues */
}
```

## Test Coverage

### VisibilityManager Tests
- ✅ Panel registration and mounting
- ✅ Show/hide/toggle operations
- ✅ State management across operations
- ✅ Event system functionality
- ✅ Error handling for edge cases
- ✅ Responsive layout updates

### UIVisibilityIntegration Tests
- ✅ Proper initialization
- ✅ Tweakpane mounting to left panel
- ✅ Panel management operations
- ✅ Layout refresh functionality
- ✅ Error handling for missing elements
- ✅ Cleanup and resource management

### System Integration Tests
- ✅ PropertyInspectorSystem integration
- ✅ Component panel visibility
- ✅ Flag simulation initialization
- ✅ Parameter panel rendering

## Benefits

### 1. Centralized Management
- Single source of truth for all panel visibility
- Consistent API across the application
- Eliminates scattered visibility code

### 2. Robust Error Handling
- Graceful handling of missing elements
- Automatic recovery from DOM issues
- Comprehensive logging and diagnostics

### 3. Responsive Design Support
- Automatic layout adjustments for mobile
- Window resize handling
- Flexible panel arrangement

### 4. Event-Driven Architecture
- Reactive visibility updates
- Decoupled component communication
- Easy integration with existing systems

### 5. Developer Experience
- Clear API with TypeScript types
- Comprehensive test coverage
- Debugging tools and diagnostics

## Usage Examples

### Basic Panel Management
```typescript
// Register a panel
visibilityManager.registerPanel("my-panel", element, container);

// Show/hide panels
visibilityManager.showPanel("my-panel");
visibilityManager.hidePanel("my-panel");
visibilityManager.togglePanel("my-panel");

// Check state
const isVisible = visibilityManager.isPanelVisible("my-panel");
```

### Event Handling
```typescript
visibilityManager.on("visibilityChanged", (data) => {
  console.log(`Panel ${data.panelId} is now ${data.visible ? 'visible' : 'hidden'}`);
});
```

### Integration Layer
```typescript
// High-level operations
visibilityIntegration.showAllPanels();
visibilityIntegration.hideAllPanels();
visibilityIntegration.toggleMainPanel();
visibilityIntegration.refreshLayout();
```

## Migration Guide

### For Existing Code
1. Replace direct DOM manipulation with VisibilityManager calls
2. Use UIVisibilityIntegration for high-level operations
3. Remove manual event listeners for visibility changes
4. Let the system handle responsive layout automatically

### For New Features
1. Register new panels with VisibilityManager during initialization
2. Use the event system for reactive visibility updates
3. Follow the established patterns for panel lifecycle management

## Future Enhancements

### Planned Features
1. **Panel Persistence**: Save/restore panel states across sessions
2. **Advanced Layout**: Docking, floating, and resizable panels
3. **Animation Support**: Smooth transitions for show/hide operations
4. **Accessibility**: ARIA labels and keyboard navigation
5. **Theme Integration**: Dynamic styling based on theme changes

### Extension Points
- Custom panel types with specialized behavior
- Plugin-specific visibility rules
- Advanced layout management
- Performance optimization for large numbers of panels

## Troubleshooting

### Common Issues

#### Panel Not Visible
1. Check if panel is registered: `visibilityManager.getRegisteredPanelIds()`
2. Verify container exists in DOM
3. Check CSS display/visibility properties
4. Review browser console for errors

#### System Not Running
1. Run diagnostics: `systemDiagnostics.diagnoseAndFix()`
2. Check system registration order
3. Verify component dependencies
4. Review initialization sequence

#### Layout Issues
1. Force layout refresh: `visibilityIntegration.refreshLayout()`
2. Check window resize handling
3. Verify CSS grid/flexbox properties
4. Test responsive breakpoints

### Debug Commands
```typescript
// Get visibility manager instance
const vm = window.visibilityManager;

// Check all panel states
console.log(vm.getAllPanelStates());

// Get diagnostic report
const diagnostics = new SystemDiagnostics(world);
console.log(diagnostics.getReport());

// Force visibility refresh
window.visibilityIntegration.refreshLayout();
```

## Conclusion

The centralized visibility management system provides a robust, scalable solution to the recurring panel visibility issues. By following TDD principles and implementing comprehensive error handling, the system ensures reliable UI behavior across all simulation scenarios.

The architecture is designed for extensibility, allowing future enhancements while maintaining backward compatibility. The clear separation of concerns between visibility management, UI integration, and system diagnostics creates a maintainable foundation for continued development.
