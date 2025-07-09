# Task: Implement Water Drop Simulation

- **Status:** Not Started
- **Assignee:** Unassigned
- **Priority:** High
- **Creation Date:** 2025-07-09
- **Related Epic/Feature:** N/A

---

## 1. Overview & Goal

This task is to create a new simulation of a water drop falling into a body of water. The primary objective is to develop a visually compelling and physically plausible simulation that can be integrated into the existing physics studio. This involves creating a new plugin that manages the simulation's components, systems, and rendering.

## 2. Architectural Context

- **Relevant Architectural Document:** [Link to ARCHITECTURE.md](./../architecture/ARCHITECTURE.md)
- **Key Architectural Principles to Uphold:**
  - [x] **ECS Compliance:** This task will involve creating new Components (e.g., `WaterBody`, `WaterDroplet`) and Systems (e.g., `WaterSimulationSystem`, `RippleRenderSystem`).
  - [x] **Plugin Modularity:** The entire water simulation will be encapsulated within a new, self-contained plugin directory (`src/plugins/water-simulation/`).
  - [x] **Decoupling:** The simulation logic (physics of the drop and ripples) will be decoupled from the rendering logic.
  - [x] **Data-Driven Design:** The properties of the water and the droplet (e.g., viscosity, drop size, ripple decay) will be defined in components to allow for easy tweaking.

## 3. Technical Requirements & Implementation Plan

1.  **File(s) to be Created/Modified:**

    - `src/plugins/water-simulation/index.ts`
    - `src/plugins/water-simulation/WaterComponents.ts`
    - `src/plugins/water-simulation/WaterSystem.ts`
    - `src/plugins/water-simulation/WaterRenderer.ts`
    - `src/plugins/water-simulation/tests/WaterSystem.test.ts`

2.  **Step-by-Step Implementation:**

    - **Step 1: Plugin Scaffolding:** Create the new plugin directory and the main `index.ts` file to register the plugin.
    - **Step 2: Define Components:** In `WaterComponents.ts`, define `WaterBodyComponent` to represent the surface and `WaterDropletComponent` for the falling drop. Properties might include viscosity, surface tension for the body, and size/velocity for the drop.
    - **Step 3: Implement Physics System:** In `WaterSystem.ts`, create a system that:
      - Manages the motion of the `WaterDropletComponent`.
      - Detects collision between the droplet and the `WaterBodyComponent`.
      - On collision, initiates a ripple effect on the water surface. This could be modeled using a 2D wave equation or a simpler sinusoidal function propagating outwards.
    - **Step 4: Implement Rendering:** In `WaterRenderer.ts`, create a dedicated renderer that:
      - Draws the water body (e.g., a plane).
      - Renders the ripples on the surface, possibly using shaders for a more realistic effect.
      - Renders the water droplet.
    - **Step 5: Integration:** Register the new components, systems, and renderer in the plugin's registration method.
    - **Step 6:** Add the new simulation to the studio's UI to allow users to select and run it.

3.  **Dependencies:**
    - This task does not depend on any other ongoing tasks.
    - No new third-party libraries are anticipated.

## 4. Acceptance Criteria

- [ ] A new "Water Simulation" plugin is available and can be loaded by the `PluginManager`.
- [ ] When the simulation is active, a water droplet is visually rendered and falls towards a water surface.
- [ ] Upon impact, the droplet disappears and a ripple effect is generated on the water surface.
- [ ] The ripples propagate outwards from the impact point and gradually dampen over time.
- [ ] The simulation is stable and does not introduce performance regressions.
- [ ] All new code is formatted, linted, and passes all tests.

## 5. Testing Plan

- **Unit Tests:**
  - [ ] Test the `WaterSystem` logic for ripple generation in isolation.
  - [ ] Verify the initial state and properties of `WaterBodyComponent` and `WaterDropletComponent`.
- **Integration Tests:**
  - [ ] Test that the `WaterSystem` correctly interacts with the ECS to get and update components.
  - [ ] Verify that the plugin correctly registers all its parts with the `World`.
- **End-to-End (E2E) Tests:**
  - [ ] An E2E test will be created to simulate adding the water simulation to the scene, running it for a few seconds, and verifying that the ripple effect is visible.

## 6. UI/UX Considerations (If Applicable)

- A new button or option will be added to the studio UI to launch the "Water Drop Simulation".
- When an entity with `WaterBodyComponent` or `WaterDropletComponent` is selected, its properties (e.g., drop height, water viscosity) should be editable in the property inspector.

## 7. Notes & Open Questions

- The complexity of the ripple physics needs to be balanced with performance. A simple 2D sine wave model is a good starting point, but we should investigate more advanced techniques if time permits.
- Should we use a shader-based approach for rendering the ripples for better performance and visual quality? This might require changes to the `RenderSystem`.
