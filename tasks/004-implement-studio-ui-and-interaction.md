# Task: Implement Studio UI and Interaction

- **Status:** Not Started
- **Assignee:** Unassigned
- **Priority:** High
- **Creation Date:** 2025-07-08
- **Related Epic/Feature:** Studio UI and Interaction

---

## 1. Overview & Goal

This task focuses on building the user-facing components of the Physics Simulation Studio. It involves integrating a rendering engine (Three.js for 3D), implementing the data-driven Property Inspector using Tweakpane, and developing the Scene Serializer for saving, loading, and sharing simulation scenes. This will transform the underlying ECS and plugin system into an interactive and visually engaging application.

## 2. Architectural Context

This task directly implements Section 3.2 (Rendering Engine) and Section 3.3 (UI Control Panel) and Section 4 (UI/UX and Generic Parameters) of the `tech-spec.md`.

- **Relevant Architectural Document:** [ARCHITECTURE.md](./../architecture/ARCHITECTURE.md)
- **Key Architectural Principles to Uphold:**
  - [X] **ECS Compliance:** The UI will interact with ECS components and systems.
  - [X] **Plugin Modularity:** The UI must be able to dynamically adapt to components and systems registered by plugins.
  - [X] **Decoupling:** Rendering logic must be strictly separated from simulation logic. The UI should be decoupled from specific component implementations.
  - [X] **Data-Driven Design:** The Property Inspector will be dynamically generated based on component metadata.

## 3. Technical Requirements & Implementation Plan

1.  **File(s) to be Created/Modified:**
    - `src/studio/uiManager.ts` (Actual UIManager implementation)
    - `src/studio/systems/RenderSystem.ts`
    - `src/studio/systems/PropertyInspectorSystem.ts`
    - `src/studio/systems/SceneSerializer.ts`
    - `src/studio/main.ts` (Main application entry point)
    - `src/studio/index.ts` (Barrel file)
    - `src/core/components/RenderableComponent.ts` (New core component)
    - `src/core/components/index.ts` (Update barrel file)
    - `index.html` (Main HTML file for the application)

2.  **Step-by-Step Implementation:**
    - **Step 1: Setup HTML and Entry Point:** Create `index.html` and `src/studio/main.ts` as the application entry point. Initialize the `World` and `PluginManager`.
    - **Step 2: Install Three.js and Tweakpane:** Add `three` and `tweakpane` to `package.json`.
    - **Step 3: Implement `RenderableComponent`:** Define a `RenderableComponent` in `src/core/components/` to hold visual asset information (e.g., geometry type, color).
    - **Step 4: Implement `UIManager`:** Create the concrete `UIManager` class in `src/studio/uiManager.ts`. This will manage the Tweakpane instance and provide methods for registering component controls.
    - **Step 5: Implement `RenderSystem`:** Create `src/studio/systems/RenderSystem.ts`. This system will:
        - Initialize a Three.js scene, camera, and renderer.
        - Query for entities with `PositionComponent`, `RotationComponent`, and `RenderableComponent`.
        - Create/update Three.js meshes based on `RenderableComponent` data and synchronize their transforms with `PositionComponent` and `RotationComponent`.
        - Render the scene.
    - **Step 6: Implement `PropertyInspectorSystem`:** Create `src/studio/systems/PropertyInspectorSystem.ts`. This system will:
        - Listen for entity selection events.
        - Dynamically generate Tweakpane controls for the selected entity's components based on component metadata (e.g., `min`, `max`, `label`).
    - **Step 7: Implement `SceneSerializer`:** Create `src/studio/systems/SceneSerializer.ts`. This system will:
        - Serialize the ECS `World` state into a JSON object.
        - Provide methods for saving to and loading from local files (using File System Access API).
        - Implement URL parameter encoding/decoding for scene sharing.
    - **Step 8: Integrate into `main.ts`:** Orchestrate the initialization of all systems and managers in `src/studio/main.ts`.

3.  **Dependencies:**
    - This task depends on the successful completion of `001-implement-core-ecs-framework.md`, `002-implement-plugin-system.md`, and `003-implement-rigid-body-plugin.md`.

## 4. Acceptance Criteria

- [ ] A basic HTML page (`index.html`) loads the application.
- [ ] A Three.js canvas is rendered on the screen.
- [ ] `RenderableComponent` is defined and can be added to entities.
- [ ] The `RenderSystem` successfully renders entities with `PositionComponent`, `RotationComponent`, and `RenderableComponent`.
- [ ] The `UIManager` is initialized and can create a Tweakpane instance.
- [ ] Selecting an entity dynamically populates the Tweakpane Property Inspector with controls for its components.
- [ ] Changing values in the Property Inspector updates the corresponding component data in the ECS.
- [ ] A scene can be saved to a JSON file.
- [ ] A scene can be loaded from a JSON file, correctly reconstructing the ECS world.
- [ ] A scene can be shared via URL parameters (encoded/decoded).
- [ ] All new code is formatted correctly and passes the linter.

## 5. Testing Plan

- **Unit Tests:**
  - [ ] `RenderableComponent.test.ts`: Verify component data storage.
  - [ ] `UIManager.test.ts`: Test Tweakpane initialization and control registration (mocking Tweakpane).
  - [ ] `SceneSerializer.test.ts`: Test serialization and deserialization of mock ECS data.
- **Integration Tests:**
  - [ ] `RenderSystem.test.ts`: Test that the system correctly creates/updates Three.js objects based on ECS data.
  - [ ] `PropertyInspectorSystem.test.ts`: Test dynamic UI generation and data binding (mocking Tweakpane and entity selection).
  - [ ] End-to-end test for saving/loading a simple scene.

## 6. UI/UX Considerations

- The main viewport will occupy the majority of the screen.
- A collapsible sidebar will house the Property Inspector and potentially a scene graph.
- Basic controls (play/pause, reset) will be available.

## 7. Notes & Open Questions

- Initial rendering can be simple (e.g., colored cubes for rigid bodies).
- The `UIManager` will need a way to register custom control types for specific components.
- The `SceneSerializer` will need to handle different component types and their data structures.
