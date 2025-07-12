# Task 033: Refactor Application Initialization

## Problem Description

The application is suffering from a series of race conditions and timing issues during startup. This manifests as systems (like `PropertyInspectorSystem`) running before the simulation plugins have created the necessary entities, leading to a `null` selected entity and a missing parameter panel. The root cause is a scattered, event-driven initialization sequence that is unpredictable.

## Analysis

The current startup process is flawed:

-   **Constructor Side-Effects:** The `Studio` constructor attempts to load a simulation, which is an anti-pattern. Constructors should be simple and not perform complex, asynchronous operations.
-   **Event-Driven Startup:** The initial simulation load is triggered by a state change event, which is asynchronous and runs concurrently with the main application loop. This makes it impossible to guarantee that the simulation is ready before the first frame.
-   **Lack of Orchestration:** There is no single, clear conductor for the startup process. Initialization logic is spread across multiple files and event listeners.

## Architectural Refactoring Plan

To fix this, we will implement a linear, predictable startup sequence:

1.  **Create a Central `main()` Function:**
    -   All initialization logic will be moved into a single `async function main()` in `src/studio/main.ts`.
    -   This function will be the single source of truth for the application's startup sequence.

2.  **Enforce a Sequential Startup:**
    -   The `main()` function will perform the following steps in order, using `await` to ensure completion:
        1.  Create the `world`, `pluginManager`, `stateManager`, `uiManager`, and `studio` instances.
        2.  Register all core components.
        3.  Register all systems.
        4.  Register all simulation plugins.
        5.  **Explicitly load the default simulation.** This will be a direct, `await`ed call to `studio.loadSimulation()`.

3.  **Start the Main Loop Last:**
    -   The `animate()` function, which contains the main application loop, will only be called *after* the `main()` function has successfully completed.

4.  **Clean Up Old Logic:**
    -   Remove the `loadSimulation` call from the `Studio` constructor.
    -   Remove the event listener in `main.ts` that was responsible for the initial simulation load.

This refactoring will eliminate the race conditions and make the application's startup process robust, predictable, and easier to maintain.