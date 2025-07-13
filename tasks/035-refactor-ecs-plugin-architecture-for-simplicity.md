# Task: Refactor ECS & Plugin Architecture for Simplicity, Robustness, and Extensibility

-   **Status:** Not Started
-   **Assignee:** Unassigned
-   **Priority:** Critical (Architectural Foundation)
-   **Creation Date:** 2025-07-13
-   **Related Epic/Feature:** Architectural Compliance & Core Refactoring
-   **Related Task:** [036-refactor-specific-classes-for-modularity.md](./036-refactor-specific-classes-for-modularity.md)

---

## 1. Overview & Goal

This task aims to fundamentally refactor the core ECS and plugin architecture to not only ensure strict adherence to `ARCHITECTURE.md` but also to establish a highly robust, extensible, and maintainable foundation for future development. The goal is to achieve true modularity, clear separation of concerns, and predictable behavior by formalizing interaction patterns and data flows, thereby significantly reducing implicit dependencies and technical debt.

## 2. Architectural Context

-   **Relevant Architectural Document:** [Link to ARCHITECTURE.md](./../architecture/ARCHITECTURE.md)
-   **Key Architectural Principles to Uphold and Enhance:**
    -   [x] **ECS Compliance:** All Components and Systems must strictly follow ECS principles, focusing on data and behavior separation.
    -   [x] **Plugin Modularity & Isolation:** Plugins must be self-contained, discoverable, and interact solely through well-defined contracts, preventing direct knowledge or dependencies on other plugins' internals.
    -   [x] **Decoupling & Separation of Concerns:** Simulation, rendering, UI, and cross-cutting concerns (like logging, error handling) must be rigorously separated into distinct layers with explicit interfaces.
    -   [x] **Data-Driven Design & Declarative Configuration:** All system and UI logic should be driven by declarative data structures and configurations, minimizing hardcoded logic and enabling dynamic behavior.
    -   [x] **Predictable & Orchestrated Initialization:** Implement a formal, phased application bootstrap process to ensure a deterministic and robust startup sequence, eliminating race conditions.
    -   [x] **Extensibility & Maintainability:** Design for future growth, allowing easy addition of new features, plugins, and UI components without significant refactoring of core systems.
    -   [x] **Code Modularity & Readability:** Ensure classes, functions, and modules are concise, single-purpose, and highly readable, adhering to established coding standards. This includes breaking down overly large classes and functions.

## 3. Technical Requirements & Implementation Plan

1.  **File(s) to be Created/Modified:**
    -   `src/core/ecs/*`
    -   `src/core/plugin/PluginManager.ts`
    -   `src/studio/systems/PropertyInspectorSystem.ts`
    -   `src/core/components/*`
    -   `src/plugins/*`
    -   `src/studio/utils/ComponentPropertyRegistry.ts` (or similar, potentially a new `src/core/metadata/` directory)
    -   `src/studio/main.ts` (for bootstrap/composition root)
    -   `src/studio/Studio.ts`
    -   `src/studio/uiManager.ts`
    -   `src/studio/graphics/ThreeGraphicsManager.ts`
    -   New UI-specific interaction layers/managers (e.g., `src/studio/ui/UIManager.ts` enhancements, new `src/studio/commands/` or `src/studio/events/` for UI-ECS communication)
    -   Related tests in `src/core/tests/` and `src/studio/tests/`

