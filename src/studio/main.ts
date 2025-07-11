import { Studio } from "./Studio";
import { World } from "../core/ecs/World";
import { PluginManager } from "../core/plugin/PluginManager";
import { RenderSystem } from "./systems/RenderSystem";
import { PropertyInspectorSystem } from "./systems/PropertyInspectorSystem";
import { UIManager } from "./uiManager";
import { SceneSerializer } from "./systems/SceneSerializer";
import { FlagSimulationPlugin } from "@plugins/flag-simulation";
import { WaterSimulationPlugin } from "@plugins/water-simulation";
import { FlagComponent } from "../plugins/flag-simulation/FlagComponent";
import {
  WaterBodyComponent,
  WaterDropletComponent
} from "../plugins/water-simulation/WaterComponents";
import { PositionComponent } from "../core/components/PositionComponent";
import { RenderableComponent } from "../core/components/RenderableComponent";
import { SelectableComponent } from "../core/components/SelectableComponent";
import { RotationComponent } from "../core/components/RotationComponent";
import { Pane } from "tweakpane";
import { registerComponentProperties } from "./utils/ComponentPropertyRegistry";
import { ComponentControlProperty } from "./types";
import { ViewportToolbar } from "./ui/ViewportToolbar";

// Import styles
import "./styles/studio.css";
import "./styles/toolbar.css";

const world = new World();
const pluginManager = new PluginManager(world);

// Setup Tweakpane for global controls
const pane = new Pane();
const uiManager = new UIManager(pane);
const sceneSerializer = new SceneSerializer();

// Initialize Studio first
const studio = new Studio(world, pluginManager);

// Define component properties for UI
const flagComponentProperties: ComponentControlProperty[] = [
  {
    property: "width",
    type: "number",
    label: "Flag Width",
    min: 0.1,
    max: 10,
    step: 0.1
  },
  {
    property: "height",
    type: "number",
    label: "Flag Height",
    min: 0.1,
    max: 10,
    step: 0.1
  },
  {
    property: "segmentsX",
    type: "number",
    label: "Segments X",
    min: 1,
    max: 50,
    step: 1
  },
  {
    property: "segmentsY",
    type: "number",
    label: "Segments Y",
    min: 1,
    max: 50,
    step: 1
  },
  {
    property: "mass",
    type: "number",
    label: "Particle Mass",
    min: 0.01,
    max: 1,
    step: 0.01
  },
  {
    property: "stiffness",
    type: "number",
    label: "Stiffness",
    min: 0.1,
    max: 1,
    step: 0.01
  },
  {
    property: "damping",
    type: "number",
    label: "Damping",
    min: 0.01,
    max: 1,
    step: 0.01
  },
  { property: "textureUrl", type: "text", label: "Texture URL" },
  {
    property: "windStrength",
    type: "number",
    label: "Wind Strength",
    min: 0,
    max: 10,
    step: 0.1
  },
  {
    property: "windDirection.x",
    type: "number",
    label: "Wind Direction X",
    min: -1,
    max: 1,
    step: 0.1
  },
  {
    property: "windDirection.y",
    type: "number",
    label: "Wind Direction Y",
    min: -1,
    max: 1,
    step: 0.1
  },
  {
    property: "windDirection.z",
    type: "number",
    label: "Wind Direction Z",
    min: -1,
    max: 1,
    step: 0.1
  }
];

const waterBodyComponentProperties: ComponentControlProperty[] = [
  {
    property: "viscosity",
    type: "number",
    label: "Viscosity",
    min: 0,
    max: 1,
    step: 0.01
  },
  {
    property: "surfaceTension",
    type: "number",
    label: "Surface Tension",
    min: 0,
    max: 1,
    step: 0.01
  }
];

