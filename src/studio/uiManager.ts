import { Pane } from 'tweakpane';

export class UIManager {
    private pane: Pane;
    private folders: Map<string, any> = new Map();

    constructor() {
        this.pane = new Pane();
    }

    public registerComponentControls(componentName: string, data: any) {
        // Tweakpane's addFolder is a method of the Pane instance
        const folder = (this.pane as any).addFolder({ title: componentName }); // Type assertion to any
        this.folders.set(componentName, folder);
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                folder.addBinding(data, key);
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