2.  **Known Violations & Areas for Refactor (with Enhanced Refactor Goals):**

    *   **Violation: Manual registry keys and fallback logic for component registration and UI property lookup.**
        *   **Current State:** `ComponentManager.registerComponent` and `PropertyInspectorSystem` use manual type strings and fallback logic.
        *   **Architectural Impact:** Violates "Data-Driven Design". Fragile, inconsistent, and high maintenance.
        *   **Enhanced Refactor Goal:**
            *   **Formalize Component Schema:** Implement a robust `ComponentPropertyRegistry` that defines a formal, declarative schema (e.g., using TypeScript interfaces or a custom schema definition) for all component properties. This registry will be the *absolute single source of truth*.
            *   **Automated Property Registration:** Explore using TypeScript decorators (`@componentProperty`, `@range`, `@enum`) on component classes to automatically register properties and their metadata with the `ComponentPropertyRegistry`, reducing boilerplate and ensuring consistency.
            *   **Extensible UI Control Mapping:** The registry will not just store "hints" but explicit mappings to specific UI control types (e.g., `SliderControl`, `DropdownControl`). `PropertyInspectorSystem` will dynamically render UI based *solely* on this formal schema and control mapping, allowing for easy integration of new UI controls.

    *   **Violation: UI logic mixed within ECS systems and parameter panels.**
        *   **Current State:** `PropertyInspectorSystem` and parameter panels directly handle UI rendering/interaction.
        *   **Architectural Impact:** Violates "Decoupling" (UI from ECS). Blurs concerns, hinders testability, and limits UI flexibility.
        *   **Enhanced Refactor Goal:**
            *   **Reactive Data Exposure:** ECS Components/Systems will expose relevant data changes via reactive streams (e.g., using RxJS Observables). The UI layer will *subscribe* to these streams to reactively update its presentation, eliminating polling.
            *   **Command Pattern for UI-to-ECS:** All UI interactions that modify ECS state will dispatch explicit "Commands" (e.g., `UpdateComponentPropertyCommand`, `CreateEntityCommand`). These commands will be processed by dedicated command handlers within the ECS or a central command bus, ensuring a clear, unidirectional flow of control from UI to ECS.
            *   **Dedicated UI State Management:** Introduce a lightweight, UI-specific state management solution (e.g., Zustand, Jotai) to manage UI-only state and mirror relevant ECS data for rendering, further isolating UI concerns from core ECS logic.

    *   **Violation: Cross-plugin dependencies and logic leaks.**
        *   **Current State:** Plugins check for existence of core components or other plugins, and have fallback logic.
        *   **Architectural Impact:** Violates "Plugin Modularity". Creates tight coupling, reduces reusability, and makes the system brittle.
        *   **Enhanced Refactor Goal:**
            *   **Service Locator / Dependency Injection (DI) for Inter-Plugin Communication:** Implement a lightweight Service Locator or a simple DI container. Plugins will register "services" (implementations of abstract interfaces) with this container. Other plugins will *request* these services by interface, promoting loose coupling and testability. Direct inter-plugin knowledge is strictly forbidden.
            *   **Formalized Plugin Contracts:** The `ISimulationPlugin` interface will be enhanced to explicitly define what a plugin *can* and *cannot* register (e.g., components, systems, services, UI elements) and what lifecycle hooks it supports.
            *   **Conceptual Plugin Sandboxing:** Reinforce the idea that plugins operate within their own logical "sandbox," preventing direct manipulation of core ECS internals or other plugin's private data.

    *   **Violation: Scattered logging and error handling.**
        *   **Current State:** `console.log`, `Logger.log`, `console.warn` calls are spread throughout core ECS, plugin, and UI code.
        *   **Architectural Impact:** Violates "Decoupling" (cross-cutting concerns). Hinders centralized logging management and observability.
        *   **Enhanced Refactor Goal:** All logging must exclusively use the centralized `Logger` instance (as defined in `035-implement-global-logger.md`). The `Logger` will be provided via dependency injection or a global singleton, ensuring consistent access and control. Direct `console.log` calls are strictly prohibited. Implement a consistent error handling strategy (e.g., custom error classes, centralized error reporting).

    *   **Violation: Unpredictable state management and initialization.**
        *   **Current State:** Some systems and plugins rely on event-driven or scattered initialization.
        *   **Architectural Impact:** Violates "Predictable Initialization". Leads to race conditions, unpredictable behavior, and difficult debugging.
        *   **Enhanced Refactor Goal:**
            *   **Formal Application Bootstrap / Composition Root:** Introduce a dedicated "Bootstrap" or "Composition Root" module (e.g., `src/app/bootstrap.ts`) that is the *sole entry point* for application assembly. This module will be responsible for initializing core services, loading plugins, and orchestrating the entire startup sequence.
            *   **Phased Initialization:** Define distinct, ordered initialization phases (e.g., `CoreServicesInit`, `PluginLoading`, `SystemRegistration`, `UIInitialization`). Each phase must complete successfully before the next begins, ensuring a deterministic and robust startup.

    *   **Violation: Overly long classes and methods.**
        *   **Current State:** Some classes and methods have accumulated too many responsibilities, leading to large file sizes, reduced readability, and increased complexity.
        *   **Architectural Impact:** Violates "Code Modularity & Readability" and the Single Responsibility Principle. Hinders maintainability, testability, and reusability.
        *   **Enhanced Refactor Goal:** Actively identify and refactor overly large classes and methods. Break them down into smaller, single-purpose classes or functions, each with a clearly defined responsibility. This will improve code clarity, reduce cognitive load, and facilitate independent testing and modification.
        *   **For detailed analysis and refactoring goals of specific classes, refer to [Task 036: Refactor Specific Classes for Modularity and SRP Compliance](./036-refactor-specific-classes-for-modularity.md).**

