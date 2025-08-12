# Task: Implement Flag Pole Attachment

- **Status:** Not Started
- **Assignee:** Unassigned
- **Priority:** Medium
- **Creation Date:** 2025-07-11
- **Related Epic/Feature:** Flag Simulation

---

## 1. Overview & Goal

Implement a feature to attach the flag simulation to a static pole. This enhances realism by providing a fixed anchor point for the flag, allowing for more realistic wind and gravity interactions as the flag drapes and waves from the pole.

## 2. Architectural Context

_[This section connects the task to the project's established architecture. Refer to the main architectural documents.]_

- **Relevant Architectural Document:** [Link to ARCHITECTURE.md](./../architecture/ARCHITECTURE.md)
- **Key Architectural Principles to Uphold:**
  - [x] **ECS Compliance:** Introduce a new `PoleComponent` if the pole is a distinct entity. Modify `FlagComponent`, `FlagSystem`, and `FlagRenderer` to integrate pole attachment while adhering to ECS principles.
  - [x] **Plugin Modularity:** All changes must be self-contained within the `flag-simulation` plugin directory.
  - [x] **Decoupling:** Ensure physics logic for flag attachment (in `FlagSystem` and `FlagPhysicsInitializer`) remains decoupled from rendering logic (in `FlagRenderer`).
  - [x] **Data-Driven Design:** Pole properties (position, height, radius) should be configurable via component properties.

## 3. Technical Requirements & Implementation Plan

_[Provide a detailed, step-by-step plan for implementation. Break down the problem into smaller, manageable steps.]_

1.  **File(s) to be Created/Modified:**

    - `src/plugins/flag-simulation/PoleComponent.ts` (New file)
    - `src/plugins/flag-simulation/FlagComponent.ts` (Add reference to pole entity/attachment info)
    - `src/plugins/flag-simulation/FlagSystem.ts` (Update physics to handle fixed points)
    - `src/plugins/flag-simulation/FlagRenderer.ts` (Render the pole)
    - `src/plugins/flag-simulation/utils/FlagPhysicsInitializer.ts` (Mark specific flag vertices as fixed)
    - `src/plugins/flag-simulation/FlagParameterPanel.ts` (Add UI controls for pole properties)
    - `src/plugins/flag-simulation/index.ts` (Register `PoleComponent`)

2.  **Step-by-Step Implementation:**

    - **Step 1: Define `PoleComponent.ts`**
        - Create a new `PoleComponent` with properties like `position: Vector3`, `height: number`, `radius: number`.
        - Register this component in `src/plugins/flag-simulation/index.ts`.
    - **Step 2: Update `FlagComponent.ts`**
        - Add a property `poleEntityId: string | null` to `FlagComponent` to link a flag to a pole entity.
        - Add a property `attachedEdge: 'left' | 'right' | 'top' | 'bottom'` or `attachedVertices: number[]` to define which part of the flag is attached. For simplicity, start with `attachedEdge: 'left'`. 
    - **Step 3: Modify `FlagPhysicsInitializer.ts`**
        - In the `initialize` method, identify the `PointMass` objects corresponding to the `attachedEdge` (e.g., all point masses along the left edge of the flag mesh).
        - Mark these identified `PointMass` objects as fixed (e.g., by adding an `isFixed: boolean` property to `PointMass` and setting it to `true`, or by setting their `mass` to a very large number).
        - Ensure the initial positions of these fixed points are set relative to the `PoleComponent`'s position.
    - **Step 4: Modify `FlagSystem.ts`**
        - In the `update` method, if a `PointMass` is marked as fixed, prevent its position from being updated by physics calculations (forces, velocity, integration).
        - If the flag is attached to a pole, ensure the fixed points' positions are continuously constrained to the pole's position, accounting for the pole's height and the flag's attachment point.
        - Query the `World` for the `PoleComponent` associated with the `poleEntityId` from the `FlagComponent`.
    - **Step 5: Modify `FlagRenderer.ts`**
        - Add logic to create a `THREE.Mesh` (e.g., `THREE.CylinderGeometry` with `MeshStandardMaterial`) to represent the pole.
        - Position the pole mesh in the scene based on the `PoleComponent`'s properties.
        - Ensure the pole is rendered alongside the flag.
    - **Step 6: Update `FlagParameterPanel.ts`**
        - Add UI controls for creating and managing `PoleComponent` entities.
        - Add controls for `PoleComponent` properties (position, height, radius).
        - Add controls to `FlagComponent` for `poleEntityId` (e.g., a dropdown of available pole entities) and `attachedEdge`.

3.  **Dependencies:**
    - This task depends on the existing flag simulation implementation.

## 4. Acceptance Criteria

_[Define a clear, verifiable checklist of conditions that must be met for the task to be considered complete. These should be testable.]_

- [ ] A pole is visibly rendered in the simulation scene.
- [ ] The flag is visually attached to the pole along its specified edge (e.g., left edge).
- [ ] The attached part of the flag remains fixed relative to the pole's position, even when the rest of the flag moves due to wind or gravity.
- [ ] The flag simulates realistically, draping and waving from the pole.
- [ ] Pole properties (position, height, radius) can be adjusted via the UI, and the changes are reflected in the simulation.
- [ ] The simulation remains stable and performant with the pole attachment.
- [ ] All new code is formatted correctly and passes the linter and TypeScript checks.

## 5. Testing Plan

_[A testing plan is mandatory. All code must be tested. Refer to the testing strategy in the architecture document.]_

- **Unit Tests:**
  - [ ] Test `FlagPhysicsInitializer` to ensure correct `PointMass` objects are marked as fixed based on `attachedEdge`.
  - [ ] Test `FlagSystem` to verify that fixed points do not move under physics updates and are correctly constrained to the pole's position.
  - [ ] Test `PoleComponent` for correct property initialization.
- **Integration Tests:**
  - [ ] Verify that the `FlagRenderer` correctly renders both the flag and the pole in the scene.
  - [ ] Test the interaction between `FlagSystem` and `PoleComponent` (e.g., if the pole moves, the attached flag points follow).
  - [ ] Test that the `FlagParameterPanel` correctly updates `PoleComponent` and `FlagComponent` properties.
- **End-to-End (E2E) Tests:**
  - [ ] Create an E2E test that loads the flag simulation with a pole and visually confirms the flag is attached and behaving as expected.
  - [ ] If UI controls are added, test adjusting pole properties (e.g., height) and observing the change in the simulation.

## 6. UI/UX Considerations (If Applicable)

- A new section in the Flag Parameter Panel for "Pole Settings" will be added, including controls for:
    - Pole Position (X, Y, Z)
    - Pole Height
    - Pole Radius
- A dropdown or similar control in the Flag Parameter Panel to select which edge of the flag is attached to the pole (e.g., "Left Edge", "Right Edge").

## 7. Notes & Open Questions

- Consider the best way to handle the `attachedEdge` property in `FlagComponent`. A simple enum (`'left' | 'right' | 'top' | 'bottom'`) might be sufficient for initial implementation.
- How should the pole's position be defined relative to the flag? Initially, assume the pole's base is at (0,0,0) and the flag's attached edge aligns with it, but this might need to be more flexible later.
- Consider adjusting default values for pole properties (e.g., height, radius) to sensible starting points.
