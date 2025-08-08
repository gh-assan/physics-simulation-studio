# Physics Simulation Studio: Comprehensive Architecture Design

## Executive Summary

This document describes the complete architectural redesign of the Physics Simulation Studio, addressing all identified design issues and requirements. The new architecture is **simulation-first**, **state-driven**, and **plugin-extensible**, properly separating simulation algorithms from visualization while maintaining clean code organization.

## Table of Contents
1. [Problem Analysis](#problem-analysis)
2. [Design Principles](#design-principles)
3. [Architecture Overview](#architecture-overview)
4. [Layer Responsibilities](#layer-responsibilities)
5. [Component Integration](#component-integration)
6. [Parameter Management](#parameter-management)
7. [Simulation Controls](#simulation-controls)
8. [Rendering & Visualization](#rendering--visualization)
9. [Camera Management](#camera-management)
10. [Graph Updates](#graph-updates)
11. [State Management Integration](#state-management-integration)
12. [Plugin Architecture](#plugin-architecture)
13. [Implementation Plan](#implementation-plan)

---

## Problem Analysis

### Current Issues Identified

#### 1. **Rendering System Conflicts**
- **Problem**: Multiple systems competing for entity rendering (RenderSystem, RenderOrchestrator, FlagRenderSystem)
- **Symptom**: Flag flickering - appears briefly then disappears
- **Root Cause**: Priority-based timing dependencies and unclear ownership

#### 2. **Architecture Violations**
- **Problem**: Core systems containing hardcoded plugin knowledge
- **Example**: Core RenderSystem checking for `'CelestialBodyComponent'`
- **Violation**: Tight coupling between core and plugins

#### 3. **Missing Algorithm Focus**
- **Problem**: Rendering-centric design ignoring simulation algorithms
- **Impact**: Physics computations treated as secondary concerns
- **Need**: Algorithm-first architecture for scientific accuracy

#### 4. **Incomplete Integration**
- **Missing**: Parameter management system
- **Missing**: Graph update mechanisms
- **Missing**: Simulation control integration (play/pause/reset)
- **Missing**: Camera settings management

#### 5. **State Management Disconnect**
- **Problem**: Rendering systems not properly integrated with global state
- **Impact**: State changes not reflected in visualizations
- **Need**: State-driven rendering updates

---

## Design Principles

### 1. **Simulation-First Architecture**
- **Physics algorithms are primary concern**
- **Rendering is visualization of simulation results**
- **Clear separation between computation and presentation**

### 2. **Single Responsibility Principle**
- **Each component has one clear purpose**
- **No competing systems for same functionality**
- **Clear ownership boundaries**

### 3. **Inversion of Control**
- **Core defines interfaces, plugins implement them**
- **No hardcoded plugin knowledge in core**
- **Dependency injection pattern**

### 4. **State-Driven Updates**
- **All changes flow through global state**
- **Reactive updates based on state changes**
- **Predictable data flow**

### 5. **Plugin Extensibility**
- **Easy to add new simulation algorithms**
- **Self-registering plugins**
- **Hot-reload capability**

### 6. **Performance Optimization**
- **Fixed timestep for numerical stability**
- **Only update what changed**
- **Efficient memory management**

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        PLUGINS                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ flag-simulation │  │ water-simulation│  │ solar-system    │ │
│  │ ✓ Algorithm     │  │ ✓ Algorithm     │  │ ✓ Algorithm     │ │
│  │ ✓ Renderer      │  │ ✓ Renderer      │  │ ✓ Renderer      │ │
│  │ ✓ Parameters    │  │ ✓ Parameters    │  │ ✓ Parameters    │ │
│  │ ✓ UI Controls   │  │ ✓ UI Controls   │  │ ✓ UI Controls   │ │
│  │ ✓ Graphs        │  │ ✓ Graphs        │  │ ✓ Graphs        │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                         Plugin Registration
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        STUDIO                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │SimulationManager│  │ RenderManager   │  │ControlManager   │ │
│  │ ✓ Orchestrates  │  │ ✓ Visualizes    │  │ ✓ Play/Pause    │ │
│  │   algorithms    │  │   simulations   │  │ ✓ Parameters    │ │
│  │ ✓ Time stepping │  │ ✓ State-driven  │  │ ✓ Camera        │ │
│  │ ✓ Fixed timestep│  │ ✓ Conflict-free │  │ ✓ Graphs        │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                        Uses Core Services
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         CORE                                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │      ECS        │  │  State Mgmt     │  │   Interfaces    │ │
│  │ ✓ Entities      │  │ ✓ GlobalStore   │  │ ✓ IAlgorithm    │ │
│  │ ✓ Components    │  │ ✓ Actions       │  │ ✓ IRenderer     │ │
│  │ ✓ Systems       │  │ ✓ Selectors     │  │ ✓ ISimulation   │ │
│  │ ✓ Time Engine   │  │ ✓ State Sync    │  │ ✓ IParameter    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Layer Responsibilities

### **CORE Layer** 🔧
**Purpose**: Pure abstractions, infrastructure, and shared utilities

**Responsibilities**:
- Define simulation interfaces (`ISimulationAlgorithm`, `ISimulationRenderer`)
- Provide ECS framework (Entity, Component, System)
- Manage global state (GlobalStore, Actions, Selectors)
- Time stepping engine for stable physics
- Mathematical utilities and data structures

**Dependencies**: None (pure abstractions)

**Key Files**:
```
src/core/
├── simulation/
│   ├── interfaces.ts           # Algorithm & renderer interfaces
│   ├── SimulationState.ts      # Immutable simulation state
│   ├── TimeSteppingEngine.ts   # Fixed timestep implementation
│   └── ParameterDefinition.ts  # Parameter type system
├── ecs/
│   ├── Entity.ts
│   ├── Component.ts
│   ├── System.ts
│   └── World.ts
└── state/
    ├── GlobalStore.ts          # Extended with simulation state
    ├── Actions.ts              # Simulation actions
    └── Selectors.ts            # Simulation selectors
```

### **STUDIO Layer** 🎭
**Purpose**: Orchestration, management, and coordination

**Responsibilities**:
- Coordinate simulation execution (`SimulationManager`)
- Manage rendering pipeline (`SimulationRenderManager`)
- Handle user interactions (`SimulationController`)
- Manage parameters (`ParameterManager`)
- Control camera settings (`CameraManager`)
- Update graphs and visualizations (`GraphManager`)

**Dependencies**: Core interfaces, global state

**Key Files**:
```
src/studio/
├── simulation/
│   ├── SimulationManager.ts     # Algorithm orchestration
│   └── SimulationController.ts  # Play/pause/reset logic
├── rendering/
│   └── SimulationRenderManager.ts # State-driven rendering
├── parameters/
│   └── ParameterManager.ts      # Parameter registration & updates
├── camera/
│   └── CameraManager.ts         # Camera settings integration
├── visualization/
│   └── GraphManager.ts          # Real-time graph updates
└── ui/
    └── SimulationUIManager.ts   # UI panel coordination
```

### **PLUGINS Layer** 🔌
**Purpose**: Specific algorithm implementations

**Responsibilities**:
- Implement physics algorithms (`FlagClothAlgorithm`, `WaterDynamicsSystem`)
- Provide specialized renderers (`FlagRenderer`, `WaterRenderer`)
- Define algorithm parameters and constraints
- Create UI controls for parameters
- Register visualization graphs
- Self-register with studio managers

**Dependencies**: Core interfaces, studio managers

**Key Files**:
```
src/plugins/flag-simulation/
├── FlagClothAlgorithm.ts       # Verlet cloth simulation
├── FlagRenderer.ts             # Cloth mesh visualization
├── FlagParameterPanel.ts       # Parameter UI controls
├── FlagGraphs.ts               # Physics metric graphs
└── index.ts                    # Plugin registration
```

---

## Component Integration

### **Data Flow Architecture**

```
Parameter Change → Global State → Algorithm Update → Simulation Step → State Update → Render Update → Graph Update
      ↑                ↑                ↑                ↑                ↑              ↑             ↑
   UI Controls    State Store      SimulationManager  TimeEngine    RenderManager   GraphManager  UI Update
```

### **Integration Points**

#### 1. **Plugin Registration Flow**
```typescript
Plugin.register(context) {
  // 1. Register algorithm with SimulationManager
  context.simulationManager.registerAlgorithm(algorithm);
  
  // 2. Register parameters with ParameterManager  
  context.parameterManager.registerParameters(parameters);
  
  // 3. Register renderer with RenderManager
  context.renderManager.registerRenderer(renderer);
  
  // 4. Register graphs with GraphManager
  context.graphManager.registerGraphs(graphs);
  
  // 5. Register UI controls with UIManager
  context.uiManager.registerUI(ui);
}
```

#### 2. **State Change Propagation**
```typescript
// Parameter change triggers cascade
UI Control Change → Actions.Parameters.updated() → GlobalStore → 
Algorithm.configure() → SimulationManager.markDirty() → 
Next simulation step uses new parameters
```

#### 3. **Simulation Execution Flow**
```typescript
SimulationManager.update() {
  if (!isRunning) return;
  
  timeEngine.step(deltaTime, (fixedDt) => {
    // 1. Get current state
    const state = Selectors.Simulation.getCurrentState(globalStore.getState());
    
    // 2. Run active algorithms
    const newState = algorithms.reduce((s, alg) => alg.step(s, fixedDt), state);
    
    // 3. Update global state
    globalStore.dispatch(Actions.Simulation.stateUpdated(newState));
  });
}
```

---

## Parameter Management

### **Parameter System Design**

#### **Parameter Definition**
```typescript
interface IParameterDefinition {
  name: string;
  type: 'number' | 'boolean' | 'vector' | 'color' | 'enum';
  defaultValue: any;
  constraints?: {
    min?: number;
    max?: number; 
    step?: number;
    options?: string[];
  };
  category: 'physics' | 'visual' | 'algorithm' | 'camera';
  description?: string;
  units?: string;
}
```

#### **Parameter Registration**
```typescript
// Plugin registers parameters during initialization
parameterManager.registerParameter('flag-cloth', {
  name: 'stiffness',
  type: 'number',
  defaultValue: 0.8,
  constraints: { min: 0.1, max: 1.0, step: 0.01 },
  category: 'physics',
  description: 'Cloth structural stiffness',
  units: 'dimensionless'
});
```

#### **Parameter Updates**
```typescript
// Parameter changes flow through state management
UI.onChange(value) → 
Actions.Parameters.updated({algorithmName, paramName, value}) →
GlobalStore → 
ParameterManager.handleParameterChange() →
Algorithm.configure({paramName: value}) →
SimulationManager.markAlgorithmDirty(algorithmName)
```

#### **Parameter Categories**

1. **Physics Parameters** (affect simulation)
   - Gravity, wind force, material properties
   - Triggers simulation recalculation
   - Validated against physical constraints

2. **Algorithm Parameters** (affect computation)
   - Integration method, timestep, precision
   - May require simulation reset
   - Performance impact considerations

3. **Visual Parameters** (affect rendering only)
   - Colors, transparency, wireframe mode
   - No simulation impact
   - Immediate visual update

4. **Camera Parameters** (affect viewpoint)
   - Position, FOV, projection type
   - Handled by CameraManager
   - Immediate graphics update

---

## Simulation Controls

### **Control System Architecture**

#### **SimulationController Responsibilities**
- Manage simulation lifecycle (play/pause/reset)
- Handle speed control and single-stepping
- Coordinate with state management
- Preserve initial state for reset functionality

#### **Control Flow Integration**
```typescript
class SimulationController {
  // State preservation for reset
  private initialState: SimulationState | null = null;
  
  play(): void {
    // Store initial state on first play
    if (!this.initialState) {
      this.initialState = Selectors.Simulation.getCurrentState(
        this.globalStore.getState()
      );
    }
    
    // Update simulation manager
    this.simulationManager.play();
    
    // Update UI state
    this.globalStore.dispatch(Actions.UI.simulationStateChanged({
      isPlaying: true,
      isPaused: false
    }));
  }
  
  reset(): void {
    // Stop simulation
    this.simulationManager.pause();
    
    // Restore initial state
    if (this.initialState) {
      this.globalStore.dispatch(Actions.Simulation.stateReset(this.initialState));
    }
    
    // Clear visualization data
    this.globalStore.dispatch(Actions.Visualization.clearGraphs());
    
    // Update UI
    this.globalStore.dispatch(Actions.UI.simulationStateChanged({
      isPlaying: false,
      isPaused: false,
      isReset: true
    }));
  }
}
```

#### **Control Actions**
```typescript
// Available simulation controls
export namespace Actions {
  export namespace Simulation {
    export const play = () => ({ type: 'SIMULATION_PLAY' });
    export const pause = () => ({ type: 'SIMULATION_PAUSE' });
    export const reset = () => ({ type: 'SIMULATION_RESET' });
    export const step = () => ({ type: 'SIMULATION_STEP' });
    export const setSpeed = (speed: number) => ({
      type: 'SIMULATION_SPEED_CHANGED',
      payload: { speed }
    });
  }
}
```

#### **UI Integration**
```typescript
// Global control UI creation
createSimulationControls(): void {
  const controlsFolder = this.pane.addFolder({ title: 'Simulation Controls' });
  
  // Play/Pause button
  const playPauseButton = controlsFolder.addButton({ 
    title: this.isPlaying ? 'Pause' : 'Play' 
  }).on('click', () => {
    const action = this.isPlaying ? Actions.Simulation.pause() : Actions.Simulation.play();
    this.globalStore.dispatch(action);
  });
  
  // Reset button  
  controlsFolder.addButton({ title: 'Reset' }).on('click', () => {
    this.globalStore.dispatch(Actions.Simulation.reset());
  });
  
  // Speed control
  controlsFolder.addRange('Speed', { speed: 1.0 }, 'speed', {
    min: 0.1, max: 5.0, step: 0.1
  }).on('change', (value) => {
    this.globalStore.dispatch(Actions.Simulation.setSpeed(value.speed));
  });
}
```

---

## Rendering & Visualization

### **State-Driven Rendering Architecture**

#### **Core Principle**: Rendering Reacts to State Changes
- No polling or frame-based updates
- Only re-render when simulation state actually changes
- Clear separation between simulation data and visual representation

#### **Rendering Manager Design**
```typescript
class SimulationRenderManager extends System {
  constructor(graphicsManager: IGraphicsManager, globalStore: any) {
    // Subscribe to relevant state changes only
    this.globalStore.subscribe((newState, prevState, action) => {
      switch (action.type) {
        case 'SIMULATION_STATE_UPDATED':
          this.renderSimulationState(newState.simulation);
          break;
        case 'PARAMETER_CHANGED':
          if (action.payload.category === 'visual') {
            this.updateVisualParameters(action.payload);
          }
          break;
        case 'ENTITY_SELECTION_CHANGED':
          this.updateEntitySelection(action.payload);
          break;
      }
    });
  }
}
```

#### **Algorithm-Specific Renderers**
```typescript
interface ISimulationRenderer {
  readonly algorithmName: string;
  canRender(entity: Entity): boolean;
  render(entities: Entity[], context: RenderContext): void;
  clear(): void;
  dispose(): void;
}

// Example: Flag cloth renderer
class FlagRenderer implements ISimulationRenderer {
  readonly algorithmName = "Flag Cloth Simulation";
  
  canRender(entity: Entity): boolean {
    return entity.hasComponent(FlagComponent) && 
           entity.hasComponent(PositionComponent);
  }
  
  render(entities: Entity[], context: RenderContext): void {
    entities.forEach(entity => {
      if (this.canRender(entity)) {
        this.renderClothMesh(entity, context);
      }
    });
  }
}
```

#### **Conflict Resolution**
- **Single Owner**: Each entity type has exactly one renderer
- **Registration Order**: Later registrations override earlier ones
- **Priority System**: Renderers can specify priority for conflicts
- **Fallback Renderer**: Basic renderer for entities without specialized renderers

#### **Performance Optimizations**
- **Dirty Tracking**: Only re-render changed entities
- **Frustum Culling**: Don't render off-screen entities
- **Level of Detail**: Reduce complexity for distant objects
- **Instanced Rendering**: Batch similar objects

---

## Camera Management

### **Camera System Integration**

#### **Camera Settings Structure**
```typescript
interface CameraSettings {
  position: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
  fov: number;
  near: number;
  far: number;
  type: 'perspective' | 'orthographic';
  controls: {
    enabled: boolean;
    enableDamping: boolean;
    dampingFactor: number;
    enableZoom: boolean;
    autoRotate: boolean;
    autoRotateSpeed: number;
  };
}
```

#### **Parameter Integration**
```typescript
class CameraManager {
  registerCameraParameters(): void {
    // Position controls
    ['x', 'y', 'z'].forEach(axis => {
      this.parameterManager.registerParameter('camera', {
        name: `position_${axis}`,
        type: 'number',
        defaultValue: this.settings.position[axis],
        constraints: { min: -100, max: 100, step: 0.1 },
        category: 'camera'
      });
    });
    
    // FOV control
    this.parameterManager.registerParameter('camera', {
      name: 'fov',
      type: 'number',
      defaultValue: this.settings.fov,
      constraints: { min: 10, max: 160, step: 1 },
      category: 'camera'
    });
    
    // Camera type
    this.parameterManager.registerParameter('camera', {
      name: 'type',
      type: 'enum',
      defaultValue: this.settings.type,
      constraints: { options: ['perspective', 'orthographic'] },
      category: 'camera'
    });
  }
}
```

#### **State-Driven Updates**
```typescript
// Camera responds to parameter changes
onStateChange(newState, prevState, action): void {
  if (action.type === 'PARAMETER_CHANGED' && action.payload.algorithmName === 'camera') {
    this.updateCameraSettings(action.payload);
  }
}

private updateCameraSettings(payload): void {
  const { paramName, value } = payload;
  
  switch (paramName) {
    case 'position_x':
    case 'position_y': 
    case 'position_z':
      this.updateCameraPosition();
      break;
    case 'fov':
      this.updateCameraFOV(value);
      break;
    case 'type':
      this.switchCameraType(value);
      break;
  }
  
  // Immediate graphics update
  this.graphicsManager.render();
}
```

#### **Camera Presets**
```typescript
interface CameraPreset {
  name: string;
  settings: CameraSettings;
  description: string;
}

const CAMERA_PRESETS: CameraPreset[] = [
  {
    name: 'Top View',
    settings: { position: {x: 0, y: 20, z: 0}, target: {x: 0, y: 0, z: 0}, ... },
    description: 'Birds-eye view for 2D-like observation'
  },
  {
    name: 'Side View', 
    settings: { position: {x: 20, y: 0, z: 0}, target: {x: 0, y: 0, z: 0}, ... },
    description: 'Profile view for motion analysis'
  }
];
```

---

## Graph Updates

### **Real-Time Visualization System**

#### **Graph Manager Architecture**
```typescript
class GraphManager {
  private charts: Map<string, Chart> = new Map(); // Chart.js instances
  private dataBuffers: Map<string, DataBuffer> = new Map();
  
  constructor(globalStore: any) {
    // Subscribe to simulation updates
    this.globalStore.subscribe((newState, prevState, action) => {
      this.handleStateUpdate(action);
    });
  }
  
  private handleStateUpdate(action: any): void {
    switch (action.type) {
      case 'SIMULATION_STEP_COMPLETED':
        this.updateSimulationGraphs(action.payload);
        break;
      case 'PARAMETER_CHANGED':
        this.updateParameterGraphs(action.payload);
        break;
      case 'PERFORMANCE_METRICS_UPDATED':
        this.updatePerformanceGraphs(action.payload);
        break;
      case 'VISUALIZATION_CLEAR_GRAPHS':
        this.clearAllGraphs();
        break;
    }
  }
}
```

#### **Graph Registration**
```typescript
// Plugins register their graphs during initialization
registerGraph(algorithmName: string, config: GraphConfig): void {
  const chartId = `${algorithmName}-graph`;
  
  const chart = new Chart(canvas, {
    type: config.type,
    data: {
      datasets: config.datasets.map(dataset => ({
        label: dataset.label,
        data: [],
        borderColor: dataset.color,
        backgroundColor: dataset.color + '20', // Semi-transparent
        tension: 0.1
      }))
    },
    options: {
      responsive: true,
      animation: { duration: 0 }, // No animation for real-time
      interaction: {
        intersect: false,
        mode: 'index'
      },
      scales: {
        x: {
          type: 'realtime',
          realtime: {
            duration: 20000, // 20 seconds of data visible
            refresh: 100,    // Refresh every 100ms
            delay: 50,       // 50ms delay for smoothness
            onRefresh: chart => {
              // Add new data points here
            }
          }
        },
        y: {
          beginAtZero: true
        }
      }
    });
  
  this.charts.set(chartId, chart);
}
```

#### **Data Collection & Updates**
```typescript
private updateSimulationGraphs(payload: any): void {
  const { algorithmName, metrics, timestamp } = payload;
  const chartId = `${algorithmName}-graph`;
  const chart = this.charts.get(chartId);
  
  if (chart) {
    // Add data points to each dataset
    chart.data.datasets.forEach((dataset, index) => {
      const metricName = dataset.label;
      const value = metrics[metricName];
      
      dataset.data.push({
        x: timestamp,
        y: value
      });
    });
    
    // Update chart (no animation for performance)
    chart.update('none');
  }
}
```

#### **Graph Types & Metrics**

**Physics Metrics**:
- Energy conservation (kinetic + potential)
- Force magnitudes and directions
- Constraint violation errors
- Numerical stability indicators

**Performance Metrics**:
- Algorithm execution time per frame
- Memory usage trends
- Entity count over time
- Render performance statistics

**Algorithm-Specific Metrics**:
- Flag: Wind force, cloth tension, vertex velocities
- Water: Particle count, pressure distribution, viscosity effects
- Solar: Orbital velocities, gravitational forces, system energy

---

## State Management Integration

### **Extended State Structure**

#### **Global State Schema**
```typescript
interface GlobalState {
  // Existing state
  entities: EntityState;
  ui: UIState;
  
  // New simulation state
  simulation: {
    currentState: SimulationState;
    isRunning: boolean;
    isPaused: boolean;
    speed: number;
    time: number;
    activeAlgorithms: Set<string>;
  };
  
  // Algorithm parameters
  parameters: {
    [algorithmName: string]: {
      [parameterName: string]: any;
    };
  };
  
  // Camera settings  
  camera: {
    settings: CameraSettings;
    presets: CameraPreset[];
    activePreset: string | null;
  };
  
  // Visualization data
  visualization: {
    graphs: {
      [graphId: string]: GraphData;
    };
    performance: PerformanceMetrics;
  };
}
```

#### **Enhanced Actions**
```typescript
export namespace Actions {
  export namespace Simulation {
    export const stateUpdated = (state: SimulationState) => ({
      type: 'SIMULATION_STATE_UPDATED',
      payload: state,
      timestamp: Date.now()
    });
    
    export const algorithmRegistered = (algorithm: ISimulationAlgorithm) => ({
      type: 'SIMULATION_ALGORITHM_REGISTERED', 
      payload: algorithm,
      timestamp: Date.now()
    });
    
    export const stepCompleted = (algorithmName: string, metrics: any) => ({
      type: 'SIMULATION_STEP_COMPLETED',
      payload: { algorithmName, metrics },
      timestamp: Date.now()
    });
  }
  
  export namespace Parameters {
    export const registered = (algorithmName: string, parameter: IParameterDefinition) => ({
      type: 'PARAMETER_REGISTERED',
      payload: { algorithmName, parameter },
      timestamp: Date.now()
    });
    
    export const updated = (algorithmName: string, paramName: string, value: any) => ({
      type: 'PARAMETER_CHANGED',
      payload: { algorithmName, paramName, value },
      timestamp: Date.now()
    });
  }
  
  export namespace Camera {
    export const settingsChanged = (settings: Partial<CameraSettings>) => ({
      type: 'CAMERA_SETTINGS_CHANGED',
      payload: settings,
      timestamp: Date.now()
    });
    
    export const presetApplied = (presetName: string) => ({
      type: 'CAMERA_PRESET_APPLIED',
      payload: { presetName },
      timestamp: Date.now()
    });
  }
  
  export namespace Visualization {
    export const graphDataUpdated = (graphId: string, data: any[]) => ({
      type: 'GRAPH_DATA_UPDATED',
      payload: { graphId, data },
      timestamp: Date.now()
    });
    
    export const clearGraphs = () => ({
      type: 'VISUALIZATION_CLEAR_GRAPHS',
      timestamp: Date.now()
    });
  }
}
```

#### **Enhanced Selectors**
```typescript
export namespace Selectors {
  export namespace Simulation {
    export const getCurrentState = (state: GlobalState): SimulationState =>
      state.simulation.currentState;
      
    export const isRunning = (state: GlobalState): boolean =>
      state.simulation.isRunning;
      
    export const getActiveAlgorithms = (state: GlobalState): string[] =>
      Array.from(state.simulation.activeAlgorithms);
      
    export const getSimulationTime = (state: GlobalState): number =>
      state.simulation.time;
  }
  
  export namespace Parameters {
    export const getAlgorithmParameters = (state: GlobalState, algorithmName: string) =>
      state.parameters[algorithmName] || {};
      
    export const getParameterValue = (state: GlobalState, algorithmName: string, paramName: string) =>
      state.parameters[algorithmName]?.[paramName];
      
    export const getAllParameters = (state: GlobalState) =>
      state.parameters;
  }
  
  export namespace Camera {
    export const getSettings = (state: GlobalState): CameraSettings =>
      state.camera.settings;
      
    export const getActivePreset = (state: GlobalState): string | null =>
      state.camera.activePreset;
      
    export const getPresets = (state: GlobalState): CameraPreset[] =>
      state.camera.presets;
  }
  
  export namespace Visualization {
    export const getGraphData = (state: GlobalState, graphId: string) =>
      state.visualization.graphs[graphId];
      
    export const getPerformanceMetrics = (state: GlobalState) =>
      state.visualization.performance;
  }
}
```

#### **State Synchronization**
```typescript
// Enhanced state synchronizer
export function createSimulationStateSynchronizer(
  simulationManager: SimulationManager,
  renderManager: SimulationRenderManager,
  parameterManager: ParameterManager,
  cameraManager: CameraManager,
  graphManager: GraphManager
) {
  return {
    // Sync simulation state changes
    onSimulationStateChanged: (newState: SimulationState) => {
      // Update ECS world with new state
      this.updateECSFromSimulationState(newState);
    },
    
    // Sync parameter changes to algorithms
    onParameterChanged: (algorithmName: string, paramName: string, value: any) => {
      const algorithm = simulationManager.getAlgorithm(algorithmName);
      algorithm?.configure({ [paramName]: value });
    },
    
    // Sync camera changes to graphics
    onCameraSettingsChanged: (settings: Partial<CameraSettings>) => {
      cameraManager.applySettings(settings);
    },
    
    // Perform complete synchronization
    performFullSync: () => {
      // Ensure all managers are in sync with global state
      const globalState = globalStore.getState();
      
      // Sync parameters
      Object.entries(globalState.parameters).forEach(([alg, params]) => {
        Object.entries(params).forEach(([param, value]) => {
          this.onParameterChanged(alg, param, value);
        });
      });
      
      // Sync camera
      this.onCameraSettingsChanged(globalState.camera.settings);
    }
  };
}
```

---

## Plugin Architecture

### **Plugin Interface Design**

#### **Complete Plugin Interface**
```typescript
interface ISimulationPlugin extends IPlugin {
  // Core plugin identification
  readonly name: string;
  readonly version: string;
  readonly description: string;
  
  // Plugin components
  getAlgorithms(): ISimulationAlgorithm[];
  getRenderers(): ISimulationRenderer[];
  getParameters(): IParameterDefinition[];
  getUI(): ISimulationUI[];
  getGraphs(): GraphConfig[];
  
  // Lifecycle methods
  register(context: IPluginContext): void;
  unregister(context: IPluginContext): void;
  
  // Optional advanced features
  onParameterChanged?(algorithmName: string, paramName: string, value: any): void;
  onSimulationStateChanged?(state: SimulationState): void;
}
```

#### **Enhanced Plugin Context**
```typescript
interface IPluginContext {
  // Core ECS
  world: IWorld;
  
  // Studio managers
  simulationManager: SimulationManager;
  renderManager: SimulationRenderManager;
  parameterManager: ParameterManager;
  cameraManager: CameraManager;
  graphManager: GraphManager;
  uiManager: SimulationUIManager;
  
  // State management
  globalStore: any;
  
  // Utilities
  logger: Logger;
  eventBus: EventBus;
}
```

#### **Complete Plugin Example**
```typescript
// src/plugins/flag-simulation/index.ts
export class FlagSimulationPlugin implements ISimulationPlugin {
  readonly name = "Flag Cloth Simulation";
  readonly version = "1.0.0";
  readonly description = "Realistic flag cloth physics using Verlet integration";
  
  private algorithm: FlagClothAlgorithm;
  private renderer: FlagRenderer;
  private ui: FlagUI;
  
  constructor() {
    this.algorithm = new FlagClothAlgorithm();
    this.renderer = new FlagRenderer();
    this.ui = new FlagUI();
  }
  
  getAlgorithms(): ISimulationAlgorithm[] {
    return [this.algorithm];
  }
  
  getRenderers(): ISimulationRenderer[] {
    return [this.renderer];
  }
  
  getParameters(): IParameterDefinition[] {
    return [
      {
        name: 'stiffness',
        type: 'number',
        defaultValue: 0.8,
        constraints: { min: 0.1, max: 1.0, step: 0.01 },
        category: 'physics',
        description: 'Cloth structural stiffness coefficient',
        units: 'dimensionless'
      },
      {
        name: 'windStrength',
        type: 'number', 
        defaultValue: 0.1,
        constraints: { min: 0, max: 2.0, step: 0.01 },
        category: 'physics',
        description: 'Wind force magnitude',
        units: 'N/m²'
      },
      {
        name: 'resolution',
        type: 'vector',
        defaultValue: { x: 20, y: 15 },
        constraints: { min: 5, max: 50, step: 1 },
        category: 'algorithm',
        description: 'Cloth mesh resolution',
        units: 'vertices'
      }
    ];
  }
  
  getUI(): ISimulationUI[] {
    return [this.ui];
  }
  
  getGraphs(): GraphConfig[] {
    return [
      {
        id: 'flag-physics',
        title: 'Flag Physics Metrics',
        type: 'line',
        datasets: [
          { label: 'Wind Force', color: '#FF6384' },
          { label: 'Avg Vertex Velocity', color: '#36A2EB' },
          { label: 'Constraint Violations', color: '#FFCE56' }
        ],
        maxDataPoints: 500,
        updateFrequency: 60 // 60 FPS
      }
    ];
  }
  
  register(context: IPluginContext): void {
    // 1. Register algorithm
    context.simulationManager.registerAlgorithm(this.algorithm);
    
    // 2. Register renderer
    context.renderManager.registerRenderer(this.renderer);
    
    // 3. Register parameters
    this.getParameters().forEach(param => {
      context.parameterManager.registerParameter(this.name, param);
    });
    
    // 4. Register UI
    context.uiManager.registerUI(this.ui);
    
    // 5. Register graphs
    this.getGraphs().forEach(graph => {
      context.graphManager.registerGraph(this.name, graph);
    });
    
    // 6. Register ECS components
    context.world.registerComponent(FlagComponent);
    context.world.registerComponent(PoleComponent);
    
    // 7. Set up parameter change listener
    context.globalStore.subscribe((newState, prevState, action) => {
      if (action.type === 'PARAMETER_CHANGED' && 
          action.payload.algorithmName === this.name) {
        this.onParameterChanged(
          action.payload.algorithmName,
          action.payload.paramName,
          action.payload.value
        );
      }
    });
    
    context.logger.log(`✅ ${this.name} plugin registered successfully`);
  }
  
  unregister(context: IPluginContext): void {
    // Clean unregistration in reverse order
    context.graphManager.unregisterGraphs(this.name);
    context.uiManager.unregisterUI(this.ui);
    context.parameterManager.unregisterParameters(this.name);
    context.renderManager.unregisterRenderer(this.renderer);
    context.simulationManager.unregisterAlgorithm(this.algorithm);
    
    context.logger.log(`🗑️ ${this.name} plugin unregistered`);
  }
  
  onParameterChanged(algorithmName: string, paramName: string, value: any): void {
    // Update algorithm configuration
    this.algorithm.configure({ [paramName]: value });
    
    // Optional: Trigger graph update for parameter visualization
    context.graphManager.recordParameterChange(algorithmName, paramName, value);
  }
}
```

### **Plugin Discovery & Loading**
```typescript
class PluginDiscoveryService {
  async loadAllSimulationPlugins(): Promise<ISimulationPlugin[]> {
    const pluginPaths = await this.discoverPlugins();
    const plugins: ISimulationPlugin[] = [];
    
    for (const pluginPath of pluginPaths) {
      try {
        const module = await import(pluginPath);
        const PluginClass = module.default || module[Object.keys(module)[0]];
        
        if (this.isSimulationPlugin(PluginClass)) {
          const plugin = new PluginClass();
          plugins.push(plugin);
          
          // Register plugin
          this.registerPlugin(plugin);
        }
      } catch (error) {
        Logger.getInstance().error(`Failed to load plugin ${pluginPath}:`, error);
      }
    }
    
    return plugins;
  }
  
  private isSimulationPlugin(PluginClass: any): boolean {
    const instance = new PluginClass();
    return typeof instance.getAlgorithms === 'function' &&
           typeof instance.getRenderers === 'function' &&
           typeof instance.register === 'function';
  }
}
```

---

## Implementation Plan

### **Phase 1: Foundation (Week 1-2)**

#### **Core Infrastructure**
1. **Create Core Interfaces** (`src/core/simulation/`)
   - `ISimulationAlgorithm` interface
   - `ISimulationRenderer` interface
   - `IParameterDefinition` interface
   - `SimulationState` class
   - `TimeSteppingEngine` class

2. **Extend State Management** (`src/core/state/`)
   - Add simulation state to GlobalState schema
   - Create simulation-specific Actions
   - Create simulation-specific Selectors
   - Update state synchronizer

3. **Introduce Dependency Injection**
   - Use a DI container for managing dependencies (e.g., InversifyJS).
   - Register core services and managers in the container.

4. **Create Studio Managers** (`src/studio/`)
   - `SimulationManager` - algorithm orchestration
   - `SimulationController` - play/pause/reset logic
   - `ParameterManager` - parameter registration & updates
   - Basic structure, full implementation in later phases

#### **Testing & Validation**
- Unit tests for core interfaces
- State management tests
- Integration tests for manager communication

---

### **Phase 2: Simulation System (Week 3-4)**

#### **SimulationManager Implementation**
1. **Algorithm Registration System**
   - Plugin algorithm registration
   - Algorithm lifecycle management
   - Fixed timestep execution
   - State update coordination

2. **TimeSteppingEngine**
   - Stable numerical integration
   - Configurable timestep size
   - Accumulator-based timing
   - Performance monitoring

3. **SimulationController**
   - Play/pause functionality
   - Reset to initial state
   - Speed control
   - Single-step execution

#### **Parameter System**
1. **ParameterManager Implementation**
   - Parameter registration from plugins
   - Type validation and constraints
   - State integration
   - UI binding preparation

2. **Parameter Categories**
   - Physics parameters (affect simulation)
   - Algorithm parameters (affect computation)
   - Visual parameters (affect rendering only)
   - Camera parameters (affect viewpoint)

#### **Testing & Validation**
- Algorithm execution tests
- Parameter change propagation tests
- Time stepping accuracy tests
- State consistency tests

---

### **Phase 3: Plugin System (Week 5-6)**

#### **Plugin Interface Enhancements**
1. **Define Plugin Lifecycle Hooks**
   - `onLoad`, `onUnload`, `onParameterChanged`, `onSimulationStateChanged`.

2. **Add Plugin Metadata**
   - Include versioning, dependencies, and compatibility information.

3. **Introduce Plugin Registry**
   - Centralized registry for dynamic plugin loading and unloading.
   - Validate plugin dependencies and compatibility during registration.

4. **Plugin Discovery Service**
   - Implement a service to discover and load plugins dynamically.
   - Support for lazy loading and unloading of plugins.

#### **Testing & Validation**
- Plugin lifecycle tests
- Dynamic loading/unloading tests
- Dependency resolution tests

---

### **Phase 4: Rendering System (Week 7-8)**

#### **SimulationRenderManager Implementation**
1. **State-Driven Rendering**
   - Subscribe to simulation state changes
   - Render only when state changes
   - Entity-to-renderer mapping
   - Conflict resolution system

2. **Renderer Registration**
   - Plugin renderer registration
   - Component signature matching
   - Priority-based selection
   - Fallback renderer for unhandled entities

3. **Performance Optimization**
   - Dirty entity tracking
   - Frustum culling integration
   - Level-of-detail system
   - Instanced rendering support

#### **Camera System**
1. **CameraManager Implementation**
   - Camera parameter registration
   - Settings update handling
   - Preset management
   - Graphics integration

2. **Camera Controls Integration**
   - Position/rotation controls
   - FOV and projection controls
   - Orbit controls integration
   - State synchronization

#### **Testing & Validation**
- Rendering system tests
- Camera control tests
- Performance benchmarks
- Visual regression tests

---

### **Phase 5: Simulation Framework (Week 9-10)**

#### **Unified Simulation Framework**
1. **Reusable Components**
   - Time-stepping engine
   - State synchronization utilities
   - Debugging and profiling tools

2. **Multi-Threading Support**
   - Use Web Workers for performance-critical tasks.
   - Offload heavy computations to separate threads.

3. **Simulation Debugging Tools**
   - Real-time state inspection
   - Performance profiling
   - Error visualization

#### **Testing & Validation**
- Framework functionality tests
- Multi-threading performance tests
- Debugging tool usability tests

---

### **Phase 6: Visualization & UI (Week 11-12)**

#### **Graph System Implementation**
1. **GraphManager**
   - Real-time graph updates
   - Chart.js integration
   - Data buffer management
   - Multiple graph types support

2. **Graph Registration**
   - Plugin graph registration
   - Metric data collection
   - Update frequency control
   - Graph clearing on reset

#### **UI System Enhancement**
1. **SimulationUIManager**
   - Plugin UI registration
   - Parameter control generation
   - Control update handling
   - Layout management

2. **UI Integration**
   - Tweakpane integration
   - Control binding to parameters
   - Real-time value updates
   - Validation and error handling

#### **Testing & Validation**
- Graph update tests
- UI interaction tests
- Parameter binding tests
- User experience testing

---

### **Phase 7: Integration & Polish (Week 13-14)**

#### **System Integration**
1. **End-to-End Testing**
   - Complete workflow testing
   - Memory leak detection

2. **Error Handling & Robustness**
   - Graceful error recovery
   - User error feedback

#### **Documentation & Polish**
1. **Developer Documentation**
   - API documentation
   - Troubleshooting guide

2. **User Interface Polish**
   - UI/UX improvements
   - Performance optimizations

3. **Performance Optimization**
   - Profiling and optimization
   - Algorithm optimization

#### **Deployment Preparation**
- Build system updates
- Development server configuration
- Production optimization
- Testing automation

---

## Conclusion

This updated implementation plan ensures:

✅ **Modular System Design**: Clear boundaries and reusable components
✅ **Clean Code Practices**: Enforced standards and documentation
✅ **Robust Plugin System**: Dynamic loading, metadata, and lifecycle hooks
✅ **Unified Simulation Framework**: Reusable and performance-optimized
✅ **Separation of Concerns**: Decoupled layers and event-driven communication
