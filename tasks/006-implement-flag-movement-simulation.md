# Task: Implement Flag Movement Simulation

- **Status:** Not Started
- **Assignee:** Unassigned
- **Priority:** High
- **Creation Date:** 2025-07-08
- **Related Epic/Feature:** [Physics Simulation Studio Core]

---

## 1. Overview & Goal

Implement a realistic, visually compelling flag movement simulation using a mass-spring system (or optionally FEM) for cloth physics, with wind and gravity forces, and render the result in the studio. The goal is to create a simulation that is both physically plausible and performant for real-time or near-real-time applications.

## 2. Architectural Context

- **Relevant Architectural Document:** [Link to ARCHITECTURE.md](./../architecture/ARCHITECTURE.md)
- **Key Architectural Principles to Uphold:**
  - [x] **ECS Compliance:** New components/systems for flag simulation must follow ECS.
  - [x] **Plugin Modularity:** If implemented as a plugin, keep all logic self-contained.
  - [x] **Decoupling:** Separate simulation logic from rendering.
  - [x] **Data-Driven Design:** Allow flag parameters (size, stiffness, wind, etc.) to be configurable.

## 3. Technical Requirements & Implementation Plan

1. **File(s) to be Created/Modified:**

   - `src/plugins/flag-simulation/FlagComponent.ts`
   - `src/plugins/flag-simulation/FlagSystem.ts`
   - `src/plugins/flag-simulation/FlagRenderer.ts`
   - `src/plugins/flag-simulation/index.ts`
   - (Optional) `src/plugins/flag-simulation/FlagFEMSystem.ts`
   - UI: `src/studio/systems/PropertyInspectorSystem.ts` (for flag controls)

2. **Step-by-Step Implementation:**

   - Step 1: Define `FlagComponent` to store grid, spring, and material parameters.
   - Step 2: Implement `FlagSystem` to:
     - Initialize a 2D grid of point masses.
     - Connect them with structural, shear, and bend springs.
     - Apply forces: gravity, wind (constant, procedural, or aerodynamic), and spring forces.
     - Integrate motion using Verlet (preferred) or Euler.
   - Step 3: (Optional) Implement FEM-based system for advanced users.
   - Step 4: Implement `FlagRenderer` to convert the grid to a mesh and render it with realistic shading and texture.
   - Step 5: Add UI controls for wind, stiffness, and flag parameters in the property inspector.
   - Step 6: Bake simulation for real-time playback if needed.
   - Step 7: Register all components and systems in the plugin entry point.

3. **Dependencies:**
   - May depend on core ECS and rendering systems.
   - May introduce a noise library (e.g., Perlin/Simplex noise) for procedural wind.
   - No new third-party physics engines unless approved.

## 4. Acceptance Criteria

- [ ] The flag is simulated as a grid of point masses with springs (structural, shear, bend).
- [ ] Gravity and wind forces are applied and configurable.
- [ ] The simulation is stable (no exploding/NaN values) for reasonable parameters.
- [ ] The flag mesh is rendered and visually updates in real time.
- [ ] UI controls allow changing wind, stiffness, and other parameters.
- [ ] (Optional) FEM mode is available for advanced users.
- [ ] All code is formatted and passes linting.

## 5. Testing Plan

- **Unit Tests:**
  - [ ] Test spring force calculations and integration methods.
  - [ ] Test wind force application (constant, procedural, aerodynamic).
  - [ ] Test grid initialization and mesh generation.
- **Integration Tests:**
  - [ ] Simulate a flag with default parameters and verify plausible motion.
  - [ ] Test UI controls update simulation parameters and affect the flag.
- **End-to-End (E2E) Tests:**
  - [ ] User can add a flag entity, see it move, and adjust parameters in the UI.

## 6. UI/UX Considerations (If Applicable)

- Add controls for wind speed/direction, spring stiffness, and flag size to the property inspector.
- Display a real-time preview of the flag in the main viewport.
- (Optional) Add a toggle for advanced simulation mode (FEM).

## 7. Notes & Open Questions

- Should the flag simulation be a core system or a plugin?
- What is the maximum grid size for real-time performance?
- Should we support both Euler and Verlet integration, or only Verlet?
- Is baking required for all use cases, or only for export/animation?
- What visual style is preferred for the flag material (realistic, stylized, etc.)?

---

### Reference: Physical & Numerical Details

- **Mass-Spring System:**
  - 2D grid of point masses, connected by structural, shear, and bend springs.
  - Each spring: rest length, stiffness constant.
- **Forces:**
  - Gravity: F = m \* g
  - Wind: constant, procedural (Perlin/Simplex), or aerodynamic (based on triangle normals, wind direction, area, and air density).
  - (Optional) Vortex shedding for high realism (advanced, expensive).
- **Integration:**
  - Verlet (preferred): x*{t+Δt} = 2x_t - x*{t-Δt} + (F_t/m)Δt^2
  - Euler (simple, less stable): v*{t+Δt} = v_t + (F_t/m)Δt; x*{t+Δt} = x*t + v*{t+Δt}Δt
- **Rendering:**
  - Mesh from grid, realistic shading, texture, lighting, optional motion blur.
  - Baking for real-time playback if needed.
