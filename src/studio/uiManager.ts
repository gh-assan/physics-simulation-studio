import { Pane } from 'tweakpane';

export class UIManager {
    private pane: Pane;
    private folders: Map<string, any> = new Map();

    constructor(pane: Pane) {
        this.pane = pane;
    }

    public registerComponentControls(componentName: string, data: any, properties?: { property: string, type: string, label: string, min?: number, max?: number, step?: number }[]) {
        console.log(`UIManager: registerComponentControls called for component: ${componentName}`);
        console.log(`UIManager: Properties:`, properties);
        const folder = (this.pane as any).addFolder({ title: componentName });
        this.folders.set(componentName, folder);
        console.log(`UIManager: Folder created for ${componentName}`);

        if (properties) {
            properties.forEach(prop => {
                const options: { label: string, min?: number, max?: number, step?: number } = { label: prop.label };
                if (prop.min !== undefined) options.min = prop.min;
                if (prop.max !== undefined) options.max = prop.max;
                if (prop.step !== undefined) options.step = prop.step;

                if (prop.property.includes('.')) {
                    const [parent, child] = prop.property.split('.');
                    // Defensive: ensure parent exists and is an object
                    if (!data[parent] || typeof data[parent] !== 'object') {
                        // For windDirection, default to {x:0, y:0, z:0}
                        if (parent === 'windDirection') {
                            data[parent] = { x: 0, y: 0, z: 0 };
                        } else {
                            data[parent] = {};
                        }
                    }
                    console.log(`UIManager: Adding nested binding for ${prop.property} with options:`, options);
                    folder.addBinding(data[parent], child, options);
                } else {
                    console.log(`UIManager: Adding binding for ${prop.property} with options:`, options);
                    folder.addBinding(data, prop.property, options);
                }
            });
        } else {
            for (const key in data) {
                if (Object.prototype.hasOwnProperty.call(data, key)) {
                    if (key !== 'particles' && key !== 'springs' && key !== 'fixedParticles') {
                        console.log(`UIManager: Adding generic binding for ${key}`);
                        folder.addBinding(data, key);
                    }
                }
            }
        }
    }

    public clearControls(): void {
        console.log("UIManager: clearControls called. Disposing Tweakpane instance.");
        this.pane.dispose();
        this.folders.clear();
        console.log("UIManager: Controls cleared.");
    }
}