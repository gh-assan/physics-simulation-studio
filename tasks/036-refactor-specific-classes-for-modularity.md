# Task: Refactor Specific Classes for Modularity and SRP Compliance

-   **Status:** Not Started
-   **Assignee:** Unassigned
-   **Priority:** High
-   **Creation Date:** 2025-07-13
-   **Related Epic/Feature:** Architectural Compliance & Core Refactoring
-   **Related Task:** [035-refactor-ecs-plugin-architecture-for-simplicity.md](./035-refactor-ecs-plugin-architecture-for-simplicity.md)

---

## 1. Overview & Goal

This task focuses on the practical application of the architectural principles outlined in Task 035, specifically addressing "Code Modularity & Readability" and "Decoupling & Separation of Concerns" by refactoring identified overly long or multi-responsible classes. The goal is to break down these classes into smaller, single-purpose units, improving maintainability, testability, and overall code clarity.

## 2. Targeted Classes & Detailed Analysis

This section details the analysis of specific classes identified as violating the Single Responsibility Principle or having opportunities for improved modularity.

### 2.1. `src/core/ecs/World.ts` - Completed

*   **Current State:** The `World` class acts as the central orchestrator of the ECS architecture, delegating most operations to `EntityManager`, `ComponentManager`, and `SystemManager`.
*   **Violations/Concerns:**
    *   **Unused Parameter in `registerComponent`:** The `componentName` parameter is present but unused, indicating an unnecessary API surface.
    *   **Incomplete `destroyEntity` Logic:** The `destroyEntity` method currently destroys the entity but does not fully ensure all associated components are removed, which is a critical part of entity destruction in an ECS.
*   **Refactor Goals:**
    *   **Simplify `registerComponent`:** Remove the unused `componentName` parameter from `registerComponent` to streamline its API.
    *   **Complete `destroyEntity`:** Ensure `destroyEntity` fully cleans up all components associated with the destroyed entity by coordinating with `ComponentManager`.

### 2.2. `src/core/ecs/ComponentManager.ts` - Completed

*   **Current State:** Responsible for managing components (registration, addition, retrieval, removal, querying).
*   **Violations/Concerns:**
    *   **`registerComponent` Overload Complexity:** The `registerComponent` method handles both string names and class constructors, suggesting legacy or dual-purpose design that could be simplified to a single, class-based registration.
    *   **Missing `removeAllComponentsForEntity`:** Lacks a dedicated method to remove all components for a given entity, which is needed by `World.ts`.
    *   **Scattered Logging:** Contains direct `console.log` and `console.warn` calls, violating the centralized logging principle.
*   **Refactor Goals:**
    *   **Add `removeAllComponentsForEntity`:** Implement a new public method `removeAllComponentsForEntity(entityId: number): void` to facilitate complete entity cleanup.
    *   **Simplify `registerComponent` (Future):** Align `registerComponent` to primarily use component classes with a static `type` property, as per the "Data-Driven Design" principle.
    *   **Centralize Logging:** Replace all direct `console.log`/`console.warn` calls with the centralized `Logger` instance.

### 2.3. `src/core/plugin/PluginManager.ts`

*   **Current State:** Manages plugin lifecycle (registration, activation, deactivation), dependencies, and events.
*   **Violations/Concerns:**
    *   **Scattered Logging:** Contains direct `console.log` and `console.error` calls.
    *   **Direct `EventEmitter` Exposure (Minor):** While managing events is its role, directly exposing the generic `EventEmitter.on` could be refined for more explicit event subscriptions.
*   **Refactor Goals:**
    *   **Centralize Logging:** Replace all direct `console.log`/`console.error` calls with the centralized `Logger` instance.
    *   **Refine Event API (Minor):** Consider exposing more specific event subscription methods (e.g., `onPluginActivated`) instead of a generic `on` for better API clarity.

### 2.4. `src/studio/systems/PropertyInspectorSystem.ts`

