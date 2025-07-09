# Physics Simulation Studio - Architecture

This document outlines the official architecture for the Physics Simulation Studio project. It is derived from the detailed analysis in the `tech-spec.md` and serves as the guiding blueprint for all development.

## 1. Core Architectural Pattern: ECS + Plugins

The project's foundation is a synergistic combination of two powerful architectural patterns:

1.  **Entity-Component-System (ECS):** This is the runtime core of the application. It favors composition over inheritance, providing a highly performant and flexible way to manage the state and behavior of all simulated objects. All logic is encapsulated in **Systems**, all data in **Components**, and **Entities** are simple identifiers that connect them. This pattern enforces a clean separation of data and logic, which is essential for our extensibility goals.

2.  **Plugin-Based Architecture:** This sits atop the ECS foundation and provides the mechanism for extensibility. New simulation types (e.g., rigid-body dynamics, optics, fluid dynamics) will be integrated as self-contained, modular **Plugins**. Each plugin is responsible for registering its own components and systems with the core ECS world. A central `PluginManager` will handle discovery, dependency resolution, and lifecycle management of these plugins.

This dual architecture ensures that the core application remains decoupled from any specific simulation domain, allowing for true modularity and long-term maintainability.

## 2. Technology Stack

The following technologies have been selected to build the studio:

- **Language:** **TypeScript**. Its static typing is crucial for building a large, maintainable application and for enforcing the architectural contracts between modules.
- **Physics Engine:** **Rapier.rs**. Chosen for its exceptional performance (via WebAssembly), modern TypeScript API, determinism, and rich feature set (including snapshotting for save/load functionality).
- **Rendering Engine:**
  - **Three.js** for 3D rendering.
  - **Pixi.js** for 2D rendering.
    The rendering logic will be strictly decoupled from the simulation logic via a dedicated `RenderSystem`.
- **UI Control Panel:** **Tweakpane**. A lightweight, dependency-free library for creating the dynamic property inspector. Its API allows for the programmatic generation of UI controls, which is essential for our data-driven UI goals.
- **Development Server:** **http-server**. A simple, zero-configuration command-line http server for serving static files during development.

## 3. Build and Run Commands

To build and run the project, the following `npm` scripts are available:

- `npm install`: Installs all necessary project dependencies.
- `npm run build`: Compiles the TypeScript source code into JavaScript, ready for deployment.
- `npm test`: Executes the test suite to ensure code correctness and prevent regressions.
- `npm start`: Starts a local development server to serve the application in the browser.

## 4. Project Structure

The project will follow a modular structure to enforce separation of concerns:

```
/src
|-- /core/          # Application-agnostic ECS, PluginManager, and utilities
|-- /studio/        # Main application logic, UI systems, and entry point
|-- /plugins/       # Directory for all self-contained simulation plugins
|   |-- /rigid-body/
|   |-- /optics/
|   |-- /flag-simulation/ # For realistic flag movement simulation
|-- /lib/           # Third-party library code or type definitions
|-- /assets/        # Static assets (textures, models, etc.)
```

## 5. Testing Strategy

**6. Styling Conventions: BEM**

To ensure maintainable, scalable, and readable CSS, the project will adhere to the BEM (Block-Element-Modifier) methodology for all new and refactored stylesheets. BEM provides a strict naming convention that helps in organizing CSS classes, preventing naming conflicts, and promoting component reusability.

**Naming Convention:**

- **Block:** `block-name` (e.g., `studio-panel`, `simulation-button`)
- **Element:** `block-name__element-name` (e.g., `studio-panel__header`, `simulation-button__icon`)
- **Modifier:** `block-name--modifier-name` or `block-name__element-name--modifier-name` (e.g., `studio-panel--dark-theme`, `simulation-button--active`)

This convention will be applied to all custom CSS classes. For third-party libraries like Tweakpane, existing classes will be used as context selectors where necessary, but custom styling applied to them will follow BEM principles where applicable.

## 7. Testing Strategy

**A rigorous and comprehensive testing strategy is non-negotiable for the success of this project.** All code, from the core framework to individual plugins, must be covered by a suite of automated tests to ensure correctness, prevent regressions, and facilitate confident refactoring.

The testing strategy will be multi-layered:

1.  **Unit Tests:** Each module, class, and function should have corresponding unit tests.

    - **Core ECS:** The `EntityManager`, `ComponentManager`, and `SystemManager` must be tested in isolation to verify their logic.
    - **Plugins:** The internal logic of each plugin's systems and components must be unit-tested.
    - **Utilities:** All common utilities (e.g., math libraries, serializers) must have 100% test coverage.

2.  **Integration Tests:** These tests will verify the interactions between different parts of the system.

    - **ECS & Systems:** Tests will ensure that systems correctly query for entities and modify components as expected within the ECS world.
    - **Plugin Loading:** The `PluginManager` will be tested to ensure it correctly loads plugins, resolves dependencies, and calls the registration lifecycle methods in the correct order.
    - **Simulation & Rendering:** While rendering output is difficult to test automatically, we will test the data flow. Tests will verify that the `RenderSystem` correctly reads data from `Position` and `Renderable` components after a simulation step.

3.  **End-to-End (E2E) Tests:** A framework like Cypress or Playwright will be used to simulate user interactions with the final application.
    - **User Stories:** E2E tests will cover key user stories, such as "a user creates a box, presses play, and sees it fall" or "a user saves a scene to a file and successfully reloads it."
    - **UI Interaction:** These tests will validate that the Tweakpane-based property inspector correctly reflects and updates component data.

All new features or bug fixes must be accompanied by relevant tests. The CI/CD pipeline will be configured to run the entire test suite automatically on every commit to ensure that the main branch always remains in a stable, working state.