const waterDropletComponentProperties: ComponentControlProperty[] = [
  // Basic properties
  {
    property: "size",
    type: "number",
    label: "Droplet Size",
    min: 0.1,
    max: 5,
    step: 0.1
  },
  {
    property: "fallHeight",
    type: "number",
    label: "Fall Height",
    min: 1,
    max: 100,
    step: 1
  },

  // Physics properties
  {
    property: "mass",
    type: "number",
    label: "Mass",
    min: 0.1,
    max: 10,
    step: 0.1
  },
  {
    property: "drag",
    type: "number",
    label: "Drag Coefficient",
    min: 0,
    max: 1,
    step: 0.01
  },

  // Gravity properties
  {
    property: "gravity.x",
    type: "number",
    label: "Gravity X",
    min: -20,
    max: 20,
    step: 0.1
  },
  {
    property: "gravity.y",
    type: "number",
    label: "Gravity Y",
    min: -20,
    max: 20,
    step: 0.1
  },
  {
    property: "gravity.z",
    type: "number",
    label: "Gravity Z",
    min: -20,
    max: 20,
    step: 0.1
  },

  // Velocity properties
  {
    property: "velocity.x",
    type: "number",
    label: "Velocity X",
    min: -10,
    max: 10,
    step: 0.1
  },
  {
    property: "velocity.y",
    type: "number",
    label: "Velocity Y",
    min: -10,
    max: 10,
    step: 0.1
  },
  {
    property: "velocity.z",
    type: "number",
    label: "Velocity Z",
    min: -10,
    max: 10,
    step: 0.1
  },

  // Splash properties
  {
    property: "splashForce",
    type: "number",
    label: "Splash Force",
    min: 0.1,
    max: 5,
    step: 0.1
  },
  {
    property: "splashRadius",
    type: "number",
    label: "Splash Radius",
    min: 0.1,
    max: 10,
    step: 0.1
  },

  // Ripple properties
  {
    property: "rippleDecay",
    type: "number",
    label: "Ripple Decay",
    min: 0.1,
    max: 2,
    step: 0.1
  },
  {
    property: "rippleExpansionRate",
    type: "number",
    label: "Ripple Expansion Rate",
    min: 1,
    max: 20,
    step: 0.5
  }
];

// Register component properties
registerComponentProperties(FlagComponent.type, flagComponentProperties);
registerComponentProperties(
  WaterBodyComponent.type,
  waterBodyComponentProperties
);
registerComponentProperties(
  WaterDropletComponent.type,
  waterDropletComponentProperties
);

// Register core components
world.componentManager.registerComponent(
  PositionComponent.type,
  PositionComponent
);
world.componentManager.registerComponent(
  RenderableComponent.type,
  RenderableComponent
);
world.componentManager.registerComponent(
  SelectableComponent.type,
  SelectableComponent
);
world.componentManager.registerComponent(
  RotationComponent.type,
  RotationComponent
);

// Register systems
const renderSystem = new RenderSystem(studio);
world.systemManager.registerSystem(renderSystem);
world.systemManager.registerSystem(
  new PropertyInspectorSystem(uiManager, world, studio, pluginManager)
);

// Set renderSystem on studio
studio.setRenderSystem(renderSystem);

// Create viewport toolbar
const viewportToolbar = new ViewportToolbar({
  graphicsManager: renderSystem.getGraphicsManager()
});

// Expose for debugging/console interaction
(window as any).viewportToolbar = viewportToolbar;

// Register plugins
pluginManager.registerPlugin(new FlagSimulationPlugin());
pluginManager.registerPlugin(new WaterSimulationPlugin());

// Expose for debugging/console interaction
(window as any).world = world;
(window as any).pluginManager = pluginManager;
(window as any).uiManager = uiManager;
(window as any).sceneSerializer = sceneSerializer;
(window as any).studio = studio;

const globalControlsFolder = (pane as any).addFolder({
  title: "Global Controls"
});
globalControlsFolder
  .addButton({ title: "Play" })
  .on("click", () => studio.play());
globalControlsFolder
  .addButton({ title: "Pause" })
  .on("click", () => studio.pause());
globalControlsFolder
  .addButton({ title: "Reset" })
  .on("click", () => studio.reset());

// Add camera controls to the global controls folder
const cameraControlsFolder = (pane as any).addFolder({
  title: "Camera Controls"
});

const cameraControlsParams = {
  enabled: false,
  mode: "perspective"
};

cameraControlsFolder
  .addBinding(cameraControlsParams, "enabled", { label: "Enable Controls" })
  .on("change", (ev: { value: boolean }) => {
    const graphicsManager = renderSystem.getGraphicsManager();
    graphicsManager.toggleControls(ev.value);
  });

cameraControlsFolder
  .addButton({ title: "Reset Camera" })
  .on("click", () => {
    viewportToolbar.getCameraControls().resetCamera();
  });

cameraControlsFolder
  .addBinding(cameraControlsParams, "mode", {
    label: "Camera Mode",
    options: [
      { text: "Perspective", value: "perspective" },
      { text: "Orthographic", value: "orthographic" }
    ]
  })
  .on("change", (ev: { value: string }) => {
    viewportToolbar.getCameraControls().setCameraMode(
      ev.value as "perspective" | "orthographic"
    );
  });

// Add view buttons
const viewButtonsParams = {
  view: "perspective"
};

