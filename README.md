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

## 📚 Documentation

This project uses a comprehensive documentation system. For complete information:

- **[Documentation Hub](./docs/README.md)** - Main documentation index with navigation to all project docs
- **[Architecture Overview](./docs/architecture/ARCHITECTURE.md)** - Technical architecture and design
- **[Getting Started Guide](./docs/development/guides/getting-started.md)** - Project setup and development guide
- **[Development Protocols](./docs/development/protocols/)** - Development processes and standards

For a complete overview of the project's design and technical foundation, please see the [Architectural Blueprint](./docs/architecture/ARCHITECTURE.md).

## Getting Started

To get started with the Physics Simulation Studio, follow these steps:

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/gh-assan/physics-simulation-studio.git
    cd physics-simulation-studio
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Build the project:**

    ```bash
    npm run build
    ```

4.  **Run the development server:**
    ```bash
    npm start
    ```
    This will start a local server, and you can access the application in your browser at `http://localhost:8080` (or another port if 8080 is in use).

## Contributing

We welcome contributions to the Physics Simulation Studio! Please see our [contribution guidelines](CONTRIBUTING.md) for more information on how to get involved.

## License

This project is licensed under the terms of the [LICENSE](./LICENSE) file.