3.  **Step-by-Step Implementation:**

    *   Step 1: **Formalize Component Property Definitions & Automated Registration:**
        *   Design and implement the `ComponentPropertyRegistry` (or similar) to support formal schema definitions and extensible UI control mappings.
        *   Introduce TypeScript decorators for automated property registration on component classes.
        *   Refactor `PropertyInspectorSystem` to dynamically generate UI based *solely* on this formal registry.
    *   Step 2: **Implement Reactive Data Flow & Command Pattern for UI-ECS Interaction:**
        *   Introduce RxJS (or similar reactive library) to expose ECS data changes as Observables.
        *   Define and implement a Command pattern for all UI-initiated actions that modify ECS state.
        *   Integrate a lightweight UI-specific state management solution.
    *   Step 3: **Establish Service Locator / DI for Inter-Plugin Communication & Formalize Plugin Contracts:**
        *   Implement a basic Service Locator or DI container.
        *   Refactor plugins to register and consume services via this mechanism.
        *   Enhance `ISimulationPlugin` with formal lifecycle hooks and explicit contract definitions.
    *   Step 4: **Refactor `PluginManager` for Robust Lifecycle Management:**
        *   Streamline `src/core/plugin/PluginManager.ts` to orchestrate plugin lifecycle hooks (`onLoad`, `onActivate`, `onDeactivate`, `onDispose`).
        *   Ensure robust error handling during plugin loading and activation.
    *   Step 5: **Enforce Centralized Logging & Error Handling:**
        *   Verify all logging uses the `Logger` class (from `035-implement-global-logger.md`).
        *   Implement a consistent application-wide error handling and reporting mechanism.
    *   Step 6: **Implement Formal Application Bootstrap & Phased Initialization:**
        *   Create/refactor `src/app/bootstrap.ts` (or similar) as the application's composition root.
        *   Define and implement distinct initialization phases, ensuring strict ordering and dependency resolution.
    *   Step 7: **Refactor Specific Classes for Modularity (Refer to Task 036):**
        *   Execute the class-specific refactoring plans detailed in [Task 036: Refactor Specific Classes for Modularity and SRP Compliance](./036-refactor-specific-classes-for-modularity.md). This includes breaking down overly long classes and methods into smaller, single-responsibility units.
    *   Step 8: **Comprehensive Test Suite Expansion:**
        *   Significantly expand and update existing tests to cover all new architectural patterns (e.g., registry validation, reactive data flow, command processing, plugin service discovery, bootstrap phases).
        *   Prioritize integration tests for critical architectural flows.
    *   Step 9: **Thorough Architectural Documentation:**
        *   Update `ARCHITECTURE.md` with detailed explanations of the new patterns (Reactive Data Flow, Command Pattern, Service Locator/DI, Formal Bootstrap, Component Schema).
        *   Add high-level design documents for each major architectural change.

---

## 4. Acceptance Criteria

-   The `ComponentPropertyRegistry` is the *sole, declarative source* for component property definitions, supporting automated registration and dynamic UI generation.
-   UI and ECS layers communicate exclusively via reactive data streams (ECS to UI) and a formal Command pattern (UI to ECS), with no direct coupling.
-   Plugins are strictly isolated, communicating only through registered services via a Service Locator/DI container, adhering to formalized plugin contracts.
-   All logging is routed through the centralized `Logger` instance, and a consistent error handling strategy is in place.
-   Application initialization is managed by a formal Bootstrap process with clearly defined, ordered phases, ensuring deterministic startup.
-   The codebase demonstrates high extensibility, allowing new features and plugins to be added with minimal impact on existing core logic.
-   Comprehensive test coverage validates the integrity and correctness of all new architectural patterns.
-   `ARCHITECTURE.md` and relevant design documents are thoroughly updated to reflect the enhanced architecture.
-   All new and refactored code adheres to principles of code modularity, with classes, functions, and methods being concise and single-purpose.

---

## 5. Additional Notes

-   This refactoring is foundational. It should be approached with extreme care and potentially broken down into smaller, incremental PRs, each focusing on one architectural pattern.
-   Consider the impact on existing plugins and components; a migration strategy will be necessary.
-   Regular code reviews focusing on adherence to the new architectural patterns are crucial.
-   This task will likely require significant time investment but will yield substantial long-term benefits in maintainability, scalability, and developer experience.

---
