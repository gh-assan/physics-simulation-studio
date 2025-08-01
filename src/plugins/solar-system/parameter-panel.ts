import { World } from '@core/ecs/World';
import { CelestialBodyComponent, OrbitComponent } from './components';
import { ParameterPanelComponent } from '@core/components/ParameterPanelComponent';
import { UIManager } from '@app/uiManager';
import { IComponent } from '@core/ecs/IComponent';

export class SolarSystemParameterPanel extends ParameterPanelComponent {
  public readonly componentType: string = 'SolarSystem'; // Placeholder

  constructor(private world: World) {
    super();
  }

  public registerControls(uiManager: UIManager, component?: IComponent): void {
    uiManager.addFolder('Solar System Parameters', (folder) => {
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
          const planetFolder = folder.addFolder({ title: celestialBody.name });

          planetFolder.addBinding(celestialBody, 'radius', { min: 0.1, max: 10, step: 0.1, label: 'Scale' });
          planetFolder.addBinding(orbit, 'semiMajorAxis', { min: 1, max: 50, step: 1, label: 'Orbital Distance' });
          planetFolder.addBinding(orbit, 'orbitalSpeed', { min: 0.001, max: 0.1, step: 0.001, label: 'Orbital Speed' });
        }
      }
    });
  }

  public updateControls(component: IComponent): void {
    // Tweakpane automatically updates bound controls, so no explicit update needed here for now.
  }

  public handleEvent(event: string, component: IComponent): void {
    // No specific event handling needed for now.
  }

  public getPanelContent(): HTMLElement {
    const panel = document.createElement('div');
    panel.innerHTML = '<h2>Solar System Controls</h2>';
    return panel;
  }
}
