# Task: Enhance Water Drop Simulation Realism

- **Status:** Not Started
- **Assignee:** Unassigned
- **Priority:** High
- **Creation Date:** 2025-07-11
- **Related Epic/Feature:** Water Simulation

---

## 1. Overview & Goal

Enhance the realism of the existing water drop simulation by implementing more physically accurate fluid dynamics, specifically focusing on Smoothed Particle Hydrodynamics (SPH) or Position Based Dynamics (PBD). The goal is to achieve more believable water behavior, including splashing, merging, and flowing, and to improve the visual representation of individual droplets or the water surface.

## 2. Architectural Context

_[This section connects the task to the project's established architecture. Refer to the main architectural documents.]_

- **Relevant Architectural Document:** [Link to ARCHITECTURE.md](./../architecture/ARCHITECTURE.md)
- **Key Architectural Principles to Uphold:**
  - [x] **ECS Compliance:** New components (if needed for SPH/PBD properties) and modifications to existing systems must adhere to the ECS pattern.
  - [x] **Plugin Modularity:** All changes must be self-contained within the `water-simulation` plugin directory.
  - [x] **Decoupling:** Ensure simulation logic (SPH/PBD calculations) remains decoupled from rendering logic. Systems should communicate via components.
  - [x] **Data-Driven Design:** Expose new SPH/PBD parameters (e.g., smoothing length, gas constant, viscosity) as configurable properties in the UI.

## 3. Technical Requirements & Implementation Plan

_[Provide a detailed, step-by-step plan for implementation. Break down the problem into smaller, manageable steps.]_

1.  **Research & Choose Core Simulation Method:**
    - Investigate Smoothed Particle Hydrodynamics (SPH) and Position Based Dynamics (PBD) in detail for real-time fluid simulation.
    - **Decision (Initial Proposal):** Focus on implementing **Smoothed Particle Hydrodynamics (SPH)** due to its popularity for visually rich fluid effects and its particle-based nature aligning with the current `WaterDropletComponent`. PBD can be considered as an alternative if SPH proves too computationally intensive or unstable for real-time browser performance.

2.  **File(s) to be Created/Modified:**

    - `src/plugins/water-simulation/WaterDropletComponent.ts`: Add SPH-specific properties.
    - `src/plugins/water-simulation/WaterSystem.ts`: Implement the core SPH algorithm.
    - `src/plugins/water-simulation/WaterRenderer.ts`: Enhance rendering of water droplets.
    - `src/plugins/water-simulation/WaterDropletParameterPanel.ts`: Add UI controls for new SPH parameters.
    - `src/plugins/water-simulation/utils/SPHKernels.ts` (New file): Implement SPH kernel functions (e.g., Poly6, Spiky, Viscosity kernels).
    - `src/plugins/water-simulation/utils/SpatialHasher.ts` (New file): Implement a spatial hashing grid for efficient neighbor search.

3.  **Step-by-Step Implementation:**

    - **Step 1: Update `WaterDropletComponent.ts`**
        - Add properties to `WaterDropletComponent` for SPH-related data: `density`, `pressure`, `viscosity`, `mass`, `radius`, `neighbors: number[]` (array of entity IDs of neighboring particles).
        - Ensure `previousPosition` and `velocity` are also present for integration.

    - **Step 2: Implement SPH in `WaterSystem.ts`**
        - **Initialization**: In `initializeEntities` (or a similar method), set initial properties for water droplets.
        - **Neighbor Search**: Implement a spatial hashing grid (`SpatialHasher.ts`) to efficiently find neighboring particles for each droplet.
        - **Density and Pressure Calculation**: For each particle, calculate its density and pressure using SPH kernel functions (`SPHKernels.ts`).
        - **Force Calculation**: Calculate pressure forces, viscosity forces, and external forces (gravity) acting on each particle.
        - **Integration**: Update particle positions and velocities using a suitable integration scheme (e.g., Verlet or Euler integration).
        - **Boundary Handling**: Implement simple boundary conditions (e.g., collision with a floor or walls) to prevent particles from escaping the simulation area.

    - **Step 3: Enhance `WaterRenderer.ts`**
        - Modify the rendering of water droplets to use `THREE.InstancedMesh` to render each droplet as a small sphere, improving performance for a large number of particles.
        - (Optional, Advanced) Investigate and implement a basic screen-space fluid rendering technique (e.g., using depth and normal textures) to create a more continuous, blobby water surface from the particles.

    - **Step 4: Update `WaterDropletParameterPanel.ts`**
        - Add UI controls for new SPH parameters: `particleRadius`, `smoothingLength` (h), `gasConstant` (k), `restDensity`, `viscosityCoefficient`, `surfaceTensionCoefficient`.
        - Ensure these controls correctly bind to the `WaterDropletComponent` properties.

    - **Step 5: Add Interaction Effects (Future Consideration)**
        - Implement basic collision detection and response with other simple geometric shapes in the scene.

4.  **Acceptance Criteria**

- [ ] Water droplets exhibit more realistic fluid behavior (e.g., particles spread, merge, and splash in a physically plausible manner).
- [ ] The visual representation of water droplets is improved (e.g., rendered as smooth spheres, or a continuous surface).
- [ ] New SPH parameters (`particleRadius`, `smoothingLength`, `gasConstant`, `restDensity`, `viscosityCoefficient`, `surfaceTensionCoefficient`) are exposed in the UI and demonstrably affect the simulation.
- [ ] The simulation remains stable and performant with a reasonable number of particles (e.g., 500-1000).
- [ ] All new code is formatted correctly and passes the linter and TypeScript checks.

## 5. Testing Plan

_[A testing plan is mandatory. All code must be tested. Refer to the testing strategy in the architecture document.]_

- **Unit Tests:**
  - [ ] Test SPH kernel functions (`SPHKernels.ts`) for correctness.
  - [ ] Test `SpatialHasher.ts` for accurate neighbor search results.
  - [ ] Test force calculations (pressure, viscosity) for individual particles in `WaterSystem`.
  - [ ] Test particle integration in `WaterSystem`.
- **Integration Tests:**
  - [ ] Verify that `WaterSystem` correctly updates `WaterDropletComponent` properties based on SPH calculations.
  - [ ] Test the interaction between `WaterSystem` and `WaterRenderer` (e.g., rendering instanced meshes).
- **End-to-End (E2E) Tests:**
  - [ ] Create an E2E test that initializes a water drop simulation and visually confirms realistic fluid behavior.
  - [ ] Test adjusting new SPH parameters via the UI and observing the expected changes in the simulation.

## 6. UI/UX Considerations (If Applicable)

- A new section in the Water Droplet Parameter Panel for "SPH Settings" will be added, including sliders/inputs for:
    - Particle Radius
    - Smoothing Length (h)
    - Gas Constant (k)
    - Rest Density
    - Viscosity Coefficient
    - Surface Tension Coefficient

## 7. Notes & Open Questions

- Which specific SPH kernel functions (e.g., Poly6, Spiky, Viscosity) are most suitable for this real-time browser-based simulation?
- What is the optimal number of particles to balance realism and performance in a browser environment?
- Consider using Web Workers for computationally intensive parts of the SPH simulation (e.g., neighbor search, force calculations) to avoid blocking the main thread and maintain UI responsiveness.
- How will the initial state of the water (e.g., a single drop, a continuous body) be defined and controlled?
