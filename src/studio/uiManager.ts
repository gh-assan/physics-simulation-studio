import { Pane } from 'tweakpane';

export class UIManager {
    private pane: Pane;
    private folders: Map<string, any> = new Map();

    constructor() {
        this.pane = new Pane();
    }

    public registerComponentControls(componentName: string, data: any, properties?: { property: string, type: string, label: string }[]) {
        // Tweakpane's addFolder is a method of the Pane instance
        const folder = (this.pane as any).addFolder({ title: componentName });
        this.folders.set(componentName, folder);

        if (properties) {
            properties.forEach(prop => {
                if (prop.property.includes('.')) {
                    // Handle nested properties like 'windDirection.x'
                    const [parent, child] = prop.property.split('.');
                    if (data[parent]) {
                        folder.addBinding(data[parent], child, { label: prop.label });
                    }
                } else {
                    folder.addBinding(data, prop.property, { label: prop.label });
                }
            });
        } else {
            for (const key in data) {
                if (Object.prototype.hasOwnProperty.call(data, key)) {
                    // Exclude internal simulation state from direct UI control for now
                    if (key !== 'particles' && key !== 'springs' && key !== 'fixedParticles') {
                        folder.addBinding(data, key);
                    }
                }
            }
        }
    }

    public clearControls(): void {
        // Tweakpane's dispose method on the Pane instance removes all controls
        this.pane.dispose();
        this.pane = new Pane(); // Re-initialize the pane after disposing
        this.folders.clear();
    }
}