*   **Current State:** An ECS System responsible for updating the property inspector UI based on selected entities or active simulations. It mixes ECS system logic with direct UI rendering concerns, property inference, and conditional logic based on plugin types.
*   **Violations/Concerns:**
    *   **Mixed Responsibilities (SRP Violation):**
        *   Acts as an ECS System (updates based on world state).
        *   Directly manipulates UI (`uiManager.clearControls`, `uiManager.registerComponentControls`).
        *   Contains logic for finding and using `ParameterPanelComponent`s.
        *   Includes fallback logic for property display if no parameter panel is found.
        *   Filters components based on hardcoded names (`SelectableComponent`, `RenderableComponent`).
        *   Filters components based on `simulationType`.
    *   **Tight Coupling:** Highly coupled to `UIManager`, `PluginManager`, `Studio`, and `SelectionSystem`.
    *   **Complex Conditional Logic:** The `update` and `registerComponentControls` methods contain significant conditional branching.
    *   **Manual Property Handling:** Relies on `getComponentProperties` and then manually iterates/filters, rather than a fully data-driven approach.
*   **Refactor Goals:**
    *   **Decouple UI from ECS System:** `PropertyInspectorSystem` should primarily *expose* data for UI consumption, not *render* UI elements. Its role should be to identify *what* needs to be displayed (e.g., selected entity's components and their properties) and notify a dedicated UI layer.
    *   **Introduce a Property Inspector UI Manager/Service:** A new service should be responsible for the actual rendering of properties based on the `ComponentPropertyRegistry`. `PropertyInspectorSystem` would then interact with this service.
    *   **Streamline Property Registration:** Leverage the formalized `ComponentPropertyRegistry` (from Task 035) to dynamically generate UI, removing manual property inference and fallback logic.
    *   **Externalize Filtering Logic:** Move component filtering (e.g., skipping `SelectableComponent`, `RenderableComponent`, or filtering by `simulationType`) into reusable utility functions or a dedicated component filter service.
    *   **Centralize Logging:** Replace all `Logger.log` and `Logger.warn` calls with the centralized `Logger` instance.

### 2.5. `src/studio/Studio.ts`

*   **Current State:** This class acts as a central application orchestrator, managing simulation loading/unloading, play/pause/reset states, and dispatching UI-related events.
*   **Violations/Concerns:**
    *   **Mixed Orchestration and Event Dispatching:** It orchestrates core simulation lifecycle events (`loadSimulation`, `play`, `pause`, `reset`) but also directly dispatches browser-specific `CustomEvent`s via `window.dispatchEvent`.
    *   **Redundant State Management:** Manages `_activePluginName` alongside `selectedSimulation.setSimulation(pluginName)`, potentially leading to state inconsistencies.
    *   **Direct Plugin Interaction:** Directly calls `plugin.initializeEntities(this.world)` and `plugin.getRenderer()`, which could be abstracted.
    *   **Tight Coupling:** Coupled to `World`, `PluginManager`, `RenderSystem`, and `SelectedSimulationStateManager`.
*   **Refactor Goals:**
    *   **Extract Simulation Orchestration Logic:** Create a dedicated `SimulationOrchestrator` (or similar) class responsible solely for the complex logic of loading, activating, initializing, and unloading simulations/plugins. `Studio.ts` would then delegate these operations.
    *   **Abstract Plugin Interactions:** Interact with plugins through more abstract interfaces or commands, rather than direct method calls where possible.
    *   **Centralize Logging:** Replace all `Logger.log` and `Logger.error` calls with the centralized `Logger` instance.

### 2.6. `src/studio/uiManager.ts`

*   **Current State:** Manages the Tweakpane UI, including adding folders and registering component controls. It also handles property inference and event dispatching.
*   **Violations/Concerns:**
    *   **Tight Coupling to `tweakpane`:** While its primary role is to manage the UI, its methods are very tightly coupled to the `tweakpane` library's API (`Pane`, `FolderApi`, `addBinding`).
    *   **Direct Browser Event Dispatching:** Directly dispatches `CustomEvent`s via `window.dispatchEvent` on parameter changes, coupling UI logic to global browser events.
    *   **Property Inference/Filtering Logic:** The `registerComponentControls` method contains logic for inferring properties (e.g., `for (const key in data)`) and filtering specific keys (`key !== "particles"`), which is a data preparation concern, not a UI rendering concern.
    *   **Scattered Logging:** Contains direct `console.log` and `console.warn` calls.
*   **Refactor Goals:**
    *   **Decouple Event Dispatching:** Replace direct `window.dispatchEvent` calls with an injected `ApplicationEventBus` instance, ensuring UI events are routed through a centralized, testable mechanism.
    *   **Refine Property Inference/Filtering:** Extract the logic for preparing `ComponentControlProperty[]` (including inference and filtering of specific keys) into a separate utility or service. `UIManager` should receive a pre-processed, ready-to-render list of properties.
    *   **Centralize Logging:** Replace all `console.log` and `console.warn` calls with the centralized `Logger` instance.
    *   **Consider UI Abstraction (Future):** For long-term extensibility, consider introducing an abstraction layer over `tweakpane` if the project anticipates supporting multiple UI frameworks. (This is a lower priority for this task).

### 2.7. `src/studio/graphics/ThreeGraphicsManager.ts`

*   **Current State:** Responsible for setting up the Three.js scene, camera, renderer, lights, helpers, managing camera controls (`OrbitControls`), and handling window resize events.
*   **Violations/Concerns:**
    *   **Multiple Responsibilities (SRP Violation):**
        *   **Scene Setup:** Creates and configures the `THREE.Scene`, including adding lights and helpers.
        *   **Renderer Management:** Initializes and manages `THREE.WebGLRenderer`, including appending its `domElement` to `document.body`.
        *   **Camera Management:** Initializes and positions `THREE.PerspectiveCamera`.
        *   **Input/Control Management:** Initializes and manages `OrbitControls`, including enabling/disabling them.
        *   **Global Event Listening:** Attaches a `resize` event listener to `window`.
        *   **Rendering Loop:** Contains the `render` method.
    *   **Tight Coupling to Global Objects:** Directly interacts with `window` and `document.body`.
    *   **Scattered Logging:** Contains direct `console.error` calls.
*   **Refactor Goals:**
    *   **Separate Scene/Environment Setup:** Extract the creation and initial configuration of `THREE.Scene` (including lights and helpers) into a dedicated `SceneBuilder` or `EnvironmentInitializer` class. `ThreeGraphicsManager` should *receive* a pre-configured scene.
    *   **Decouple Renderer Initialization:** The `THREE.WebGLRenderer` should be initialized and its `domElement` managed by a higher-level application bootstrap or a dedicated `RendererProvider`. `ThreeGraphicsManager` should *receive* the renderer instance and its `domElement`.
    *   **Externalize Camera Controls Management:** Encapsulate `OrbitControls` instantiation, configuration, and `toggleControls` logic within a separate `OrbitControlsManager` class. `ThreeGraphicsManager` would then interact with this manager.
    *   **Externalize Global Event Handling:** Move the `window.addEventListener("resize", ...)` logic to a dedicated `WindowResizeHandler` or `ApplicationEventBus` that `ThreeGraphicsManager` can subscribe to, rather than managing it directly.
    *   **Centralize Logging:** Replace all `console.error` calls with the centralized `Logger` instance.
    *   **Focus on Core Rendering:** After refactoring, `ThreeGraphicsManager` should primarily focus on orchestrating the rendering process (calling `renderer.render`) and managing the scene and camera it receives.

## 3. Implementation Plan

The refactoring of these classes should be approached incrementally, potentially as separate pull requests, to minimize disruption and facilitate review.

1.  **Prioritize Core Dependencies:** Start with classes that have fewer outgoing dependencies or are foundational (e.g., `World.ts`, `ComponentManager.ts` refinements).
2.  **Extract Responsibilities:** For each targeted class, identify distinct responsibilities and extract them into new, single-purpose classes or modules.
3.  **Introduce Interfaces:** Define clear interfaces for new services or managers to promote loose coupling and testability.
4.  **Update Dependencies:** Modify existing classes to use the new, extracted components via dependency injection where appropriate.
5.  **Replace Direct Calls:** Substitute direct `console.log`/`console.warn`/`console.error` calls with the centralized `Logger`. Replace `window.dispatchEvent` with an `ApplicationEventBus`.
6.  **Update Tests:** Ensure existing tests are updated and new tests are written for the extracted functionalities and new classes.

## 4. Acceptance Criteria

-   Each targeted class (`World.ts`, `ComponentManager.ts`, `PluginManager.ts`, `PropertyInspectorSystem.ts`, `Studio.ts`, `UIManager.ts`, `ThreeGraphicsManager.ts`) demonstrates a clearer adherence to the Single Responsibility Principle.
-   Responsibilities identified in the "Refactor Goals" for each class are successfully extracted into new, well-defined modules or classes.
-   Tight couplings are reduced through dependency injection and abstract interfaces.
-   All direct `console.log`/`console.warn`/`console.error` calls are replaced with the centralized `Logger`.
-   Direct `window.dispatchEvent` calls are replaced with an `ApplicationEventBus`.
-   The codebase is more modular, readable, and testable.
-   All existing tests pass, and new tests cover the refactored code.

---
