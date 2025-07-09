# Task: Implement Viewport (Camera) Controls

- **Status:** Not Started
- **Assignee:** Unassigned
- **Priority:** High
- **Creation Date:** 2025-07-09
- **Related Epic/Feature:** [Feature: Studio UI/UX Enhancements]

---

## 1. Overview & Goal

This task is to implement intuitive camera controls for the main simulation viewport. The goal is to empower the user to easily navigate the 3D space by adding zoom, pan (move), and rotate functionalities. This will significantly improve the user's ability to inspect and interact with the simulations. New controls will be added to the main studio panel to support these actions.

## 2. Architectural Context

- **Relevant Architectural Document:** [Link to ARCHITECTURE.md](./../architecture/ARCHITECTURE.md)
- **Key Architectural Principles to Uphold:**
  - [x] **Decoupling:** The camera control logic should be handled in a dedicated system or manager, separate from the core rendering loop and simulation systems. It will directly manipulate the camera object used by the `RenderSystem`.
  - [ ] **ECS Compliance:** While the camera itself might not be a traditional ECS entity, its state (position, rotation) can be managed by a dedicated system that responds to user input events.

## 3. Technical Requirements & Implementation Plan

1.  **File(s) to be Created/Modified:**

    - `src/studio/systems/RenderSystem.ts`: To be modified to incorporate the new camera controls.
    - `src/studio/uiManager.ts`: To add new buttons to the main control panel.
    - `src/studio/styles/studio.css`: To style the new UI buttons.
    - `src/studio/CameraControlSystem.ts` (New File): A new system to handle camera logic based on user input.

2.  **Step-by-Step Implementation:**

    - **Step 1: Implement Camera Control Logic:** Create a `CameraControlSystem` or similar handler that listens for mouse events (mousedown, mousemove, mousewheel/scroll) on the main canvas.
    - **Step 2: Implement Rotation:** On left-click and drag, update the camera's orbital rotation around a target point (e.g., the scene origin).
    - **Step 3: Implement Panning:** On right-click and drag, move the camera's position and its target point along the camera's local X and Y axes.
    - **Step 4: Implement Zooming:** On mouse wheel scroll, move the camera closer to or further from its target point.
    - **Step 5: Integrate with RenderSystem:** The `CameraControlSystem` will update the main camera object that is used by the `RenderSystem` in each frame.
    - **Step 6: Add UI Buttons:** In `uiManager.ts`, add new buttons to the main studio panel, such as "Reset View".
    - **Step 7: Style Buttons:** In `studio.css`, add styles for the new buttons to ensure they are consistent with the existing UI design.

3.  **Dependencies:**
    - This task does not depend on any other ongoing tasks.
    - It may require a library for 3D math/camera controls (e.g., `three-orbit-controls` if using Three.js), but the goal is to implement it from scratch first if feasible.

## 4. Acceptance Criteria

- [ ] The user can rotate the camera around the scene's center by left-clicking and dragging.
- [ ] The user can pan the camera (move horizontally and vertically) by right-clicking and dragging.
- [ ] The user can zoom in and out using the mouse scroll wheel.
- [ ] A "Reset View" button is present in the main studio panel, and clicking it returns the camera to its default position and rotation.
- [ ] The controls feel intuitive and responsive.
- [ ] The new UI elements are styled consistently with the rest of the application.

## 5. Testing Plan

- **Unit Tests:**
  - [ ] Test the core logic of the `CameraControlSystem` to ensure input events correctly translate to camera transformations.
- **Integration Tests:**
  - [ ] Test that the `CameraControlSystem` correctly modifies the camera object used by the `RenderSystem`.
- **End-to-End (E2E) Tests:**
  - [ ] Create an E2E test that simulates a user performing a sequence of camera manipulations (rotate, pan, zoom) and verifies the final camera state.
  - [ ] Test the "Reset View" button functionality in an E2E test.

## 6. UI/UX Considerations (If Applicable)

- **New Controls:**
  - **Mouse Left-Drag:** Rotate view.
  - **Mouse Right-Drag:** Pan view.
  - **Mouse Wheel Scroll:** Zoom view.
  - **"Reset View" Button:** A new icon button on the main panel.
- The rotation should feel like orbiting a central point, not rotating the camera on its own axis.

## 7. Notes & Open Questions

- We should decide on the default camera position and orientation. A slightly angled, top-down perspective is often a good starting point for physics simulations.
- Should we consider adding other camera modes, like a first-person or orthographic view, in the future? For now, a single perspective orbit camera is sufficient.
