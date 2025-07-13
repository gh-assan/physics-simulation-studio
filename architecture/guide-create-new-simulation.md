# Guide: How to Create a New Simulation

This guide explains the steps required to add a new simulation to Physics Simulation Studio.

---

## 1. Define Simulation Components
- Create new component classes in `src/core/components/` for any data your simulation needs (e.g., `PositionComponent`, `VelocityComponent`, `CustomSimulationComponent`).
- Ensure each component implements the `IComponent` interface.

## 2. Implement Simulation Logic (System)
- Create a new system class in `src/core/ecs/` or `src/plugins/<your-simulation>/`.
- The system should extend the base `System` class and implement the `update(world, deltaTime)` method.
- Add logic for updating entities based on your simulation rules.

## 3. Add Rendering Logic
- If your simulation has custom visuals, create a renderer class in `src/plugins/<your-simulation>/`.
- Use THREE.js to create and update meshes for your entities.
- Optionally, add utility functions in `src/studio/systems/utils/` for reusable rendering logic.

## 4. Register Components and Systems
- Register your new components and systems with the ECS `World` in the main initialization code (usually in `Studio.ts`).
- Ensure your system is added to the update loop.

## 5. UI Integration
- Add controls for your simulation parameters in the UI (e.g., sliders, buttons).
- Update the parameter panel to include your simulation's settings.
- Listen for parameter changes and update your system or renderer accordingly.

## 6. Plugin Registration (if using plugins)
- Place your simulation code in `src/plugins/<your-simulation>/`.
- Export your system, components, and renderer from an index file.
- Register the plugin in the main application or plugin manager.

## 7. Serialization Support
- Ensure your components are serializable for saving/loading scenes.
- Update the `SceneSerializer` if needed to handle new component types.

## 8. Testing & Debugging
- Test your simulation by creating entities and verifying behavior.
- Use debug rendering (e.g., wireframes, bounding boxes) if needed.
- Check serialization/deserialization works for your simulation.

## 9. Documentation
- Document your simulation's purpose, components, and usage in the plugin or system folder.
- Update architecture docs if your simulation introduces new patterns or requirements.

## Example Plugin Folder Structure

```
src/plugins/my-simulation/
  ├── MySimulationSystem.ts         # Main simulation logic (system)
  ├── MySimulationComponent.ts      # Custom component(s) for simulation
  ├── MySimulationRenderer.ts       # Custom renderer (if needed)
  ├── index.ts                      # Exports system, components, renderer
  ├── README.md                     # Documentation for the plugin
  └── utils/
      └── MySimulationUtils.ts      # (Optional) Shared utility functions
```

- Place all simulation-specific code in its own plugin folder.
- Use `index.ts` to export your system, components, and renderer for easy registration.
- Add a `README.md` to document usage and architecture.
- Add a `utils/` subfolder for reusable helpers if needed.

---

**Summary Checklist:**
- [ ] Define components
- [ ] Implement system logic
- [ ] Add rendering code
- [ ] Register with ECS world
- [ ] Integrate with UI
- [ ] Register as plugin (if needed)
- [ ] Support serialization
- [ ] Test and debug
- [ ] Document

---

For more details, see the example plugins and systems in the codebase.

**Guide created by GitHub Copilot on 13 July 2025**