cameraControlsFolder
  .addBinding(viewButtonsParams, "view", {
    label: "View",
    options: [
      { text: "Perspective", value: "perspective" },
      { text: "Top", value: "top" },
      { text: "Front", value: "front" },
      { text: "Side", value: "side" }
    ]
  })
  .on("change", (ev: { value: string }) => {
    switch (ev.value) {
      case "perspective":
        viewportToolbar.getCameraControls().setPerspectiveView();
        break;
      case "top":
        viewportToolbar.getCameraControls().setTopView();
        break;
      case "front":
        viewportToolbar.getCameraControls().setFrontView();
        break;
      case "side":
        viewportToolbar.getCameraControls().setSideView();
        break;
    }
  });

// Add help text directly in the UI
const helpTextParams = {
  "Controls Help":
    "Left Click + Drag: Rotate\nRight Click + Drag: Pan\nScroll Wheel: Zoom\n\nKeyboard Shortcuts:\nQ: Select Tool\nW: Move Tool\nE: Rotate Tool\nR: Scale Tool\nG: Toggle Grid\nShift+S: Toggle Snap\n\nCamera Shortcuts:\nP: Toggle Perspective/Orthographic\n0: Top View\n1: Front View\n2: Side View\n3: Perspective View\nArrow Keys: Pan\nShift+Arrow Keys: Rotate\n+/-: Zoom"
};
cameraControlsFolder.addBinding(helpTextParams, "Controls Help", {
  readonly: true
});

// Add viewport settings folder
const viewportSettingsFolder = (pane as any).addFolder({
  title: "Viewport Settings"
});

const viewportSettingsParams = {
  showGrid: true,
  snapToGrid: false
};

viewportSettingsFolder
  .addBinding(viewportSettingsParams, "showGrid", { label: "Show Grid" })
  .on("change", (ev: { value: boolean }) => {
    // Toggle grid visibility
    const scene = renderSystem.getGraphicsManager().getScene();
    scene.traverse((object) => {
      if (object.name === 'grid') {
        object.visible = ev.value;
      }
    });

    // Update toolbar button state
    const gridButton = viewportToolbar.getElement().querySelector('.toolbar-button[title*="Grid"]');
    if (gridButton) {
      if (ev.value) {
        gridButton.classList.add('active');
      } else {
        gridButton.classList.remove('active');
      }
    }
  });

viewportSettingsFolder
  .addBinding(viewportSettingsParams, "snapToGrid", { label: "Snap to Grid" })
  .on("change", (ev: { value: boolean }) => {
    // Dispatch event for snap change
    const event = new CustomEvent('snap-changed', {
      detail: { snapToGrid: ev.value }
    });
    window.dispatchEvent(event);

    // Update toolbar button state
    const snapButton = viewportToolbar.getElement().querySelector('.toolbar-button[title*="Snap"]');
    if (snapButton) {
      if (ev.value) {
        snapButton.classList.add('active');
      } else {
        snapButton.classList.remove('active');
      }
    }
  });

// Add event listeners to synchronize toolbar and settings panel
window.addEventListener('tool-changed', (event: CustomEvent) => {
  console.log(`Tool changed to: ${event.detail.tool}`);
});

window.addEventListener('snap-changed', (event: CustomEvent) => {
  console.log(`Snap to grid changed to: ${event.detail.snapToGrid}`);
  // Update the settings panel
  viewportSettingsParams.snapToGrid = event.detail.snapToGrid;
});

// Listen for grid visibility changes from the toolbar
window.addEventListener('grid-changed', (event: CustomEvent) => {
  console.log(`Grid visibility changed to: ${event.detail.visible}`);
  // Update the settings panel
  viewportSettingsParams.showGrid = event.detail.visible;
});

const simulationSelectionFolder = (pane as any).addFolder({
  title: "Simulations"
});
const simulationParams = {
  selectedSimulation: "flag-simulation" // Default selected simulation
};

simulationSelectionFolder
  .addBinding(simulationParams, "selectedSimulation", {
    label: "Select Simulation",
    options: studio
      .getAvailableSimulationNames()
      .map((name) => ({ text: name, value: name }))
  })
  .on("change", (ev: { value: string }) => {
    void studio.loadSimulation(ev.value);
  });

// Initial load of the default simulation
await studio.loadSimulation(simulationParams.selectedSimulation);

let lastTime = 0;
// Main application loop
function animate(currentTime: number) {
  requestAnimationFrame(animate);

  const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
  lastTime = currentTime;

  // Update the studio (which updates the world if playing)
  studio.update(deltaTime);
}

animate(0);

console.log("Physics Simulation Studio Initialized");
