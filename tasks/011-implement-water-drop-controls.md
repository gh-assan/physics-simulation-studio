# Task: Implement UI Controls for Water Drop Simulation

- **Status:** Not Started
- **Assignee:** Unassigned
- **Priority:** Medium
- **Creation Date:** 2025-07-09
- **Related Epic/Feature:** [Task: 010-implement-water-drop-simulation.md](./010-implement-water-drop-simulation.md)

---

## 1. Overview & Goal

This task focuses on creating and integrating UI controls into the property inspector for the water drop simulation. These controls will allow users to dynamically adjust the simulation's parameters in real-time, enhancing interactivity and experimentation. This task builds directly on the foundation laid by the water drop simulation implementation.

## 2. Architectural Context

- **Relevant Architectural Document:** [Link to ARCHITECTURE.md](./../architecture/ARCHITECTURE.md)
- **Key Architectural Principles to Uphold:**
  - [X] **ECS Compliance:** The UI controls will interact with ECS components by reading and writing property data.
  - [X] **Decoupling:** The UI controls, managed by the `PropertyInspectorSystem`, will remain decoupled from the `WaterSystem`. They will communicate indirectly by modifying shared component data.
  - [X] **Data-Driven Design:** The UI will be dynamically generated based on the properties of the selected entity's components.

## 3. Technical Requirements & Implementation Plan

1.  **File(s) to be Created/Modified:**
    - `src/studio/systems/PropertyInspectorSystem.ts`: Modify to recognize and create UI for the new water components.
    - `src/plugins/water-simulation/WaterComponents.ts`: Ensure properties are exposed in a way that the UI can consume them.

2.  **Step-by-Step Implementation:**
    - **Step 1: Expose Component Properties:** In `WaterComponents.ts`, ensure the properties of `WaterBodyComponent` and `WaterDropletComponent` (e.g., `viscosity`, `dropletSize`, `fallHeight`) are public and well-defined.
    - **Step 2: Extend Property Inspector:** In `PropertyInspectorSystem.ts`, add logic to detect when the selected entity has a `WaterBodyComponent` or `WaterDropletComponent`.
    - **Step 3: Generate UI Controls:** For each detected component, dynamically generate the appropriate UI controls (e.g., sliders for numerical values) using the Tweakpane library.
    - **Step 4: Bind UI to Component Data:** Bind the UI controls to the component properties. Changes in the UI should immediately update the data in the component instance for the selected entity.
    - **Step 5: Real-time Feedback:** Ensure that changes made via the UI controls are reflected in the running simulation without requiring a restart.

3.  **Dependencies:**
    - This task depends on the completion of **Task 010: Implement Water Drop Simulation**.
    - No new third-party libraries are required.

## 4. Acceptance Criteria

- [ ] When an entity with a `WaterDropletComponent` is selected, the property inspector displays controls for "Droplet Size" and "Fall Height".
- [ ] When an entity with a `WaterBodyComponent` is selected, the property inspector displays a control for "Water Viscosity".
- [ ] Modifying the value in a UI control updates the corresponding property in the correct component instance.
- [ ] The running simulation visually reflects the updated property values in real-time.
- [ ] The new UI controls match the existing style and theme of the studio.

## 5. Testing Plan

- **Unit Tests:**
  - [ ] Add tests to `PropertyInspectorSystem.test.ts` to verify that it correctly identifies the new water components.
- **Integration Tests:**
  - [ ] Test the full loop: selecting an entity, seeing the controls, changing a value, and verifying the underlying component data has been updated.
- **End-to-End (E2E) Tests:**
  - [ ] Create an E2E test that:
    1.  Starts the water simulation.
    2.  Selects the water droplet entity.
    3.  Uses the UI to change the droplet size.
    4.  Verifies that the rendered droplet visually changes in size.

## 6. UI/UX Considerations (If Applicable)

- **Controls to be added:**
  - **Droplet Size:** Slider, range: 0.1 to 2.0.
  - **Fall Height:** Slider, range: 5 to 20.
  - **Water Viscosity:** Slider, range: 0.1 to 1.0.
- The controls should be clearly labeled and grouped under their respective component names in the property inspector.

## 7. Notes & Open Questions

- We need to ensure that the real-time updates do not cause performance issues, especially if parameters are changed rapidly. Throttling or debouncing the input events might be necessary if performance is impacted.
