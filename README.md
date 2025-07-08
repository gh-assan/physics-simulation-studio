# Physics Simulation Studio

## A Modular, Web-Based Sandbox for Physical Phenomena

Physics Simulation Studio is an open-source project to build a flexible, high-performance, and user-friendly environment where creators can design, simulate, and share a wide array of physical phenomena directly in the browser.

The core vision is to create a digital sandbox that is fundamentally extensible. The architecture is designed to allow entirely new types of simulations—from rigid-body dynamics to optics, fluid dynamics, or soft-body physics—to be integrated as self-contained modules without requiring modification of the core application.

## Core Features & Architectural Vision

- **Frontend-Only:** The entire application runs in the browser with no required server-side components.
- **Extensible via Plugins:** New simulation types are added as discrete plugins, each with its own logic and components.
- **High Performance:** Leverages WebAssembly-based physics engines (starting with **Rapier.rs**) to achieve high performance and simulate complex scenes.
- **Data-Driven:** The entire state of a simulation can be serialized to JSON, allowing for robust save/load functionality and sharing of complex scenes via URL.
- **Decoupled Rendering:** Simulation logic is strictly separated from rendering logic, allowing for the use of best-in-class rendering libraries like **Three.js** (for 3D) and **Pixi.js** (for 2D).

For a complete overview of the project's design and technical foundation, please see the [Architectural Blueprint](./architecture/ARCHITECTURE.md).

## Getting Started

*(This section will be updated as the project progresses to include build and run instructions.)*

## Contributing

*(This section will be updated with contribution guidelines.)*

## License

This project is licensed under the terms of the [LICENSE](./LICENSE) file.