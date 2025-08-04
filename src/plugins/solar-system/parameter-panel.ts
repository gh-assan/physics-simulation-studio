import { IWorld } from '@core/ecs/IWorld';
import { CelestialBodyComponent, OrbitComponent } from './components';
import { ParameterPanelComponent } from '@core/components/ParameterPanelComponent';
import { IUIManager } from "../../studio/IUIManager";
import { IComponent } from '@core/ecs/IComponent';

export class SolarSystemParameterPanel extends ParameterPanelComponent {
  public readonly componentType: string = 'SolarSystem'; // Placeholder

  constructor(private world: IWorld) {
    super();
  }

  public registerControls(uiManager: IUIManager, component?: IComponent): void {
    const panel = uiManager.createPanel('Solar System Parameters');

    const entities = this.world.componentManager.getEntitiesWithComponents([
      CelestialBodyComponent,
      OrbitComponent,
    ]);

    for (const entityId of entities) {
      const celestialBody = this.world.componentManager.getComponent(
        entityId,
        CelestialBodyComponent.type
      ) as CelestialBodyComponent;
      const orbit = this.world.componentManager.getComponent(
        entityId,
        OrbitComponent.type
      ) as OrbitComponent;

      if (celestialBody && orbit) {
        // Create a sub-panel for each celestial body
        const planetPanel = uiManager.createPanel(celestialBody.name);

        uiManager.addBinding(planetPanel, celestialBody, 'radius', { min: 0.1, max: 10, step: 0.1, label: 'Scale' });
        uiManager.addBinding(planetPanel, orbit, 'semiMajorAxis', { min: 1, max: 50, step: 1, label: 'Orbital Distance' });
        uiManager.addBinding(planetPanel, orbit, 'orbitalSpeed', { min: 0.001, max: 0.1, step: 0.001, label: 'Orbital Speed' });
      }
    }
  }

  public updateControls(component: IComponent): void {}

  public handleEvent(event: string, component: IComponent): void {}

  public getPanelContent(): HTMLElement {
    const panel = document.createElement('div');
    panel.innerHTML = '<h2>Solar System Controls</h2>';
    return panel;
  }
}
