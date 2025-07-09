import {Pane, FolderApi} from 'tweakpane';

export class UIManager {
  private pane: Pane;
  private folders: Map<string, FolderApi> = new Map();

  constructor(pane: Pane) {
    this.pane = pane;
  }

  public registerComponentControls(
    componentName: string,
    data: any,
    properties?: {
      property: string;
      type: string;
      label: string;
      min?: number;
      max?: number;
      step?: number;
    }[],
  ) {
    const folder = this.pane.addFolder({title: componentName});
    this.folders.set(componentName, folder);

    if (properties) {
      properties.forEach(prop => {
        const options: {
          label: string;
          min?: number;
          max?: number;
          step?: number;
        } = {label: prop.label};
        if (prop.min !== undefined) options.min = prop.min;
        if (prop.max !== undefined) options.max = prop.max;
        if (prop.step !== undefined) options.step = prop.step;

        if (prop.property.includes('.')) {
          const [parent, child] = prop.property.split('.');
          if (data[parent]) {
            folder.addBinding(data[parent], child, options);
          }
        } else {
          folder.addBinding(data, prop.property, options);
        }
      });
    } else {
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          if (
            key !== 'particles' &&
            key !== 'springs' &&
            key !== 'fixedParticles'
          ) {
            folder.addBinding(data, key);
          }
        }
      }
    }
  }

  public clearControls(): void {
    this.folders.forEach(folder => {
      folder.dispose();
    });
    this.folders.clear();
  }
}
